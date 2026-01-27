import asyncio
from src.db import AsyncSessionLocal
from sqlalchemy import select
from src.models.users import Usuario

async def run():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Usuario))
        for u in res.scalars().all():
            print(f"--- USER {u.id} ---")
            print(f" Name: {u.nombre}")
            print(f" Email: {u.email}")
            print(f" Role: {u.rol}")
            print(f" Active: {u.activo}")

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run())
