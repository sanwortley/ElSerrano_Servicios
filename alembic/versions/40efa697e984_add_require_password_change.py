"""Add require_password_change to Usuario

Revision ID: 40efa697e984
Revises: 38efa697e984
Create Date: 2026-02-23 16:30:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '40efa697e984'
down_revision: Union[str, None] = '38efa697e984'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # Add column with a temporary nullable=True to avoid errors with existing rows
    op.add_column('usuarios', sa.Column('require_password_change', sa.Boolean(), nullable=True))
    # Set default value for existing rows
    op.execute("UPDATE usuarios SET require_password_change = FALSE")
    # Make it non-nullable (optional, but good for consistency with model)
    op.alter_column('usuarios', 'require_password_change', nullable=False, server_default=sa.text('true'))

def downgrade() -> None:
    op.drop_column('usuarios', 'require_password_change')
