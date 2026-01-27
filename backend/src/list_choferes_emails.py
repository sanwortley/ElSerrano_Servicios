import asyncio
from src.db import AsyncSessionLocal
from sqlalchemy import select
from src.models.users import Chofer, Usuario

async def run():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(Chofer).join(Usuario).add_columns(Usuario.email, Usuario.nombre))
        for row in res.all():
            print(f"Name: {row.nombre} | Email: {row.email}")

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run())
