import asyncio
from src.db import AsyncSessionLocal
from sqlalchemy import select
from src.models.users import Chofer, Usuario

async def run():
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(Usuario.id, Usuario.nombre, Chofer.id)
            .join(Chofer, Usuario.id == Chofer.usuario_id)
        )
        for uid, name, cid in res.all():
            print(f"User:{uid} Name:{name} ChoferProfileID:{cid}")

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run())
