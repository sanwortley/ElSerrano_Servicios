import asyncio
import os
import sys

# Add src to path
sys.path.append(os.path.join(os.getcwd(), 'src'))

from sqlalchemy import text
from src.db import engine

async def purge():
    async with engine.connect() as conn:
        print("--- INICIANDO PURGA TOTAL DE DATOS ---")
        
        # Tablas a limpiar en orden de dependencia (Haciendo coincidir con __tablename__ real)
        tables = [
            "pagos",
            "gastos",
            "sesiones_trabajo",
            "pedidos_individuales",
            "servicios_frecuentes",
            "rutas_dia", # Era rutas_dias, corregido a rutas_dia
            "choferes",
            "clientes",
            "zonas",
            "geocode_cache"
        ]
        
        for table in tables:
            try:
                print(f"Limpiando tabla: {table}...")
                async with conn.begin():
                    # Usamos DELETE
                    await conn.execute(text(f'DELETE FROM "{table}";'))
                    try:
                        await conn.execute(text(f'ALTER SEQUENCE {table}_id_seq RESTART WITH 1;'))
                    except:
                        pass
                print(f"OK: {table}")
            except Exception as e:
                print(f"AVISO: No se pudo limpiar {table}: {e}")
            
        try:
            async with conn.begin():
                print("Eliminando usuarios con rol CHOFER...")
                await conn.execute(text("DELETE FROM usuarios WHERE rol = 'CHOFER';"))
                print("OK: Usuarios Chofer")
        except Exception as e:
            print(f"Error eliminando usuarios: {e}")
            
        print("--- PROCESO FINALIZADO ---")

if __name__ == "__main__":
    asyncio.run(purge())
