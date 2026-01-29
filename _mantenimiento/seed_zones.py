import asyncio
import sys
import os

# Add backend to sys.path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from src.db import AsyncSessionLocal
from src.models.geo import Zona
from sqlalchemy import select, delete

async def seed_zones():
    async with AsyncSessionLocal() as db:
        # Clear existing dummy zones
        await db.execute(delete(Zona))
        
        print("Seeding real zones for Santa Rosa de Calamuchita area...")
        # Polygons covering roughly the area
        zones = [
            Zona(
                nombre="Zona Centro / Guemes", 
                polygon_geojson='{"type":"Polygon","coordinates":[[[-64.6, -32.0], [-64.4, -32.0], [-64.4, -32.2], [-64.6, -32.2], [-64.6, -32.0]]]}', 
                dias_operativos=["Lunes", "Miércoles", "Viernes"]
            ),
            Zona(
                nombre="Zona Periférica / Rutas", 
                polygon_geojson='{"type":"Polygon","coordinates":[[[-64.7, -31.9], [-64.3, -31.9], [-64.3, -32.3], [-64.7, -32.3], [-64.7, -31.9]]]}', 
                dias_operativos=["Martes", "Jueves"]
            ),
            Zona(
                nombre="Villa General Belgrano / Alrededores", 
                polygon_geojson='{"type":"Polygon","coordinates":[[[-64.6, -31.9], [-64.4, -31.9], [-64.4, -32.1], [-64.6, -32.1], [-64.6, -31.9]]]}', 
                dias_operativos=["Sábado"]
            ),
        ]
        db.add_all(zones)
        await db.commit()
        print("Zones seeded with larger polygons covering Santa Rosa.")

if __name__ == "__main__":
    asyncio.run(seed_zones())
