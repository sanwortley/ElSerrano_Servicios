from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.db import get_db
from src.models.geo import RutaDia
from src.schemas.all import RutaDiaRead, RutaDiaCreate
from src.deps import get_admin_user

router = APIRouter(prefix="/rutas", tags=["Rutas"])

@router.post("/", response_model=RutaDiaRead)
async def create_ruta(
    ruta: RutaDiaCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin=Depends(get_admin_user)
):
    # Optional: check if rule exists for day+zona+chofer? Or just allow multiple rules.
    # Usually 1 rule per condition? "Rutas por día". "Hoy el camión sale a Zona Norte".
    # Regla: Si existe ruta con chofer_id -> usar esa. Si no, ruta general.
    # So we can have multiple.
    
    new_ruta = RutaDia(
        dia_semana=ruta.dia_semana,
        zona_id=ruta.zona_id,
        chofer_id=ruta.chofer_id,
        activo=ruta.activo
    )
    db.add(new_ruta)
    await db.commit()
    await db.refresh(new_ruta)
    
    # Reload relationship for response
    # We need to construct response with zona info etc.
    # RutaDiaRead requires zona.
    stmt = select(RutaDia).where(RutaDia.id == new_ruta.id).options(
        selectinload(RutaDia.zona), 
        selectinload(RutaDia.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    return result.scalar_one()

@router.get("/", response_model=List[RutaDiaRead])
async def read_rutas(
    db: Annotated[AsyncSession, Depends(get_db)],
    admin=Depends(get_admin_user)
):
    stmt = select(RutaDia).options(
        selectinload(RutaDia.zona), 
        selectinload(RutaDia.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/{ruta_id}", response_model=RutaDiaRead)
async def update_ruta(
    ruta_id: int,
    ruta: RutaDiaCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin=Depends(get_admin_user)
):
    stmt = select(RutaDia).where(RutaDia.id == ruta_id).options(
        selectinload(RutaDia.zona), 
        selectinload(RutaDia.chofer).selectinload(Chofer.usuario)
    )
    result = await db.execute(stmt)
    db_ruta = result.scalar_one_or_none()
    if not db_ruta:
        raise HTTPException(status_code=404, detail="Ruta not found")
        
    db_ruta.dia_semana = ruta.dia_semana
    db_ruta.zona_id = ruta.zona_id
    db_ruta.chofer_id = ruta.chofer_id
    db_ruta.activo = ruta.activo
    
    await db.commit()
    await db.refresh(db_ruta)
    return db_ruta

@router.delete("/{ruta_id}")
async def delete_ruta(
    ruta_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    admin=Depends(get_admin_user)
):
    stmt = select(RutaDia).where(RutaDia.id == ruta_id)
    result = await db.execute(stmt)
    db_ruta = result.scalar_one_or_none()
    if not db_ruta:
        raise HTTPException(status_code=404, detail="Ruta not found")
        
    await db.delete(db_ruta)
    await db.commit()
    return {"ok": True}
