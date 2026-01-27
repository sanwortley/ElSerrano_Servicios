import asyncio
import sys
import os
from sqlalchemy import text

sys.path.append(os.getcwd())
from src.db import engine

async def fix():
    log_file = "fix_log_v4.txt"
    with open(log_file, "w") as f:
        f.write("Starting fix v4...\n")
        try:
            conn = await engine.connect()
            f.write(f"Connection type: {type(conn)}\n")
            try:
                # Need to use execution_options on the connection
                # and then execute
                f.write("Executing ALTER TYPE...\n")
                await conn.execution_options(isolation_level="AUTOCOMMIT").execute(
                    text("ALTER TYPE estadopedido ADD VALUE IF NOT EXISTS 'CARGA_TARDIA'")
                )
                f.write("SUCCESS!\n")
            except Exception as e:
                f.write(f"EXECUTION ERROR: {str(e)}\n")
            finally:
                await conn.close()
                f.write("Connection closed\n")
        except Exception as e:
            f.write(f"CONNECTION ERROR: {str(e)}\n")

if __name__ == "__main__":
    asyncio.run(fix())
