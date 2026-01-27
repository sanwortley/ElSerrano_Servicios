import asyncio
from src.db import AsyncSessionLocal
from sqlalchemy import select
from src.models.users import Usuario
from src.security import get_password_hash

async def reset_password():
    async with AsyncSessionLocal() as db:
        stmt = select(Usuario).where(Usuario.email == "mperez@mail.com")
        u = (await db.execute(stmt)).scalar_one()
        u.password_hash = get_password_hash("1234")
        await db.commit()
        print("Password reset for mperez@mail.com to '1234'")

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(reset_password())
