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
    # Startup: Just log that we are starting
    print("Startup: Volquetes Gestión API V2 is starting...", flush=True)
    yield
    # Shutdown: Clean up resources
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

    origins = [
        "http://localhost:5173",
        "https://localhost:5173",
        "http://127.0.0.1:5173",
        "https://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
        "http://localhost:3000", 
    ]

    # If running on Render or Railway, allow all for demo ease
    if os.getenv("RENDER") or os.getenv("RAILWAY_ENVIRONMENT"):
        origins = ["*"]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True if origins != ["*"] else False, # Credentials must be False if origin is *
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
