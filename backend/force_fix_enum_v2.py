import asyncio
import sys
import os
from sqlalchemy import text

sys.path.append(os.getcwd())
from src.db import engine

async def fix():
    log_file = "fix_log.txt"
    with open(log_file, "w") as f:
        f.write("Starting fix...\n")
        try:
            async with engine.connect() as conn:
                f.write("Connected to DB\n")
                # PostgreSQL ALTER TYPE ADD VALUE cannot run in a transaction
                # We use execution_options(isolation_level="AUTOCOMMIT")
                await conn.execution_options(isolation_level="AUTOCOMMIT").execute(
                    text("ALTER TYPE estadopedido ADD VALUE 'CARGA_TARDIA'")
                )
                f.write("Successfully executed ALTER TYPE\n")
        except Exception as e:
            f.write(f"FAILED: {str(e)}\n")
            # Maybe it already exists?
            f.write(f"Error type: {type(e)}\n")

if __name__ == "__main__":
    asyncio.run(fix())
