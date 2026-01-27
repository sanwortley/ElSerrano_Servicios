import asyncio
from src.db import AsyncSessionLocal
from src.models.business import PedidoIndividual
from src.models.enums import EstadoPedido
from datetime import datetime

async def create_test_pedido():
    async with AsyncSessionLocal() as db:
        new_p = PedidoIndividual(
            cliente_id=1, # Juan Perez
            tipo_servicio="PRUEBA",
            direccion="Calle de Prueba 123",
            costo=1000,
            estado=EstadoPedido.ASIGNADA,
            chofer_id=2, # Martin Perez
            fecha_hora_recepcion=datetime.now()
        )
        db.add(new_p)
        await db.commit()
        print(f"Pedido de prueba creado con ID: {new_p.id}")

if __name__ == "__main__":
    import sys
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(create_test_pedido())
