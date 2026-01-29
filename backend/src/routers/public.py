from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.models.presupuestos import Presupuesto
from src.models.business import PedidoIndividual
from pydantic import BaseModel
from typing import List
from datetime import datetime

router = APIRouter(prefix="/public", tags=["Public"])

class QuoteCreate(BaseModel):
    nombre: str
    telefono: str
    direccion: str
    tipo_servicio: str
    descripcion: str

@router.post("/quote")
async def create_quote(item: QuoteCreate, db: AsyncSession = Depends(get_db)):
    db_item = Presupuesto(**item.dict())
    db.add(db_item)
    await db.commit()
    return {"ok": True, "msg": "Presupuesto enviado correctamente"}

@router.get("/track/{telefono}")
async def track_orders(telefono: str, db: AsyncSession = Depends(get_db)):
    # Search for active/recent orders by phone
    # We join with clientes to find by phone
    from src.models.business import Cliente
    # Strip non-numeric characters for comparison
    clean_phone = "".join(filter(str.isdigit, telefono))
    
    from sqlalchemy import func
    # Note: This assumes stored phone numbers are also numeric-only or we use a more complex fuzzy match
    # For now, let's keep it simple but handle the input sanitization
    stmt = select(PedidoIndividual).join(Cliente).where(func.replace(func.replace(func.replace(Cliente.telefono, ' ', ''), '-', ''), '(', '').like(f"%{clean_phone}%")).order_by(PedidoIndividual.creado_en.desc()).limit(5)
    result = await db.execute(stmt)
    pedidos = result.scalars().all()
    
    return [
        {
            "id": p.id,
            "estado": p.estado,
            "servicio": p.tipo_servicio,
            "fecha": p.creado_en,
            "direccion": (p.direccion[:15] + "...") if p.direccion else "N/A"
        } for p in pedidos
    ]
