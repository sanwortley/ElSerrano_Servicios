import asyncio
from src.db import AsyncSessionLocal, engine
from src.models.users import Usuario
from sqlalchemy import select
import bcrypt

async def reset_admin():
    async with AsyncSessionLocal() as db:
        stmt = select(Usuario).where(Usuario.email == "admin@admin.com")
        result = await db.execute(stmt)
        admin = result.scalar_one_or_none()
        if admin:
            print("Admin encontrado. Reseteando contraseña a '1234'...")
            # Use bcrypt directly to avoid passlib bugs in some environments
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(b"1234", salt).decode('utf-8')
            admin.password_hash = hashed
            admin.require_password_change = False
            await db.commit()
            print("Contraseña reseteada con éxito.")
        else:
            print("Admin no encontrado.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_admin())
