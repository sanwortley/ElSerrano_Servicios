import asyncio
from jose import jwt
from src.config import settings
from src.models.enums import Rol

def get_token(id, email, rol):
    payload = {
        "sub": email,
        "role": rol,
        "id": id
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

if __name__ == "__main__":
    # From debug output: ID 2, email Hugo Martinez? 
    # Let's assume email is hugo@elserrano.com or something. 
    # I'll fetch it first.
    from sqlalchemy import select
    from src.db import AsyncSessionLocal
    from src.models import Usuario
    
    async def run():
        async with AsyncSessionLocal() as s:
            res = await s.execute(select(Usuario).where(Usuario.nombre == "Hugo Martinez"))
            u = res.scalar_one()
            print(f"Token for {u.email}:")
            print(get_token(u.id, u.email, u.rol.value))
            
    asyncio.run(run())
