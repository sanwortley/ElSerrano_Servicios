"""Add dias_operativos to Zona

Revision ID: 41efa697e984
Revises: 40efa697e984
Create Date: 2026-02-23 17:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '41efa697e984'
down_revision: Union[str, None] = '40efa697e984'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    op.add_column('zonas', sa.Column('dias_operativos', sa.JSON(), nullable=True))
    op.execute("UPDATE zonas SET dias_operativos = '[]'::json")
    op.alter_column('zonas', 'dias_operativos', nullable=False, server_default='[]')

def downgrade() -> None:
    op.drop_column('zonas', 'dias_operativos')
