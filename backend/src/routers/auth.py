from datetime import timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.db import get_db
from src.security import create_access_token, get_password_hash, verify_password
from src.models.users import Usuario
from src.models.enums import Rol
from src.schemas.all import Token, UserRead, UserCreate
from src.deps import get_current_active_user, get_admin_user

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/login", response_model=Token)
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    # Authenticate user manually since we didn't export authenticate_user from security yet?
    # Wait, I didn't write authenticate_user in security.py. I'll add it here or update security.py
    # I'll implement logic here for simplicity or update security.py. Logic is simple.
    print(f"Login attempt for: {form_data.username}")
    stmt = select(Usuario).where(Usuario.email == form_data.username)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    
    if user:
        print(f"User found: {user.email}")
        is_valid = verify_password(form_data.password, user.password_hash)
        print(f"Password valid: {is_valid}")
    else:
        print(f"User not found: {form_data.username}")
    
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.activo:
         raise HTTPException(status_code=400, detail="Inactive user")

    access_token_expires = timedelta(minutes=1440) 
    access_token = create_access_token(
        data={"sub": user.email, "role": user.rol.value, "id": user.id},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserRead)
async def read_users_me(current_user: Annotated[Usuario, Depends(get_current_active_user)]):
    return current_user

@router.post("/users", response_model=UserRead)
async def create_user(
    user_in: UserCreate, 
    current_user: Annotated[Usuario, Depends(get_admin_user)],
    db: Annotated[AsyncSession, Depends(get_db)]
):
    stmt = select(Usuario).where(Usuario.email == user_in.email)
    result = await db.execute(stmt)
    if result.scalar_one_or_none():
         raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user_in.password)
    new_user = Usuario(
        nombre=user_in.nombre,
        email=user_in.email,
        password_hash=hashed_password,
        rol=user_in.rol,
        activo=user_in.activo
    )
    db.add(new_user)
    await db.flush() # Get user ID
    
    if user_in.rol == Rol.CHOFER:
        from src.models.users import Chofer
        new_chofer = Chofer(
            usuario_id=new_user.id,
            telefono=user_in.telefono or "Sin teléfono",
            patente=user_in.patente or "Sin patente"
        )
        db.add(new_chofer)
        
    await db.commit()
    await db.refresh(new_user)
    return new_user
