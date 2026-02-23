
import asyncio
from sqlalchemy import text
from src.db import engine

async def update_enums():
    async with engine.connect() as conn:
        print("Updating enums...")
        # Since ALTER TYPE ... ADD VALUE cannot be run in a transaction in many PG versions/drivers
        # We use execution_options(isolation_level="AUTOCOMMIT") if possible, 
        # or just run it and hope for the best if using asyncpg which usually handles this if not explicitly in txn.
        
        try:
            await conn.execute(text("ALTER TYPE estadopedido ADD VALUE 'PAGO_PENDIENTE'"))
            print("Added PAGO_PENDIENTE to estadopedido")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("PAGO_PENDIENTE already exists in estadopedido")
            else:
                print(f"Error updating estadopedido: {e}")

        try:
            await conn.execute(text("ALTER TYPE estadofrecuente ADD VALUE 'PAGO_PENDIENTE'"))
            print("Added PAGO_PENDIENTE to estadofrecuente")
        except Exception as e:
            if "already exists" in str(e).lower():
                print("PAGO_PENDIENTE already exists in estadofrecuente")
            else:
                print(f"Error updating estadofrecuente: {e}")
        
        await conn.commit()

if __name__ == "__main__":
    asyncio.run(update_enums())
