import asyncio
from src.db import AsyncSessionLocal, engine
from src.models.users import Usuario
from src.security import get_password_hash
from sqlalchemy import select

async def reset_admin():
    async with AsyncSessionLocal() as db:
        stmt = select(Usuario).where(Usuario.email == "admin@admin.com")
        result = await db.execute(stmt)
        admin = result.scalar_one_or_none()
        if admin:
            print("Admin encontrado. Reseteando contraseña a '1234'...")
            admin.password_hash = get_password_hash("1234")
            admin.require_password_change = False
            await db.commit()
            print("Contraseña reseteada con éxito.")
        else:
            print("Admin no encontrado.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_admin())
