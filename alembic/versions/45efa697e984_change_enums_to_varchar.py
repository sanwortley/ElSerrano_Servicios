"""Change Enums to VARCHAR to allow flexible values

Revision ID: 45efa697e984
Revises: 44efa697e984
Create Date: 2026-02-24 09:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '45efa697e984'
down_revision: Union[str, None] = '44efa697e984'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Convert tipo_servicio to VARCHAR in pedidos_individuales
    op.execute("ALTER TABLE pedidos_individuales ALTER COLUMN tipo_servicio TYPE VARCHAR USING tipo_servicio::VARCHAR")
    
    # Convert estado to VARCHAR in pedidos_individuales
    op.execute("ALTER TABLE pedidos_individuales ALTER COLUMN estado TYPE VARCHAR USING estado::VARCHAR")
    
    # Convert estado to VARCHAR in servicios_frecuentes
    op.execute("ALTER TABLE servicios_frecuentes ALTER COLUMN estado TYPE VARCHAR USING estado::VARCHAR")
    
    # Convert metodo_pago to VARCHAR in pagos
    op.execute("ALTER TABLE pagos ALTER COLUMN metodo_pago TYPE VARCHAR USING metodo_pago::VARCHAR")
    
    # Convert rol to VARCHAR in usuarios
    op.execute("ALTER TABLE usuarios ALTER COLUMN rol TYPE VARCHAR USING rol::VARCHAR")

def downgrade() -> None:
    # Downgrade is complex because we would need to ensure all values fit the old Enums
    # For now, we leave them as VARCHAR as they are more compatible
    pass
