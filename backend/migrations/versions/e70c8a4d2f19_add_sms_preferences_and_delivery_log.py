"""add student SMS preference and idempotent delivery records

Revision ID: e70c8a4d2f19
Revises: c5a7e2149d63
Create Date: 2026-10-11
"""
from alembic import op
import sqlalchemy as sa


revision = "e70c8a4d2f19"
down_revision = "c5a7e2149d63"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column(
        "users",
        sa.Column(
            "sms_notifications_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.create_table(
        "sms_deliveries",
        sa.Column(
            "id",
            sa.BigInteger().with_variant(sa.Integer(), "sqlite"),
            primary_key=True,
            autoincrement=True,
        ),
        sa.Column(
            "user_id",
            sa.BigInteger(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("event_key", sa.String(length=128), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("attempt_count", sa.Integer(), nullable=False),
        sa.Column("last_error_code", sa.String(length=40), nullable=True),
        sa.Column("accepted_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.UniqueConstraint("user_id", "event_key", name="uq_sms_delivery_user_event"),
    )
    op.create_index("ix_sms_deliveries_user_id", "sms_deliveries", ["user_id"])


def downgrade():
    op.drop_index("ix_sms_deliveries_user_id", table_name="sms_deliveries")
    op.drop_table("sms_deliveries")
    op.drop_column("users", "sms_notifications_enabled")
