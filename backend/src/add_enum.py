import asyncio
from sqlalchemy import text
from src.db import engine

async def add_enum_value():
    async with engine.begin() as conn: # Use begin for transaction
        try:
            # PostgreSQL ALTER TYPE ADD VALUE cannot run inside a transaction block easily in some versions/drivers
            # but usually it's okay if it's the only thing.
            await conn.execute(text("ALTER TYPE estadofrecuente ADD VALUE 'COMPLETADA'"))
            print("VALUE 'COMPLETADA' added to estadofrecuente")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    import asyncio
    asyncio.run(add_enum_value())
