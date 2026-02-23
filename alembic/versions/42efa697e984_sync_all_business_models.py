"""Sync all business models

Revision ID: 42efa697e984
Revises: 41efa697e984
Create Date: 2026-02-23 17:05:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '42efa697e984'
down_revision: Union[str, None] = '41efa697e984'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Clientes
    op.add_column('clientes', sa.Column('email', sa.String(), nullable=True))
    op.add_column('clientes', sa.Column('cuit', sa.String(), nullable=True))
    
    # 2. Pedidos Individuales
    op.add_column('pedidos_individuales', sa.Column('orden_en_ruta', sa.Integer(), nullable=True))
    op.add_column('pedidos_individuales', sa.Column('monto_reportado', sa.Float(), nullable=True))
    op.add_column('pedidos_individuales', sa.Column('metodo_reportado', sa.String(), nullable=True))
    op.add_column('pedidos_individuales', sa.Column('observaciones_chofer', sa.String(), nullable=True))
    
    # 3. Servicios Frecuentes
    op.add_column('servicios_frecuentes', sa.Column('tipo_servicio', sa.String(), server_default='Alquiler de baños químicos', nullable=False))
    op.add_column('servicios_frecuentes', sa.Column('cantidad', sa.Integer(), server_default='1', nullable=False))
    op.add_column('servicios_frecuentes', sa.Column('orden_en_ruta', sa.Integer(), nullable=True))
    op.add_column('servicios_frecuentes', sa.Column('monto_reportado', sa.Float(), nullable=True))
    op.add_column('servicios_frecuentes', sa.Column('metodo_reportado', sa.String(), nullable=True))
    op.add_column('servicios_frecuentes', sa.Column('observaciones_chofer', sa.String(), nullable=True))
    
    # Handle dias_limpieza -> dias_semana if needed, or just add dias_semana
    # Checking existing columns in migration is hard without inspection, but based on model:
    op.add_column('servicios_frecuentes', sa.Column('dias_semana', sa.JSON(), nullable=True))
    op.execute("UPDATE servicios_frecuentes SET dias_semana = dias_limpieza WHERE dias_limpieza IS NOT NULL")
    op.execute("UPDATE servicios_frecuentes SET dias_semana = '[]'::json WHERE dias_semana IS NULL")
    op.alter_column('servicios_frecuentes', 'dias_semana', nullable=False)

def downgrade() -> None:
    op.drop_column('servicios_frecuentes', 'dias_semana')
    op.drop_column('servicios_frecuentes', 'observaciones_chofer')
    op.drop_column('servicios_frecuentes', 'metodo_reportado')
    op.drop_column('servicios_frecuentes', 'monto_reportado')
    op.drop_column('servicios_frecuentes', 'orden_en_ruta')
    op.drop_column('servicios_frecuentes', 'cantidad')
    op.drop_column('servicios_frecuentes', 'tipo_servicio')
    
    op.drop_column('pedidos_individuales', 'observaciones_chofer')
    op.drop_column('pedidos_individuales', 'metodo_reportado')
    op.drop_column('pedidos_individuales', 'monto_reportado')
    op.drop_column('pedidos_individuales', 'orden_en_ruta')
    
    op.drop_column('clientes', 'cuit')
    op.drop_column('clientes', 'email')
