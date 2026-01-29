import asyncio
from src.db import engine, Base
from src.models import users, geo, business, audit, presupuestos

async def create_tables():
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables created!")

if __name__ == "__main__":
    asyncio.run(create_tables())
