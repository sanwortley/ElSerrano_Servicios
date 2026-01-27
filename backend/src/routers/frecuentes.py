from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.db import get_db
from src.models.business import ServicioFrecuente, Pago
from src.models.enums import Rol, EstadoFrecuente
from src.models.users import Usuario, Chofer
from src.utils.time_utils import get_now_arg
from src.schemas.all import FrecuenteRead, FrecuenteCreate, PagoCreate, PagoRead
from src.deps import get_current_active_user
from src.utils.geo import get_lat_lng, find_zone_for_point

router = APIRouter(prefix="/frecuentes", tags=["Servicios Frecuentes"])

DAYS_MAP = {
    0: "Lunes",
    1: "Martes",
    2: "Miércoles",
    3: "Jueves",
    4: "Viernes",
    5: "Sábado",
    6: "Domingo"
}

@router.get("/agenda/hoy", response_model=List[FrecuenteRead])
async def get_agenda_hoy(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    now = get_now_arg()
    today_name = DAYS_MAP[now.weekday()]
    
    # Select all active frequent services
    stmt = select(ServicioFrecuente).where(
        ServicioFrecuente.estado == EstadoFrecuente.ACTIVO
    ).options(
        selectinload(ServicioFrecuente.cliente),
        selectinload(ServicioFrecuente.zona),
        selectinload(ServicioFrecuente.chofer).selectinload(Chofer.usuario)
    )
    
    result = await db.execute(stmt)
    all_active = result.scalars().all()
    
    # Filter by today's day in dias_semana JSON
    # Since it's a small number of services usually, we can filter in python or use JSON_CONTAINS if specialized
    today_agenda = [f for f in all_active if today_name in f.dias_semana]
    
    return today_agenda


def check_staff(user: Usuario):
    if user.rol not in [Rol.ADMIN, Rol.RECEPCIONISTA]:
         raise HTTPException(status_code=403, detail="Not authorized")

@router.post("/", response_model=FrecuenteRead)
async def create_frecuente(
    frecuente: FrecuenteCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff(current_user)
    
    lat = frecuente.lat
    lng = frecuente.lng
    if lat is None or lng is None:
        lat, lng = await get_lat_lng(frecuente.direccion, db)
        
    zona_id = frecuente.zona_id
    if not zona_id and lat and lng:
        zona_id = await find_zone_for_point(lat, lng, db)
        
    # server side calc total? 
    # Logic: costo_individual * cantidad? Or just store what is passed? 
    # Model says: total (calculado server-side)
    # The prompt doesn't specify formula precisely, assume per month? Or per service?
    total = frecuente.costo_individual * frecuente.cantidad
    
    # Ensure naive datetimes for PostgreSQL TIMESTAMP WITHOUT TIME ZONE
    f_inicio = frecuente.fecha_inicio.replace(tzinfo=None) if frecuente.fecha_inicio else None
    f_fin = frecuente.fecha_fin.replace(tzinfo=None) if frecuente.fecha_fin else None

    new_freq = ServicioFrecuente(
        cliente_id=frecuente.cliente_id,
        tipo_servicio=frecuente.tipo_servicio,
        direccion=frecuente.direccion,
        lat=lat,
        lng=lng,
        zona_id=zona_id,
        telefono=frecuente.telefono,
        cantidad=frecuente.cantidad,
        costo_individual=frecuente.costo_individual,
        total=total,
        fecha_inicio=f_inicio,
        fecha_fin=f_fin,
        dias_semana=frecuente.dias_semana,
        orden_en_ruta=frecuente.orden_en_ruta
    )
    db.add(new_freq)
    try:
        await db.commit()
    except Exception as e:
        print(f"!!! DB COMMIT FAILED: {e}")
        # Force re-raise to show in logs
        raise HTTPException(status_code=500, detail=str(e))
        
    await db.refresh(new_freq)
    
    stmt = select(ServicioFrecuente).where(ServicioFrecuente.id == new_freq.id).options(
        selectinload(ServicioFrecuente.cliente), 
        selectinload(ServicioFrecuente.zona), 
        selectinload(ServicioFrecuente.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    return result.scalar_one()

@router.get("/", response_model=List[FrecuenteRead])
async def read_frecuentes(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    stmt = select(ServicioFrecuente).options(
        selectinload(ServicioFrecuente.cliente), 
        selectinload(ServicioFrecuente.zona), 
        selectinload(ServicioFrecuente.chofer).selectinload(Chofer.usuario)
    )
    if current_user.rol == Rol.CHOFER:
        stmt = stmt.where(ServicioFrecuente.chofer_id == current_user.chofer_perfil.id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/{id}", response_model=FrecuenteRead)
async def update_frecuente(
    id: int,
    frec_upd: FrecuenteCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff(current_user)
    stmt = select(ServicioFrecuente).where(ServicioFrecuente.id == id)
    result = await db.execute(stmt)
    db_freq = result.scalar_one_or_none()
    if not db_freq:
        raise HTTPException(status_code=404, detail="Service not found")
        
    if frec_upd.lat is not None and frec_upd.lng is not None:
         db_freq.lat = frec_upd.lat
         db_freq.lng = frec_upd.lng
         if not frec_upd.zona_id:
             db_freq.zona_id = await find_zone_for_point(db_freq.lat, db_freq.lng, db)
         else:
             db_freq.zona_id = frec_upd.zona_id
    elif frec_upd.direccion != db_freq.direccion:
         lat, lng = await get_lat_lng(frec_upd.direccion, db)
         zona_id = None
         if lat and lng:
             zona_id = await find_zone_for_point(lat, lng, db)
         db_freq.lat = lat
         db_freq.lng = lng
         db_freq.zona_id = zona_id
    
    db_freq.cliente_id = frec_upd.cliente_id
    db_freq.tipo_servicio = frec_upd.tipo_servicio
    db_freq.direccion = frec_upd.direccion
    db_freq.telefono = frec_upd.telefono
    db_freq.cantidad = frec_upd.cantidad
    db_freq.costo_individual = frec_upd.costo_individual
    db_freq.total = frec_upd.costo_individual * frec_upd.cantidad
    db_freq.fecha_inicio = frec_upd.fecha_inicio.replace(tzinfo=None) if frec_upd.fecha_inicio else None
    db_freq.fecha_fin = frec_upd.fecha_fin.replace(tzinfo=None) if frec_upd.fecha_fin else None
    db_freq.dias_semana = frec_upd.dias_semana
    db_freq.dia_saliente = frec_upd.dia_saliente
    db_freq.orden_en_ruta = frec_upd.orden_en_ruta
    
    await db.commit()
    await db.refresh(db_freq)
    
    stmt = select(ServicioFrecuente).where(ServicioFrecuente.id == id).options(
        selectinload(ServicioFrecuente.cliente), 
        selectinload(ServicioFrecuente.zona), 
        selectinload(ServicioFrecuente.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    return result.scalar_one()

@router.patch("/{id}/estado", response_model=FrecuenteRead)
async def update_estado_frecuente(
    id: int,
    estado: EstadoFrecuente,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    stmt = select(ServicioFrecuente).where(ServicioFrecuente.id == id).options(
        selectinload(ServicioFrecuente.cliente), 
        selectinload(ServicioFrecuente.zona), 
        selectinload(ServicioFrecuente.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    freq = result.scalar_one_or_none()
    if not freq:
        raise HTTPException(status_code=404, detail="Service not found")
        
    if current_user.rol == Rol.CHOFER:
         # Chofer can change state? Seems implied ("cambio de estado").
         if freq.chofer_id != current_user.chofer_perfil.id:
              raise HTTPException(status_code=403, detail="Not authorized")
    
    freq.estado = estado
    await db.commit()
    await db.refresh(freq)
    return freq

@router.patch("/{id}/toggle", response_model=FrecuenteRead)
async def toggle_frecuente(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff(current_user)
    stmt = select(ServicioFrecuente).where(ServicioFrecuente.id == id).options(
        selectinload(ServicioFrecuente.cliente), 
        selectinload(ServicioFrecuente.zona), 
        selectinload(ServicioFrecuente.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    freq = result.scalar_one_or_none()
    if not freq:
        raise HTTPException(status_code=404, detail="Service not found")
        
    freq.estado = EstadoFrecuente.PAUSADO if freq.estado == EstadoFrecuente.ACTIVO else EstadoFrecuente.ACTIVO
    await db.commit()
    await db.refresh(freq)
    return freq

@router.post("/{id}/pagos", response_model=PagoRead)
async def create_pago_frecuente(
    id: int,
    pago: PagoCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff(current_user)
    stmt = select(ServicioFrecuente).where(ServicioFrecuente.id == id)
    if not (await db.execute(stmt)).scalar_one_or_none():
         raise HTTPException(status_code=404, detail="Service not found")
         
    new_pago = Pago(
        frecuente_id=id, # Ensure validation XOR in logic if needed, but schema separates.
        monto=pago.monto,
        metodo_pago=pago.metodo_pago,
        registrado_por=current_user.id
    )
    db.add(new_pago)
    await db.commit()
    await db.refresh(new_pago)
    return new_pago

@router.delete("/{id}")
async def delete_frecuente(
    id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff(current_user)
    stmt = select(ServicioFrecuente).where(ServicioFrecuente.id == id)
    result = await db.execute(stmt)
    freq = result.scalar_one_or_none()
    if not freq:
        raise HTTPException(status_code=404, detail="Service not found")
    
    await db.delete(freq)
    await db.commit()
    return {"ok": True}

@router.patch("/{id}/chofer", response_model=FrecuenteRead)
async def assign_driver_frecuente(
    id: int,
    chofer_id: Optional[int],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff(current_user)
    
    stmt = select(ServicioFrecuente).where(ServicioFrecuente.id == id).options(
        selectinload(ServicioFrecuente.cliente), 
        selectinload(ServicioFrecuente.zona), 
        selectinload(ServicioFrecuente.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    freq = result.scalar_one_or_none()
    if not freq:
        raise HTTPException(status_code=404, detail="Service not found")
        
    freq.chofer_id = chofer_id
    await db.commit()
    await db.refresh(freq)
    return freq
