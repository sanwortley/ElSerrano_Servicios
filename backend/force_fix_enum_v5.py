import asyncio
import sys
import os
from sqlalchemy import text

sys.path.append(os.getcwd())
from src.db import engine

async def fix():
    log_file = "fix_log_v5.txt"
    with open(log_file, "w") as f:
        f.write("Starting fix v5...\n")
        try:
            conn = await engine.connect()
            f.write(f"Connection type: {type(conn)}\n")
            
            # Check if execution_options is a coroutine
            opts = conn.execution_options(isolation_level="AUTOCOMMIT")
            f.write(f"execution_options return type: {type(opts)}\n")
            
            if asyncio.iscoroutine(opts):
                f.write("execution_options IS a coroutine, awaiting...\n")
                conn_opts = await opts
            else:
                f.write("execution_options is NOT a coroutine\n")
                conn_opts = opts
                
            f.write(f"conn_opts type: {type(conn_opts)}\n")
            
            try:
                f.write("Executing ALTER TYPE...\n")
                await conn_opts.execute(
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
