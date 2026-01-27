from typing import Annotated, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.models.business import Cliente
from src.models.enums import Rol
from src.schemas.all import ClienteRead, ClienteCreate
from src.deps import get_current_active_user
from src.models.users import Usuario

router = APIRouter(prefix="/clientes", tags=["Clientes"])

def check_staff(user: Usuario):
    if user.rol not in [Rol.ADMIN, Rol.RECEPCIONISTA]:
         raise HTTPException(status_code=403, detail="Not authorized")

@router.post("/", response_model=ClienteRead)
async def create_cliente(
    cliente: ClienteCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff(current_user)
    new_cliente = Cliente(**cliente.model_dump())
    db.add(new_cliente)
    await db.commit()
    await db.refresh(new_cliente)
    return new_cliente

@router.get("/", response_model=List[ClienteRead])
async def read_clientes(
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff(current_user)
    stmt = select(Cliente)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/{cliente_id}", response_model=ClienteRead)
async def read_cliente(
    cliente_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff(current_user)
    stmt = select(Cliente).where(Cliente.id == cliente_id)
    result = await db.execute(stmt)
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente not found")
    return cliente

@router.put("/{cliente_id}", response_model=ClienteRead)
async def update_cliente(
    cliente_id: int,
    cliente_upd: ClienteCreate,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff(current_user)
    stmt = select(Cliente).where(Cliente.id == cliente_id)
    result = await db.execute(stmt)
    cliente = result.scalar_one_or_none()
    if not cliente:
         raise HTTPException(status_code=404, detail="Cliente not found")
         
    cliente.nombre = cliente_upd.nombre
    cliente.telefono = cliente_upd.telefono
    cliente.direccion = cliente_upd.direccion
    
    await db.commit()
    await db.refresh(cliente)
    return cliente

@router.delete("/{cliente_id}")
async def delete_cliente(
    cliente_id: int,
    db: Annotated[AsyncSession, Depends(get_db)],
    current_user: Annotated[Usuario, Depends(get_current_active_user)]
):
    check_staff(current_user)
    stmt = select(Cliente).where(Cliente.id == cliente_id)
    result = await db.execute(stmt)
    cliente = result.scalar_one_or_none()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente not found")
    
    try:
        await db.delete(cliente)
        await db.commit()
    except Exception as e:
        await db.rollback()
        err_msg = str(e).lower()
        # Handle English and Spanish foreign key violation messages
        if "foreign key" in err_msg or "llave foránea" in err_msg or "foreignkeyviolation" in err_msg:
            raise HTTPException(
                status_code=400, 
                detail="No se puede eliminar el cliente porque tiene pedidos o abonos asociados. Se recomienda mantenerlo para no perder el historial de servicios."
            )
        raise HTTPException(status_code=500, detail=f"Error al eliminar: {str(e)}")
        
    return {"ok": True}
