import asyncio
import re
from sqlalchemy import select, update, delete
from src.db import engine, AsyncSessionLocal
from src.models.business import Cliente, PedidoIndividual, ServicioFrecuente

def normalize(text):
    if not text: return ""
    # Lowercase, strip, and replace multiple spaces with single space
    text = text.lower().strip()
    text = re.sub(r'\s+', ' ', text)
    return text

async def cleanup_duplicates():
    print("Iniciando limpieza PROFUNDA de clientes duplicados...")
    async with AsyncSessionLocal() as db:
        stmt = select(Cliente)
        result = await db.execute(stmt)
        clients = result.scalars().all()
        
        grouped = {}
        for c in clients:
            key = (normalize(c.nombre), normalize(c.direccion))
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(c)
        
        for key, members in grouped.items():
            if len(members) > 1:
                print(f"Duplicados encontrados para: '{key[0]}' en '{key[1]}' ({len(members)} registros)")
                
                # Keep the one with the lowest ID (oldest)
                members.sort(key=lambda x: x.id)
                original = members[0]
                duplicates = members[1:]
                duplicate_ids = [d.id for d in duplicates]
                
                print(f"  Manteniendo ID: {original.id}, Eliminando IDs: {duplicate_ids}")
                
                for old_id in duplicate_ids:
                    await db.execute(
                        update(PedidoIndividual)
                        .where(PedidoIndividual.cliente_id == old_id)
                        .values(cliente_id=original.id)
                    )
                    await db.execute(
                        update(ServicioFrecuente)
                        .where(ServicioFrecuente.cliente_id == old_id)
                        .values(cliente_id=original.id)
                    )
                    await db.execute(delete(Cliente).where(Cliente.id == old_id))
        
        await db.commit()
    print("Limpieza PROFUNDA completada.")
    await engine.dispose()

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(cleanup_duplicates())
