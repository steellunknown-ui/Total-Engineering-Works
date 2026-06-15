"""add geometry_svg to quote_items

Revision ID: a1b2c3d4e5f6
Revises: 3fa8e21c0001
Create Date: 2026-06-04 12:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = '3fa8e21c0001'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column('quote_items',
        sa.Column('geometry_svg', sa.Text(), nullable=True)
    )


def downgrade() -> None:
    op.drop_column('quote_items', 'geometry_svg')
