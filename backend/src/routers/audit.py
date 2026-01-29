from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.models.audit import AuditLog
from src.models.users import Usuario
from src.deps import get_admin_user
from typing import List
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/audit", tags=["Audit"])

@router.get("/")
async def get_audit_logs(
    db: AsyncSession = Depends(get_db),
    current_user: Usuario = Depends(get_admin_user),
    limit: int = 100
):
    stmt = select(AuditLog).options(selectinload(AuditLog.usuario)).order_by(AuditLog.timestamp.desc()).limit(limit)
    result = await db.execute(stmt)
    logs = result.scalars().all()
    
    return [
        {
            "id": log.id,
            "user": log.usuario.nombre if log.usuario else "Sistema",
            "accion": log.accion,
            "recurso": log.recurso,
            "recurso_id": log.recurso_id,
            "detalles": log.detalles,
            "ip": log.ip_address,
            "timestamp": log.timestamp
        } for log in logs
    ]
