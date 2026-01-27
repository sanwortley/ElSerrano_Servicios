from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.db import engine, Base, AsyncSessionLocal
from src.models import users, geo, business
from sqlalchemy import select
from src.security import get_password_hash
from src.models.users import Usuario
from src.models.enums import Rol

from src.routers import auth, zones, rutas, clientes, pedidos, frecuentes, driver, balances, dashboard

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with AsyncSessionLocal() as db:
        stmt = select(Usuario).where(Usuario.rol == Rol.ADMIN)
        result = await db.execute(stmt)
        admin = result.scalar_one_or_none()
        if not admin:
            print("Creating default Admin user...")
            new_admin = Usuario(
                nombre="Super Admin",
                email=settings.ADMIN_EMAIL,
                password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                rol=Rol.ADMIN,
                activo=True
            )
            db.add(new_admin)
            await db.commit()
            print(f"Admin created: {settings.ADMIN_EMAIL}")
            
    yield
    await engine.dispose()

def create_app() -> FastAPI:
    print("Initializing Volquetes Gestión MVP App...")
    app = FastAPI(
        title="Volquetes Gestión API V2",
        version="2.0.0",
        lifespan=lifespan
    )

    origins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000", 
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["*"],
    )

    app.include_router(auth.router)
    app.include_router(zones.router)
    app.include_router(rutas.router)
    app.include_router(clientes.router)
    app.include_router(pedidos.router)
    app.include_router(frecuentes.router)
    app.include_router(driver.router)
    app.include_router(balances.router)
    app.include_router(dashboard.router)

    @app.get("/")
    async def root():
        return {"message": "Volquetes Gestión API V2 - PORT 8000"}

    return app

app = create_app()
