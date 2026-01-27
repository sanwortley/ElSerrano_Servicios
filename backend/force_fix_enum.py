import asyncio
import sys
import os
from sqlalchemy import text

sys.path.append(os.getcwd())
from src.db import engine

async def fix():
    print("Attempting to add CARGA_TARDIA to estadopedido...")
    # Using connection with autocommit as ALTER TYPE cannot run in transaction
    async with engine.connect() as conn:
        try:
            await conn.execution_options(isolation_level="AUTOCOMMIT").execute(
                text("ALTER TYPE estadopedido ADD VALUE 'CARGA_TARDIA'")
            )
            print("Successfully added CARGA_TARDIA")
        except Exception as e:
            print(f"Failed to add: {e}")

if __name__ == "__main__":
    asyncio.run(fix())
