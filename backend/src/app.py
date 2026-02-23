import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from src.config import settings
from src.utils.security_extras import limiter, RateLimitExceeded, _rate_limit_exceeded_handler
from src.db import engine, Base, AsyncSessionLocal
from src.models import users, geo, business
from sqlalchemy import select
from src.security import get_password_hash
from src.models.users import Usuario
from src.models.enums import Rol

from src.routers import auth, zones, rutas, clientes, pedidos, frecuentes, driver, balances, dashboard, ai, public, audit

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Run migrations and create admin
    print("Startup: Running automatic setup...", flush=True)
    async with AsyncSessionLocal() as db:
        try:
            # Look for existing admin
            from sqlalchemy import select
            from src.models.users import Usuario
            from src.models.enums import Rol
            from src.security import get_password_hash
            
            result = await db.execute(select(Usuario).filter(Usuario.email == settings.ADMIN_EMAIL))
            admin = result.scalar_one_or_none()
            
            if not admin:
                print(f"Startup: Creating default admin: {settings.ADMIN_EMAIL}", flush=True)
                new_admin = Usuario(
                    nombre="Admin",
                    email=settings.ADMIN_EMAIL,
                    password_hash=get_password_hash(settings.ADMIN_PASSWORD),
                    rol=Rol.ADMIN,
                    activo=True
                )
                db.add(new_admin)
                await db.commit()
                print("Startup: Admin created successfully.", flush=True)
            else:
                print("Startup: Admin already exists.", flush=True)
        except Exception as e:
            print(f"Startup Error during user check: {e}", flush=True)
            
    yield
    # Shutdown
    print("Shutdown: Cleaning up resources...", flush=True)
    await engine.dispose()

def create_app() -> FastAPI:
    print("Initializing Volquetes Gestión MVP App...")
    app = FastAPI(
        title="Volquetes Gestión API V2",
        version="2.0.0",
        lifespan=lifespan
    )
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

    # CORS configuration - Force allow all for production/railway to avoid blocks
    if os.getenv("RENDER") or os.getenv("RAILWAY_ENVIRONMENT") or os.getenv("RAILWAY_ENVIRONMENT_NAME") or os.getenv("RAILWAY_STATIC_URL"):
        print("CORS: Production environment detected. Allowing ALL origins.", flush=True)
        origins = ["*"]
        allow_credentials = False
    else:
        origins = [
            "http://localhost:5173",
            "https://localhost:5173",
            "http://127.0.0.1:5173",
            "https://127.0.0.1:5173",
            "http://localhost:4173",
        ]
        allow_credentials = True

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=allow_credentials,
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
    app.include_router(ai.router)
    app.include_router(public.router)
    app.include_router(audit.router)

    @app.get("/")
    async def root():
        return {"message": "Volquetes Gestión API V2 - PORT 8000"}

    return app

app = create_app()
