from datetime import datetime, date
from typing import Annotated, Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from src.db import get_db
from src.models.business import Pago, PedidoIndividual, ServicioFrecuente
from src.models.enums import MetodoPago, Rol, EstadoPedido
from src.models.users import Usuario
from src.deps import get_current_active_user

from src.schemas.all import SesionTrabajoRead

router = APIRouter(prefix="/balances", tags=["Balances"])

@router.get("/semanal")
async def get_balance_semanal(
    desde: datetime,
    hasta: datetime,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    if current_user.rol not in [Rol.ADMIN, Rol.RECEPCIONISTA]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    # Ensure naive datetimes for SQL comparison
    desde = desde.replace(tzinfo=None) if desde else desde
    hasta = hasta.replace(tzinfo=None) if hasta else hasta

    # 1. Ingresos (Pagos registrados)
    stmt = select(Pago.metodo_pago, func.sum(Pago.monto).label("total"))\
        .where(Pago.fecha >= desde, Pago.fecha <= hasta)\
        .group_by(Pago.metodo_pago)
        
    result = await db.execute(stmt)
    breakdown = result.all()
    total_ingresos = sum(row.total for row in breakdown)

    # 2. Gastos (Registrados por choferes u otros)
    from src.models.business import Gasto
    stmt_gastos = select(Gasto.categoria, func.sum(Gasto.monto).label("total"))\
        .where(Gasto.fecha >= desde, Gasto.fecha <= hasta)\
        .group_by(Gasto.categoria)
    res_gastos = await db.execute(stmt_gastos)
    gastos_breakdown = res_gastos.all()
    total_gastos = sum(row.total for row in gastos_breakdown)

    # 3. Precio del trabajo (Costo de pedidos finalizados en el periodo)
    # Esto es lo que se "facturó" o el valor del trabajo realizado
    stmt_trabajo = select(func.sum(PedidoIndividual.costo))\
        .where(
            PedidoIndividual.estado.in_([EstadoPedido.COMPLETADA, EstadoPedido.FINALIZADO]),
            PedidoIndividual.actualizado_en >= desde,
            PedidoIndividual.actualizado_en <= hasta
        )
    res_trabajo = await db.execute(stmt_trabajo)
    total_trabajo = res_trabajo.scalar() or 0

    return {
        "desde": desde,
        "hasta": hasta,
        "total_ingresos": total_ingresos,
        "detalle_ingresos": [{ "metodo": row.metodo_pago, "monto": row.total } for row in breakdown],
        "total_gastos": total_gastos,
        "detalle_gastos": [{ "categoria": row.categoria, "monto": row.total } for row in gastos_breakdown],
        "total_trabajo": total_trabajo,
        "balance_neto": total_ingresos - total_gastos
    }

@router.get("/pagos")
async def get_pagos_recientes(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)],
    limit: int = 50
):
    if current_user.rol not in [Rol.ADMIN, Rol.RECEPCIONISTA]:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    stmt = select(Pago).order_by(Pago.fecha.desc()).limit(limit).options(
        selectinload(Pago.pedido).selectinload(PedidoIndividual.cliente),
        selectinload(Pago.frecuente).selectinload(ServicioFrecuente.cliente),
        selectinload(Pago.registrador)
    )
    result = await db.execute(stmt)
    pagos = result.scalars().all()
    
    return [{
        "id": p.id,
        "fecha": p.fecha,
        "monto": p.monto,
        "metodo": p.metodo_pago,
        "cliente": (p.pedido.cliente.nombre if p.pedido else (p.frecuente.cliente.nombre if p.frecuente else "Externo")),
        "servicio": ("Individual" if p.pedido else "Frecuente"),
        "registrado_por": p.registrador.nombre if p.registrador else "Sistema"
    } for p in pagos]
from datetime import timedelta

