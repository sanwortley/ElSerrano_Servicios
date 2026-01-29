import asyncio
from sqlalchemy import text
from src.db import AsyncSessionLocal, engine

async def run_migration():
    print("Iniciando migración manual: Agregando columna require_password_change...")
    async with AsyncSessionLocal() as db:
        try:
            # Check if column exists
            result = await db.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='usuarios' AND column_name='require_password_change'
            """))
            exists = result.scalar()
            
            if not exists:
                print("La columna no existe. Agregándola...")
                await db.execute(text("ALTER TABLE usuarios ADD COLUMN require_password_change BOOLEAN DEFAULT TRUE"))
                await db.execute(text("UPDATE usuarios SET require_password_change = FALSE")) # Por seguridad, los existentes no los bloqueamos ya
                await db.commit()
                print("Columna agregada con éxito.")
            else:
                print("La columna ya existe.")
                
        except Exception as e:
            print(f"Error durante la migración: {e}")
            await db.rollback()
    
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run_migration())
