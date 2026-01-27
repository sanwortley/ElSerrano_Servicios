import asyncio
import sys
import os
from sqlalchemy import text

sys.path.append(os.getcwd())
from src.db import engine

async def fix():
    log_file = "fix_log_v3.txt"
    with open(log_file, "w") as f:
        f.write("Starting fix v3...\n")
        try:
            # We use engine.connect() directly
            async with engine.connect() as conn:
                f.write("Got connection\n")
                # Try to run without transaction
                await conn.execution_options(isolation_level="AUTOCOMMIT").execute(
                    text("ALTER TYPE estadopedido ADD VALUE IF NOT EXISTS 'CARGA_TARDIA'")
                )
                f.write("Execution finished\n")
        except Exception as e:
            f.write(f"ERROR: {str(e)}\n")

if __name__ == "__main__":
    asyncio.run(fix())