@router.get("/charts/daily")
async def get_daily_charts(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)],
    days: int = 30
):
    if current_user.rol not in [Rol.ADMIN, Rol.RECEPCIONISTA]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    today = date.today()
    start_date = today - timedelta(days=days)
    
    # 1. Daily Income & Expenses merged into a single timeline
    # Using a dictionary to easily merge data by day
    stats_by_day = {}
    
    # Init days
    for i in range(days + 1):
        d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        stats_by_day[d] = {
            "name": d,
            "ingresos": 0.0,
            "gastos": 0.0,
            "individuales": 0,
            "frecuentes": 0
        }

    # Income
    stmt_income = select(func.date(Pago.fecha).label("day"), func.sum(Pago.monto).label("total"))\
        .where(Pago.fecha >= start_date)\
        .group_by("day")
    res_income = await db.execute(stmt_income)
    for row in res_income.all():
        d_str = str(row.day)
        if d_str in stats_by_day:
            stats_by_day[d_str]["ingresos"] = float(row.total or 0)
    
    # Expenses
    from src.models.business import Gasto
    stmt_expenses = select(func.date(Gasto.fecha).label("day"), func.sum(Gasto.monto).label("total"))\
        .where(Gasto.fecha >= start_date)\
        .group_by("day")
    res_expenses = await db.execute(stmt_expenses)
    for row in res_expenses.all():
        d_str = str(row.day)
        if d_str in stats_by_day:
            stats_by_day[d_str]["gastos"] = float(row.total or 0)

    # 2. Daily Orders Counts (Individuales)
    stmt_ind = select(func.date(PedidoIndividual.creado_en).label("day"), func.count(PedidoIndividual.id).label("count"))\
        .where(PedidoIndividual.creado_en >= start_date)\
        .group_by("day")
    res_ind = await db.execute(stmt_ind)
    for row in res_ind.all():
        d_str = str(row.day)
        if d_str in stats_by_day:
            stats_by_day[d_str]["individuales"] = int(row.count or 0)

    # 3. Daily Orders Counts (Frecuentes)
    # Since we don't have a history table for cleanings, we'll count Pago records linked to frecuentes 
    # as a proxy for completed services, or just created date if that's what's available.
    # Let's use Pago records as proxy for "realized" services if they exist, 
    # otherwise count by created_en of the service.
    stmt_freq = select(func.date(Pago.fecha).label("day"), func.count(Pago.id).label("count"))\
        .where(Pago.fecha >= start_date, Pago.frecuente_id != None)\
        .group_by("day")
    res_freq = await db.execute(stmt_freq)
    for row in res_freq.all():
        d_str = str(row.day)
        if d_str in stats_by_day:
            stats_by_day[d_str]["frecuentes"] = int(row.count or 0)

    # 4. Driver Hours
    from src.models.users import SesionTrabajo, Chofer
    stmt_hours = select(
        func.date(SesionTrabajo.inicio).label("day"),
        Usuario.nombre.label("chofer"),
        func.sum(SesionTrabajo.total_horas).label("horas")
    ).join(Chofer, SesionTrabajo.chofer_id == Chofer.id)\
     .join(Usuario, Chofer.usuario_id == Usuario.id)\
     .where(SesionTrabajo.inicio >= start_date, SesionTrabajo.fin != None)\
     .group_by("day", "chofer")
     
    res_hours = await db.execute(stmt_hours)
    hours_raw = res_hours.all()
    
    # Process hours_data for a multi-line chart or separate entries
    # Recharts likes: { name: '2023-10-01', Chofer1: 8, Chofer2: 7 }
    hours_by_day = {}
    for i in range(days + 1):
        d = (start_date + timedelta(days=i)).strftime("%Y-%m-%d")
        hours_by_day[d] = { "name": d }

    choferes_names = set()
    for row in hours_raw:
        d_str = str(row.day)
        if d_str in hours_by_day:
            hours_by_day[d_str][row.chofer] = float(row.horas or 0)
            choferes_names.add(row.chofer)

    return {
        "daily_stats": list(stats_by_day.values()),
        "hours_data": list(hours_by_day.values()),
        "choferes": list(choferes_names)
    }

@router.get("/chofer/sessions", response_model=List[SesionTrabajoRead])
async def get_driver_work_sessions(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    if current_user.rol != Rol.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    from src.models.users import SesionTrabajo, Chofer, Usuario
    from sqlalchemy.orm import selectinload
    
    stmt = select(SesionTrabajo).options(
        selectinload(SesionTrabajo.chofer).selectinload(Chofer.usuario)
    ).order_by(SesionTrabajo.inicio.desc())
    
    result = await db.execute(stmt)
    sessions = result.scalars().all()
    
    # Flatten data for the schema
    res = []
    for s in sessions:
        read_obj = SesionTrabajoRead.model_validate(s)
        read_obj.chofer_nombre = s.chofer.usuario.nombre
        res.append(read_obj)
        
    return res
