"""Phase 7A — PDF generation, SVG cache, rfq_file_id, str_value on settings

Revision ID: 3fa8e21c0001
Revises: 57d158d4b99b
Create Date: 2026-06-04 00:00:00.000000
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic
revision: str = '3fa8e21c0001'
down_revision: Union[str, Sequence[str], None] = '57d158d4b99b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Phase 7A schema additions."""

    # ── settings: add str_value column ───────────────────────────────────────
    op.add_column('settings',
        sa.Column('str_value', sa.Text(), nullable=True)
    )
    # Make existing 'value' column nullable (for string-type settings)
    op.alter_column('settings', 'value', nullable=True)

    # ── quotes_v2: add PDF metadata columns ──────────────────────────────────
    op.add_column('quotes_v2',
        sa.Column('pdf_storage_path', sa.String(), nullable=True)
    )
    op.add_column('quotes_v2',
        sa.Column('pdf_generated_at', sa.DateTime(), nullable=True)
    )
    op.add_column('quotes_v2',
        sa.Column('pdf_version', sa.Integer(), nullable=True)
    )

    # ── quote_items: add rfq_file_id foreign key ─────────────────────────────
    op.add_column('quote_items',
        sa.Column('rfq_file_id', sa.Integer(), nullable=True)
    )
    op.create_foreign_key(
        'fk_quote_items_rfq_file_id',
        'quote_items', 'rfq_files',
        ['rfq_file_id'], ['id'],
        ondelete='SET NULL'
    )

    # ── quote_item_svg_cache: new table ───────────────────────────────────────
    op.create_table(
        'quote_item_svg_cache',
        sa.Column('id',           sa.Integer(),  primary_key=True, autoincrement=True),
        sa.Column('rfq_file_id',  sa.Integer(),  sa.ForeignKey('rfq_files.id', ondelete='CASCADE'),
                  nullable=False, unique=True),
        sa.Column('svg_content',  sa.Text(),     nullable=False),
        sa.Column('generated_at', sa.DateTime(), nullable=False,
                  server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_quote_item_svg_cache_id',         'quote_item_svg_cache', ['id'],         unique=False)
    op.create_index('ix_quote_item_svg_cache_rfq_file_id','quote_item_svg_cache', ['rfq_file_id'], unique=True)

    # ── Seed default string settings (only if keys don't already exist) ───────
    op.execute("""
        INSERT INTO settings (key, str_value)
        SELECT 'company_name',    '' WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key='company_name')
    """)
    op.execute("""
        INSERT INTO settings (key, str_value)
        SELECT 'company_address', '' WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key='company_address')
    """)
    op.execute("""
        INSERT INTO settings (key, str_value)
        SELECT 'company_phone',   '' WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key='company_phone')
    """)
    op.execute("""
        INSERT INTO settings (key, str_value)
        SELECT 'company_email',   '' WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key='company_email')
    """)
    op.execute("""
        INSERT INTO settings (key, str_value)
        SELECT 'company_website', '' WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key='company_website')
    """)
    op.execute("""
        INSERT INTO settings (key, str_value)
        SELECT 'company_gst',     '' WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key='company_gst')
    """)
    op.execute("""
        INSERT INTO settings (key, str_value)
        SELECT 'company_logo_url', '' WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key='company_logo_url')
    """)
    op.execute("""
        INSERT INTO settings (key, value)
        SELECT 'quote_validity_days', 30 WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key='quote_validity_days')
    """)
    op.execute("""
        INSERT INTO settings (key, str_value)
        SELECT 'terms_and_conditions', '1. Prices are valid for the period stated on this quotation.\n2. Payment: 50% advance on order confirmation; balance before dispatch.\n3. Delivery: Ex-works unless otherwise agreed.\n4. Goods remain property of supplier until full payment received.\n5. Disputes subject to local jurisdiction.' WHERE NOT EXISTS (SELECT 1 FROM settings WHERE key='terms_and_conditions')
    """)


def downgrade() -> None:
    """Reverse Phase 7A schema additions."""
    op.drop_index('ix_quote_item_svg_cache_rfq_file_id', table_name='quote_item_svg_cache')
    op.drop_index('ix_quote_item_svg_cache_id',          table_name='quote_item_svg_cache')
    op.drop_table('quote_item_svg_cache')

    op.drop_constraint('fk_quote_items_rfq_file_id', 'quote_items', type_='foreignkey')
    op.drop_column('quote_items', 'rfq_file_id')

    op.drop_column('quotes_v2', 'pdf_version')
    op.drop_column('quotes_v2', 'pdf_generated_at')
    op.drop_column('quotes_v2', 'pdf_storage_path')

    op.alter_column('settings', 'value', nullable=False)
    op.drop_column('settings', 'str_value')
