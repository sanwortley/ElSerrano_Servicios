import asyncio
from src.db import AsyncSessionLocal
from sqlalchemy import select
from src.models.business import PedidoIndividual

async def run():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(PedidoIndividual))
        for p in res.scalars().all():
            print(f"Pedido:{p.id} | ChoferID:{p.chofer_id} | Estado:{p.estado}")

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run())
