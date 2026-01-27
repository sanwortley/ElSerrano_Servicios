import asyncio
from sqlalchemy import text
from src.db import engine

async def add_columns():
    print("Adding missing columns to database...")
    async with engine.begin() as conn:
        # Pedidos Individuales
        await conn.execute(text("ALTER TABLE pedidos_individuales ADD COLUMN IF NOT EXISTS lat FLOAT;"))
        await conn.execute(text("ALTER TABLE pedidos_individuales ADD COLUMN IF NOT EXISTS lng FLOAT;"))
        await conn.execute(text("ALTER TABLE pedidos_individuales ADD COLUMN IF NOT EXISTS orden_en_ruta INTEGER;"))
        
        # Servicios Frecuentes
        await conn.execute(text("ALTER TABLE servicios_frecuentes ADD COLUMN IF NOT EXISTS lat FLOAT;"))
        await conn.execute(text("ALTER TABLE servicios_frecuentes ADD COLUMN IF NOT EXISTS lng FLOAT;"))
        await conn.execute(text("ALTER TABLE servicios_frecuentes ADD COLUMN IF NOT EXISTS orden_en_ruta INTEGER;"))
    
    print("Columns added successfully.")
    await engine.dispose()

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(add_columns())
