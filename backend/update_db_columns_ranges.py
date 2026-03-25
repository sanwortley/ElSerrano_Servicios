import asyncio
from sqlalchemy import text
from src.db import engine

async def update_tables():
    async with engine.connect() as conn:
        print("Updating tables with range columns...")
        
        # PedidosIndividuales
        for col in [
            ("rango_horario", "VARCHAR"),
            ("rango_precio", "VARCHAR")
        ]:
            try:
                await conn.execute(text(f"ALTER TABLE pedidos_individuales ADD COLUMN {col[0]} {col[1]}"))
                print(f"Added {col[0]} to pedidos_individuales")
            except Exception as e:
                print(f"Could not add {col[0]} to pedidos_individuales: {e}")

        # ServiciosFrecuentes
        for col in [
            ("rango_horario", "VARCHAR"),
            ("rango_precio", "VARCHAR")
        ]:
            try:
                await conn.execute(text(f"ALTER TABLE servicios_frecuentes ADD COLUMN {col[0]} {col[1]}"))
                print(f"Added {col[0]} to servicios_frecuentes")
            except Exception as e:
                print(f"Could not add {col[0]} to servicios_frecuentes: {e}")

        await conn.commit()

if __name__ == "__main__":
    asyncio.run(update_tables())
