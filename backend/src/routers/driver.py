from datetime import datetime
from typing import Annotated, List, Optional, Any
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from pydantic import BaseModel
from src.db import get_db
from src.models.geo import RutaDia, Zona
from src.models.business import PedidoIndividual, ServicioFrecuente
from src.models.enums import Rol, EstadoPedido, EstadoFrecuente
from src.models.users import Usuario, Chofer
from src.schemas.all import PedidoRead, FrecuenteRead, ZonaRead, ChoferRead
from src.deps import get_current_active_user
from src.utils.optimization import sort_by_nearest_neighbor
from src.utils.time_utils import get_now_arg

router = APIRouter(prefix="/chofer", tags=["Chofer"])

class DriverTodayResponse(BaseModel):
    fecha: str
    dia_semana: int
    zona_de_hoy: Optional[ZonaRead]
    pedidos: List[PedidoRead]
    frecuentes: List[FrecuenteRead]

@router.get("/choferes", response_model=List[ChoferRead])
async def list_choferes(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    from src.models.users import Chofer
    stmt = select(Chofer).options(selectinload(Chofer.usuario))
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/hoy", response_model=DriverTodayResponse)
async def get_driver_today(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    if current_user.rol != Rol.CHOFER:
         raise HTTPException(status_code=403, detail="Only drivers access this")
         
    # Ensure chofer profile is loaded
    if not current_user.chofer_perfil:
        stmt_chofer = select(Chofer).where(Chofer.usuario_id == current_user.id)
        res_chofer = await db.execute(stmt_chofer)
        chofer = res_chofer.scalar_one_or_none()
        if not chofer:
            raise HTTPException(status_code=404, detail="Chofer profile not found")
        current_user.chofer_perfil = chofer
         
    today = datetime.now()
    dia_semana = today.weekday() # 0=Monday
    
    # 1. Determine Zone
    # Check specific rule
    stmt = select(RutaDia).where(
        RutaDia.dia_semana == dia_semana, 
        RutaDia.chofer_id == current_user.chofer_perfil.id,
        RutaDia.activo == True
    ).options(selectinload(RutaDia.zona))
    
    result = await db.execute(stmt)
    ruta = result.scalar_one_or_none()
    
    # If not, general rule
    if not ruta:
        stmt = select(RutaDia).where(
            RutaDia.dia_semana == dia_semana, 
            RutaDia.chofer_id == None,
            RutaDia.activo == True
        ).options(selectinload(RutaDia.zona))
        result = await db.execute(stmt)
        # Take first one?
        ruta = result.scalars().first()
        
    zona_hoy = ruta.zona if ruta else None
    zona_id_val = zona_hoy.id if zona_hoy else -1
    
    print(f"DEBUG HOY: User {current_user.nombre}, Profile ID {current_user.chofer_perfil.id}")
    
    # Individuales: Asignados, relevant states (including completed for today's view)
    stmt_ped = select(PedidoIndividual)\
        .where(
            PedidoIndividual.chofer_id == current_user.chofer_perfil.id,
            PedidoIndividual.estado.in_([
                EstadoPedido.CREADA, 
                EstadoPedido.ASIGNADA, 
                EstadoPedido.EN_CAMINO, 
                EstadoPedido.COMPLETADA,
                EstadoPedido.FINALIZADO
            ])
        )\
        .options(
            selectinload(PedidoIndividual.cliente), 
            selectinload(PedidoIndividual.zona), 
            selectinload(PedidoIndividual.chofer).selectinload(Chofer.usuario)
        )
        
    pedidos = (await db.execute(stmt_ped)).scalars().all()
    print(f"DEBUG HOY: Found {len(pedidos)} individual pedidos for chofer {current_user.chofer_perfil.id}")
    
    # 3. Get Frecuentes
    # Activo, assigned, day matches
    stmt_freq = select(ServicioFrecuente)\
        .where(
            ServicioFrecuente.chofer_id == current_user.chofer_perfil.id,
            ServicioFrecuente.estado.in_([EstadoFrecuente.ACTIVO, EstadoFrecuente.COMPLETADA])
        )\
        .options(
            selectinload(ServicioFrecuente.cliente), 
            selectinload(ServicioFrecuente.zona), 
            selectinload(ServicioFrecuente.chofer).selectinload(Chofer.usuario)
        )
        
    all_frec = (await db.execute(stmt_freq)).scalars().all()
    print(f"DEBUG HOY: Found {len(all_frec)} frequent services for chofer {current_user.chofer_perfil.id}")
    
    # Filter by day overlap in Python
    # now we use strings "Lunes", etc. but dia_semana is 0-6
    dias_map = {0: "Lunes", 1: "Martes", 2: "Miércoles", 3: "Jueves", 4: "Viernes", 5: "Sábado", 6: "Domingo"}
    hoy_str = dias_map.get(dia_semana)
    frecuentes_hoy = [f for f in all_frec if hoy_str in f.dias_semana]
    
    # 4. Sort
    # We prioritize manual order if 'orden_en_ruta' is not None. 
    # If not set, we use the optimizer.
    
    def intelligent_sort(items):
        manual = [i for i in items if i.orden_en_ruta is not None]
        automatic = [i for i in items if i.orden_en_ruta is None]
        manual.sort(key=lambda x: x.orden_en_ruta)
        # We assume manual route starts at 1. If there's automatic stuff, we append it via nearest neighbor starting from last manual or depot.
        # For simplicity, just concat manual + optimized automatic.
        return manual + sort_by_nearest_neighbor(automatic)

    sorted_pedidos = intelligent_sort(list(pedidos))
    sorted_frecuentes = intelligent_sort(list(frecuentes_hoy))
    
    print(f"DEBUG: Chofer {current_user.nombre} (ID {current_user.chofer_perfil.id}) -> Pedidos: {len(pedidos)}, Frecuentes: {len(frecuentes_hoy)}")
    
    return DriverTodayResponse(
        fecha=today.strftime("%Y-%m-%d"),
        dia_semana=dia_semana,
        zona_de_hoy=zona_hoy,
        pedidos=sorted_pedidos,
        frecuentes=sorted_frecuentes
    )
@router.post("/shift/start")
async def start_shift(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    from src.models.users import SesionTrabajo
    if current_user.rol != Rol.CHOFER or not current_user.chofer_perfil:
        raise HTTPException(status_code=403, detail="Only drivers can start shifts")
    
    # Check if there's already an open session
    stmt = select(SesionTrabajo).where(
        SesionTrabajo.chofer_id == current_user.chofer_perfil.id,
        SesionTrabajo.fin == None
    )
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Shift already in progress")
    
    new_session = SesionTrabajo(
        chofer_id=current_user.chofer_perfil.id,
        inicio=get_now_arg()
    )
    db.add(new_session)
    await db.commit()
    return {"status": "Shift started", "inicio": new_session.inicio}

@router.post("/shift/stop")
async def stop_shift(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    from src.models.users import SesionTrabajo
    if current_user.rol != Rol.CHOFER or not current_user.chofer_perfil:
        raise HTTPException(status_code=403, detail="Only drivers can stop shifts")
    
    stmt = select(SesionTrabajo).where(
        SesionTrabajo.chofer_id == current_user.chofer_perfil.id,
        SesionTrabajo.fin == None
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    
    if not session:
        raise HTTPException(status_code=400, detail="No active shift found")
    
    session.fin = get_now_arg()
    # Calculate hours
    diff = session.fin - session.inicio
    session.total_horas = diff.total_seconds() / 3600.0
    
    await db.commit()
    print(f"ADMIN LOG: Chofer {current_user.nombre} finalizó turno. Trabajó {session.total_horas:.2f} horas.")
    return {"status": "Shift stopped", "horas": session.total_horas}

@router.get("/shift/status")
async def get_shift_status(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    from src.models.users import SesionTrabajo
    if current_user.rol != Rol.CHOFER or not current_user.chofer_perfil:
        return {"active": False}
    
    stmt = select(SesionTrabajo).where(
        SesionTrabajo.chofer_id == current_user.chofer_perfil.id,
        SesionTrabajo.fin == None
    )
    result = await db.execute(stmt)
    session = result.scalar_one_or_none()
    
    return {
        "active": session is not None,
        "inicio": session.inicio if session else None
    }
    
class GastoCreate(BaseModel):
    monto: float
    categoria: str
    descripcion: Optional[str] = None
    chofer_id: Optional[int] = None

@router.post("/gastos")
async def register_expense(
    expense_in: GastoCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    from src.models.business import Gasto
    new_gasto = Gasto(
        monto=expense_in.monto,
        categoria=expense_in.categoria,
        descripcion=expense_in.descripcion,
        chofer_id=current_user.chofer_perfil.id if current_user.rol == Rol.CHOFER else expense_in.chofer_id,
        registrado_por=current_user.id
    )
    db.add(new_gasto)
    await db.commit()
    return {"status": "Gasto registrado"}
