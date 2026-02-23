"""Fix audit_logs and cantidad_banios

Revision ID: 43efa697e984
Revises: 42efa697e984
Create Date: 2026-02-23 17:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '43efa697e984'
down_revision: Union[str, None] = '42efa697e984'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create audit_logs table
    op.create_table('audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('accion', sa.String(), nullable=True),
        sa.Column('recurso', sa.String(), nullable=True),
        sa.Column('recurso_id', sa.Integer(), nullable=True),
        sa.Column('detalles', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)

    # 2. Fix 'cantidad_banios' column discrepancy in 'servicios_frecuentes'
    # The initial migration 0001 created it as 'cantidad_banios', 
    # but the model now uses 'cantidad'.
    # We drop the old column to avoid NotNull violations.
    op.drop_column('servicios_frecuentes', 'cantidad_banios')

def downgrade() -> None:
    op.add_column('servicios_frecuentes', sa.Column('cantidad_banios', sa.Integer(), nullable=True))
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_table('audit_logs')
