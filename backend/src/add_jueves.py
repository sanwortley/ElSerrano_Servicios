import asyncio
from src.db import AsyncSessionLocal
from sqlalchemy import select
from src.models.business import ServicioFrecuente

async def run():
    async with AsyncSessionLocal() as db:
        res = await db.execute(select(ServicioFrecuente).where(ServicioFrecuente.id == 15))
        f = res.scalar_one()
        f.dias_semana = f.dias_semana + ["Jueves"]
        await db.commit()
        print("Adicionada 'Jueves' a Servicio 15")

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run())
