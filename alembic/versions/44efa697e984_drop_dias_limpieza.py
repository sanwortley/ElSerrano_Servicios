"""Drop dias_limpieza column

Revision ID: 44efa697e984
Revises: 43efa697e984
Create Date: 2026-02-23 17:20:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '44efa697e984'
down_revision: Union[str, None] = '43efa697e984'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Drop the obsolete column that is causing NotNull violations
    op.drop_column('servicios_frecuentes', 'dias_limpieza')

def downgrade() -> None:
    op.add_column('servicios_frecuentes', sa.Column('dias_limpieza', sa.JSON(), nullable=True))
