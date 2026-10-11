"""add shared contact form rate-limit state

Revision ID: c5a7e2149d63
Revises: b8911ca2a320
Create Date: 2026-10-11
"""
from alembic import op
import sqlalchemy as sa


revision = "c5a7e2149d63"
down_revision = "b8911ca2a320"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "contact_rate_limits",
        sa.Column("client_key", sa.String(length=64), primary_key=True),
        sa.Column("attempts", sa.JSON(), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(), nullable=False),
    )
    op.create_index(
        "ix_contact_rate_limits_last_seen_at",
        "contact_rate_limits",
        ["last_seen_at"],
    )


def downgrade():
    op.drop_index(
        "ix_contact_rate_limits_last_seen_at",
        table_name="contact_rate_limits",
    )
    op.drop_table("contact_rate_limits")
