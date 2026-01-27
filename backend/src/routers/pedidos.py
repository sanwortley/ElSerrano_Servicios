from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.db import get_db
from src.models.business import PedidoIndividual, Pago
from src.models.enums import Rol, EstadoPedido
from src.models.users import Usuario, Chofer
from src.schemas.all import PedidoRead, PedidoCreate, PagoCreate, PagoRead
from src.deps import get_current_active_user
from src.utils.geo import get_lat_lng, find_zone_for_point

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])

def check_staff_or_admin(user: Usuario):
    if user.rol not in [Rol.ADMIN, Rol.RECEPCIONISTA]:
         raise HTTPException(status_code=403, detail="Not authorized")

@router.post("/", response_model=PedidoRead)
async def create_pedido(
    pedido: PedidoCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff_or_admin(current_user)
    
    # Geocoding & Zoning Hook
    lat = pedido.lat
    lng = pedido.lng
    
    if lat is None or lng is None:
        lat, lng = await get_lat_lng(pedido.direccion, db)
        
    zona_id = pedido.zona_id
    if not zona_id and lat and lng:
        zona_id = await find_zone_for_point(lat, lng, db)
    
    new_pedido = PedidoIndividual(
        cliente_id=pedido.cliente_id,
        tipo_servicio=pedido.tipo_servicio,
        direccion=pedido.direccion,
        lat=lat,
        lng=lng,
        zona_id=zona_id,
        descripcion=pedido.descripcion,
        costo=pedido.costo,
        fecha_hora_ejecucion=pedido.fecha_hora_ejecucion.replace(tzinfo=None) if pedido.fecha_hora_ejecucion else None,
        recepcionista_id=current_user.id,
        orden_en_ruta=pedido.orden_en_ruta
    )
    
    db.add(new_pedido)
    await db.commit()
    await db.refresh(new_pedido)
    
    # Reload for response
    stmt = select(PedidoIndividual)\
        .where(PedidoIndividual.id == new_pedido.id)\
        .options(
            selectinload(PedidoIndividual.cliente), 
            selectinload(PedidoIndividual.zona), 
            selectinload(PedidoIndividual.chofer).selectinload(Chofer.usuario)
        )
    result = await db.execute(stmt)
    return result.scalar_one()

@router.get("/", response_model=List[PedidoRead])
async def read_pedidos(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    # Staff sees all, Driver sees assigned
    stmt = select(PedidoIndividual).options(
        selectinload(PedidoIndividual.cliente), 
        selectinload(PedidoIndividual.zona), 
        selectinload(PedidoIndividual.chofer).selectinload(Chofer.usuario)
    )
    
    if current_user.rol == Rol.CHOFER:
        # Get chofer profile
        chofer_stmt = select(Chofer).where(Chofer.usuario_id == current_user.id)
        chofer_result = await db.execute(chofer_stmt)
        chofer = chofer_result.scalar_one_or_none()
        if chofer:
            stmt = stmt.where(PedidoIndividual.chofer_id == chofer.id)
        else:
            # If no chofer profile, return empty list
            return []

    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{pedido_id}", response_model=PedidoRead)
async def read_pedido(
    pedido_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    stmt = select(PedidoIndividual).where(PedidoIndividual.id == pedido_id).options(
        selectinload(PedidoIndividual.cliente), 
        selectinload(PedidoIndividual.zona), 
        selectinload(PedidoIndividual.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    pedido = result.scalar_one_or_none()
    
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido not found")
        
    if current_user.rol == Rol.CHOFER:
        if pedido.chofer_id != current_user.chofer_perfil.id:
             raise HTTPException(status_code=403, detail="Not authorized")
             
    return pedido

@router.put("/{pedido_id}", response_model=PedidoRead)
async def update_pedido(
    pedido_id: int,
    pedido_upd: PedidoCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff_or_admin(current_user)
    
    stmt = select(PedidoIndividual).where(PedidoIndividual.id == pedido_id)
    result = await db.execute(stmt)
    db_pedido = result.scalar_one_or_none()
    if not db_pedido:
        raise HTTPException(status_code=404, detail="Pedido not found")

    # Geocode Hook if address changes or it was never set
    if pedido_upd.lat is not None and pedido_upd.lng is not None:
        db_pedido.lat = pedido_upd.lat
        db_pedido.lng = pedido_upd.lng
        if not pedido_upd.zona_id:
            db_pedido.zona_id = await find_zone_for_point(db_pedido.lat, db_pedido.lng, db)
        else:
            db_pedido.zona_id = pedido_upd.zona_id
    elif pedido_upd.direccion != db_pedido.direccion:
        lat, lng = await get_lat_lng(pedido_upd.direccion, db)
        zona_id = None
        if lat and lng:
            zona_id = await find_zone_for_point(lat, lng, db)
        db_pedido.lat = lat
        db_pedido.lng = lng
        db_pedido.zona_id = zona_id
        
    db_pedido.cliente_id = pedido_upd.cliente_id
    db_pedido.tipo_servicio = pedido_upd.tipo_servicio
    db_pedido.direccion = pedido_upd.direccion
    db_pedido.descripcion = pedido_upd.descripcion
    db_pedido.costo = pedido_upd.costo
    db_pedido.fecha_hora_ejecucion = pedido_upd.fecha_hora_ejecucion.replace(tzinfo=None) if pedido_upd.fecha_hora_ejecucion else None
    db_pedido.orden_en_ruta = pedido_upd.orden_en_ruta
    
    await db.commit()
    await db.refresh(db_pedido)
    
    # Reload relationships for PedidoRead
    stmt = select(PedidoIndividual).where(PedidoIndividual.id == pedido_id).options(
        selectinload(PedidoIndividual.cliente), 
        selectinload(PedidoIndividual.zona), 
        selectinload(PedidoIndividual.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    return result.scalar_one()

@router.patch("/{pedido_id}/estado", response_model=PedidoRead)
async def update_estado_pedido(
    pedido_id: int,
    estado: EstadoPedido,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    stmt = select(PedidoIndividual).where(PedidoIndividual.id == pedido_id).options(
        selectinload(PedidoIndividual.cliente), 
        selectinload(PedidoIndividual.zona), 
        selectinload(PedidoIndividual.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido not found")
        
    if current_user.rol == Rol.CHOFER:
        # Check ownership
        if pedido.chofer_id != current_user.chofer_perfil.id:
            raise HTTPException(status_code=403, detail="Not authorized")
            
    pedido.estado = estado
    await db.commit()
    
    # Re-load with relationships because refresh() expires them
    stmt = select(PedidoIndividual).where(PedidoIndividual.id == pedido_id).options(
        selectinload(PedidoIndividual.cliente), 
        selectinload(PedidoIndividual.zona), 
        selectinload(PedidoIndividual.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    pedido = result.scalar_one()
    return pedido

@router.patch("/{pedido_id}/chofer", response_model=PedidoRead)
async def assign_driver_pedido(
    pedido_id: int,
    chofer_id: Optional[int],
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff_or_admin(current_user)
    
    stmt = select(PedidoIndividual).where(PedidoIndividual.id == pedido_id).options(
        selectinload(PedidoIndividual.cliente), 
        selectinload(PedidoIndividual.zona), 
        selectinload(PedidoIndividual.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido not found")
        
    pedido.chofer_id = chofer_id
    if chofer_id and pedido.estado == EstadoPedido.CREADA:
        pedido.estado = EstadoPedido.ASIGNADA
        
    await db.commit()
    
    # Re-load with relationships
    stmt = select(PedidoIndividual).where(PedidoIndividual.id == pedido_id).options(
        selectinload(PedidoIndividual.cliente), 
        selectinload(PedidoIndividual.zona), 
        selectinload(PedidoIndividual.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    pedido = result.scalar_one()
    return pedido

@router.post("/{pedido_id}/pagos", response_model=PagoRead)
async def create_pago(
    pedido_id: int,
    pago: PagoCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff_or_admin(current_user)
    
    stmt = select(PedidoIndividual).where(PedidoIndividual.id == pedido_id)
    result = await db.execute(stmt)
    db_pedido = result.scalar_one_or_none()
    if not db_pedido:
         raise HTTPException(status_code=404, detail="Pedido not found")
    
    new_pago = Pago(
        pedido_id=pedido_id,
        monto=pago.monto,
        metodo_pago=pago.metodo_pago,
        registrado_por=current_user.id
    )
    db_pedido.estado = EstadoPedido.COMPLETADA
    
    db.add(new_pago)
    await db.commit()
    await db.refresh(new_pago)
    return new_pago

@router.delete("/{pedido_id}")
async def delete_pedido(
    pedido_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff_or_admin(current_user)
    stmt = select(PedidoIndividual).where(PedidoIndividual.id == pedido_id)
    result = await db.execute(stmt)
    pedido = result.scalar_one_or_none()
    if not pedido:
        raise HTTPException(status_code=404, detail="Pedido not found")
    
    await db.delete(pedido)
    await db.commit()
    return {"ok": True}
