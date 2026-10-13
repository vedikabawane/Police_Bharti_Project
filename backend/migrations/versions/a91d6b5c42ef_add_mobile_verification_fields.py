"""add mobile verification state to users

Revision ID: a91d6b5c42ef
Revises: f4b827ce193a
Create Date: 2026-10-12
"""
from alembic import op
import sqlalchemy as sa


revision = "a91d6b5c42ef"
down_revision = "f4b827ce193a"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column(
        "mobile_verified", sa.Boolean(), nullable=False, server_default=sa.false()
    ))
    op.add_column("users", sa.Column("mobile_verified_at", sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column("users", "mobile_verified_at")
    op.drop_column("users", "mobile_verified")
