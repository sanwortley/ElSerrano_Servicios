from datetime import datetime, date
from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from src.db import get_db
from src.models.business import PedidoIndividual, ServicioFrecuente, Pago
from src.models.users import Chofer
from src.models.enums import EstadoPedido, EstadoFrecuente
from src.deps import get_current_active_user
from src.models.users import Usuario
from src.utils.time_utils import get_now_arg

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    now = get_now_arg()
    today = now.date()
    
    # 1. Active Pedidos (Individual)
    stmt_ped = select(func.count(PedidoIndividual.id)).where(
        PedidoIndividual.estado.in_([EstadoPedido.CREADA, EstadoPedido.ASIGNADA, EstadoPedido.EN_CAMINO])
    )
    res_ped = await db.execute(stmt_ped)
    active_pedidos = res_ped.scalar() or 0

    # Breakdown by service type
    stmt_breakdown = select(PedidoIndividual.tipo_servicio, func.count(PedidoIndividual.id)).where(
        PedidoIndividual.estado.in_([EstadoPedido.CREADA, EstadoPedido.ASIGNADA, EstadoPedido.EN_CAMINO])
    ).group_by(PedidoIndividual.tipo_servicio)
    res_breakdown = await db.execute(stmt_breakdown)
    breakdown_pedidos = {row.tipo_servicio: row[1] for row in res_breakdown.all()}
    
    # 2. Frequent services
    stmt_freq = select(func.count(ServicioFrecuente.id)).where(ServicioFrecuente.estado == EstadoFrecuente.ACTIVO)
    res_freq = await db.execute(stmt_freq)
    active_frecuentes = res_freq.scalar() or 0
    
    # 3. Income today
    stmt_pago = select(func.sum(Pago.monto)).where(func.date(Pago.fecha) == today)
    res_pago = await db.execute(stmt_pago)
    income_today = res_pago.scalar() or 0
    
    # 4. Total Drivers
    stmt_chofer = select(func.count(Chofer.id))
    res_chofer = await db.execute(stmt_chofer)
    total_choferes = res_chofer.scalar() or 0

    return {
        "active_pedidos": active_pedidos,
        "active_frecuentes": active_frecuentes,
        "income_today": float(income_today),
        "total_choferes": total_choferes,
        "breakdown": breakdown_pedidos,
        "date": today.isoformat()
    }
