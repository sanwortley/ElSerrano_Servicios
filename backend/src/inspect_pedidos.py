import asyncio
from src.db import AsyncSessionLocal
from sqlalchemy import select
from src.models.business import PedidoIndividual, Cliente
from sqlalchemy.orm import selectinload

async def run():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(PedidoIndividual).where(PedidoIndividual.id.in_([9, 12])).options(selectinload(PedidoIndividual.cliente)))
        for p in res.scalars().all():
            print(f"--- Pedido {p.id} ---")
            for col in p.__table__.columns:
                print(f" {col.name}: {getattr(p, col.name)}")
            print(f" Cliente: {p.cliente.nombre if p.cliente else 'None'}")

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run())
