import asyncio
from src.db import AsyncSessionLocal
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.models.business import PedidoIndividual
from src.models.users import Chofer, Usuario
from src.models.enums import EstadoPedido

async def run():
    async with AsyncSessionLocal() as db:
        # Simulate driver login
        user_name = "MARTIN PEREZ"
        stmt_u = select(Usuario).where(Usuario.nombre == user_name)
        user = (await db.execute(stmt_u)).scalar_one()
        
        stmt_c = select(Chofer).where(Chofer.usuario_id == user.id)
        chofer_perfil = (await db.execute(stmt_c)).scalar_one()
        
        print(f"Buscando para {user.nombre}, Chofer Profile ID: {chofer_perfil.id}")
        
        stmt_ped = select(PedidoIndividual)\
            .where(
                PedidoIndividual.chofer_id == chofer_perfil.id,
                PedidoIndividual.estado.in_([
                    EstadoPedido.CREADA, 
                    EstadoPedido.ASIGNADA, 
                    EstadoPedido.EN_CAMINO, 
                    EstadoPedido.COMPLETADA,
                    EstadoPedido.FINALIZADO
                ])
            )
            
        res = await db.execute(stmt_ped)
        pedidos = res.scalars().all()
        print(f"Encontrados: {len(pedidos)}")
        for p in pedidos:
            print(f" - ID: {p.id} | Estado: {p.estado}")

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(run())
