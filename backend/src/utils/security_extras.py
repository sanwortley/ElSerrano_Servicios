from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request
from src.models.audit import AuditLog
from src.db import AsyncSessionLocal
from typing import Optional

# 1. Rate Limiting Setup
limiter = Limiter(key_func=get_remote_address)

# 2. Audit Logger Utility
async def log_action(
    user_id: Optional[int],
    accion: str,
    recurso: str,
    recurso_id: Optional[int] = None,
    detalles: Optional[dict] = None,
    request: Optional[Request] = None
):
    try:
        ip = None
        if request and request.client:
            ip = request.client.host
            
        async with AsyncSessionLocal() as db:
            log = AuditLog(
                user_id=user_id,
                accion=accion,
                recurso=recurso,
                recurso_id=recurso_id,
                detalles=detalles,
                ip_address=ip
            )
            db.add(log)
            await db.commit()
    except Exception as e:
        print(f"AUDIT LOG ERROR: {e}")
