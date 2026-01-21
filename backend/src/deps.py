from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.config import settings
from src.models.users import Usuario
from src.models.enums import Rol
from src.schemas.all import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Annotated[AsyncSession, Depends(get_db)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: int = payload.get("id")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email, rol=Rol(role) if role else None, user_id=user_id)
    except (JWTError, ValueError):
        raise credentials_exception
        
    from sqlalchemy.orm import selectinload
    stmt = select(Usuario).where(Usuario.email == token_data.email).options(selectinload(Usuario.chofer_perfil))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: Annotated[Usuario, Depends(get_current_user)]):
    if not current_user.activo:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

async def get_admin_user(current_user: Annotated[Usuario, Depends(get_current_active_user)]):
    if current_user.rol != Rol.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized")
    return current_user
