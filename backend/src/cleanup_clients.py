import asyncio
from sqlalchemy import select, update, delete
from src.db import engine, AsyncSessionLocal
from src.models.business import Cliente, PedidoIndividual, ServicioFrecuente

async def cleanup_duplicates():
    print("Iniciando limpieza de clientes duplicados...")
    async with AsyncSessionLocal() as db:
        # 1. Fetch all clients
        stmt = select(Cliente)
        result = await db.execute(stmt)
        clients = result.scalars().all()
        
        # 2. Group by normalized name and address
        grouped = {}
        for c in clients:
            key = (c.nombre.lower().strip(), c.direccion.lower().strip())
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(c)
        
        # 3. Process groups with duplicates
        for key, members in grouped.items():
            if len(members) > 1:
                print(f"Duplicados encontrados para: {key[0]} en {key[1]} ({len(members)} registros)")
                
                # Keep the first one (usually the oldest)
                original = members[0]
                duplicates = members[1:]
                duplicate_ids = [d.id for d in duplicates]
                
                print(f"  Manteniendo ID: {original.id}, Eliminando IDs: {duplicate_ids}")
                
                # 4. Update Pedidos to point to original
                for old_id in duplicate_ids:
                    await db.execute(
                        update(PedidoIndividual)
                        .where(PedidoIndividual.cliente_id == old_id)
                        .values(cliente_id=original.id)
                    )
                    
                    # 5. Update Frecuentes to point to original
                    await db.execute(
                        update(ServicioFrecuente)
                        .where(ServicioFrecuente.cliente_id == old_id)
                        .values(cliente_id=original.id)
                    )
                
                # 6. Delete duplicate clients
                for old_id in duplicate_ids:
                    await db.execute(delete(Cliente).where(Cliente.id == old_id))
        
        await db.commit()
    print("Limpieza completada.")
    await engine.dispose()

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(cleanup_duplicates())
