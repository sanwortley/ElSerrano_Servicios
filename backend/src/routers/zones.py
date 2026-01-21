from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.models.geo import Zona
from src.schemas.all import ZonaRead, ZonaCreate
from src.deps import get_admin_user

from src.utils.geo import get_lat_lng, find_zone_for_point

router = APIRouter(prefix="/zonas", tags=["Zonas"])

@router.get("/detect")
async def detect_zone(
    direccion: str,
    db: Annotated[AsyncSession, Depends(get_db)]
):
    lat, lng = await get_lat_lng(direccion, db)
    if not (lat and lng):
        return {"zona": None, "msg": "Dirección no encontrada"}
    
    zona_id = await find_zone_for_point(lat, lng, db)
    if not zona_id:
        return {"zona": None, "msg": "Fuera de zona operativa"}
    
    stmt = select(Zona).where(Zona.id == zona_id)
    result = await db.execute(stmt)
    zona = result.scalar_one()
    return {"zona": zona}

@router.post("/", response_model=ZonaRead)
async def create_zona(
    zona: ZonaCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin=Depends(get_admin_user)
):
    new_zona = Zona(
        nombre=zona.nombre,
        polygon_geojson=zona.polygon_geojson,
        dias_operativos=zona.dias_operativos,
        activo=zona.activo
    )
    db.add(new_zona)
    await db.commit()
    await db.refresh(new_zona)
    return new_zona

@router.get("/", response_model=List[ZonaRead])
async def read_zonas(
    db: Annotated[AsyncSession, Depends(get_db)],
    admin=Depends(get_admin_user)
):
    stmt = select(Zona)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/{zona_id}", response_model=ZonaRead)
async def update_zona(
    zona_id: int,
    zona_upd: ZonaCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin=Depends(get_admin_user)
):
    stmt = select(Zona).where(Zona.id == zona_id)
    result = await db.execute(stmt)
    zona = result.scalar_one_or_none()
    if not zona:
        raise HTTPException(status_code=404, detail="Zona not found")
        
    zona.nombre = zona_upd.nombre
    zona.polygon_geojson = zona_upd.polygon_geojson
    zona.dias_operativos = zona_upd.dias_operativos
    zona.activo = zona_upd.activo
    
    await db.commit()
    await db.refresh(zona)
    return zona

@router.patch("/{zona_id}/activar", response_model=ZonaRead)
async def activar_zona(
    zona_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin=Depends(get_admin_user)
):
    stmt = select(Zona).where(Zona.id == zona_id)
    result = await db.execute(stmt)
    zona = result.scalar_one_or_none()
    if not zona:
        raise HTTPException(status_code=404, detail="Zona not found")
        
    zona.activo = True
    await db.commit()
    await db.refresh(zona)
    return zona

@router.patch("/{zona_id}/desactivar", response_model=ZonaRead)
async def desactivar_zona(
    zona_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin=Depends(get_admin_user)
):
    stmt = select(Zona).where(Zona.id == zona_id)
    result = await db.execute(stmt)
    zona = result.scalar_one_or_none()
    if not zona:
        raise HTTPException(status_code=404, detail="Zona not found")
        
    zona.activo = False
    await db.commit()
    await db.refresh(zona)
    return zona
