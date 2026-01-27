from typing import Annotated, List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.models.geo import Zona
from src.schemas.all import ZonaRead, ZonaCreate
from src.deps import get_admin_user

from src.utils.geo import get_lat_lng, find_zone_for_point, get_locality_boundary, search_addresses
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
import json

router = APIRouter(prefix="/zonas", tags=["Zonas"])

@router.get("/detect")
async def detect_zone(
    db: Annotated[AsyncSession, Depends(get_db)],
    direccion: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None
):
    if lat is None or lng is None:
        if not direccion:
            return {"zona": None, "msg": "Dirección o coordenadas requeridas"}
        lat, lng = await get_lat_lng(direccion, db)
        
    if not (lat and lng):
        return {"zona": None, "msg": "Ubicación no encontrada", "lat": lat, "lng": lng}
    
    zona_id = await find_zone_for_point(lat, lng, db)
    if not zona_id:
        return {"zona": None, "msg": "Fuera de zona operativa"}
    
    stmt = select(Zona).where(Zona.id == zona_id)
    result = await db.execute(stmt)
    zona = result.scalar_one()
    return {"zona": zona, "lat": lat, "lng": lng}

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

@router.get("/search-locality")
async def search_locality(
    q: str,
    admin=Depends(get_admin_user)
):
    result = await get_locality_boundary(q)
    if not result or not result.get("geojson"):
         raise HTTPException(status_code=404, detail="No se encontró el límite de la localidad o no tiene un polígono definido")
    return result

@router.post("/merge")
async def merge_geometries(
    geometries: List[str], # List of GeoJSON strings
    admin=Depends(get_admin_user)
):
    try:
        shapes = [shape(json.loads(g)) for g in geometries]
        merged = unary_union(shapes)
        return json.dumps(mapping(merged))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al unir geometrías: {str(e)}")

@router.get("/suggest-address")
async def suggest_address(
    q: str,
    admin=Depends(get_admin_user)
):
    return await search_addresses(q)

@router.delete("/{zona_id}")
async def delete_zona(
    zona_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin=Depends(get_admin_user)
):
    stmt = select(Zona).where(Zona.id == zona_id)
    result = await db.execute(stmt)
    zona = result.scalar_one_or_none()
    if not zona:
        raise HTTPException(status_code=404, detail="Zona not found")
        
    await db.delete(zona)
    await db.commit()
    return {"ok": True}
