import asyncio
from src.db import AsyncSessionLocal
from sqlalchemy import select
from src.models.users import Chofer, Usuario

async def run():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Chofer).join(Usuario).add_columns(Usuario.id.label("uid"), Usuario.nombre, Chofer.id.label("cid")))
        for row in res.all():
            print(f"User ID: {row.uid} | Name: {row.nombre} | Chofer ID: {row.cid}")

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run())
