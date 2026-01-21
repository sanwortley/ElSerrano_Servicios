import asyncio
from src.db import AsyncSessionLocal
from src.models.geo import Zona
from src.models.users import Usuario, Chofer
from src.models.business import Cliente
from src.models.enums import Rol
from src.security import get_password_hash

async def seed():
    async with AsyncSessionLocal() as db:
        print("Seeding...")
        
        # Ensure Admin exists (handled by app but good here too)
        # Add a Driver
        driver_email = "chofer@test.com"
        existing_driver = await db.get(Usuario, 2) # Assume ID 2, or query by email.
        # But let's keep it simple: create a new driver user if not exists
        
        # Create Zone (Example: Square in Buenos Aires approx)
        # Polygon around Obelisco?
        poly_json = """{"type":"Polygon","coordinates":[[[-58.385,-34.605],[-58.380,-34.605],[-58.380,-34.600],[-58.385,-34.600],[-58.385,-34.605]]]}"""
        
        z = Zona(nombre="Zona Microcentro", polygon_geojson=poly_json, activo=True)
        db.add(z)
        
        # Create Client
        c = Cliente(nombre="Empresa XYZ", telefono="11223344", direccion="Av Corrientes 1234")
        db.add(c)
        
        await db.commit()
        print("Seeding complete.")

import sys

if __name__ == "__main__":
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed())
