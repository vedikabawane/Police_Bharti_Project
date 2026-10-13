"""drop long jump from physical training records

Revision ID: d7c2f40a9b61
Revises: a91d6b5c42ef
Create Date: 2026-10-12
"""
from alembic import op
import sqlalchemy as sa


revision = "d7c2f40a9b61"
down_revision = "a91d6b5c42ef"
branch_labels = None
depends_on = None


def upgrade():
    op.drop_column("physical_training_records", "long_jump")


def downgrade():
    op.add_column(
        "physical_training_records",
        sa.Column("long_jump", sa.Numeric(precision=8, scale=2), nullable=True),
    )
