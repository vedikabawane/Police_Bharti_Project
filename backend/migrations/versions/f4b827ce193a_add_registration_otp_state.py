"""add state for verified student registration

Revision ID: f4b827ce193a
Revises: e70c8a4d2f19
Create Date: 2026-10-12
"""
from alembic import op
import sqlalchemy as sa


revision = "f4b827ce193a"
down_revision = "e70c8a4d2f19"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "registration_otp_challenges",
        sa.Column("id", sa.String(length=36), primary_key=True),
        sa.Column("mobile_key", sa.String(length=64), nullable=False),
        sa.Column("otp_verifier", sa.String(length=64), nullable=True),
        sa.Column("registration_commitment", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("resend_after", sa.DateTime(), nullable=False),
        sa.Column("failed_attempts", sa.Integer(), nullable=False),
        sa.Column("verified_at", sa.DateTime(), nullable=True),
        sa.Column("ticket_verifier", sa.String(length=64), nullable=True),
        sa.Column("ticket_expires_at", sa.DateTime(), nullable=True),
        sa.Column("consumed_at", sa.DateTime(), nullable=True),
        sa.UniqueConstraint("ticket_verifier", name="uq_registration_otp_ticket_verifier"),
    )
    op.create_index(
        "ix_registration_otp_challenges_mobile_key",
        "registration_otp_challenges",
        ["mobile_key"],
    )
    op.create_index(
        "ix_registration_otp_challenges_expires_at",
        "registration_otp_challenges",
        ["expires_at"],
    )
    op.create_table(
        "registration_otp_rate_limits",
        sa.Column("key_hash", sa.String(length=64), primary_key=True),
        sa.Column("window_started_at", sa.DateTime(), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False),
    )


def downgrade():
    op.drop_table("registration_otp_rate_limits")
    op.drop_index(
        "ix_registration_otp_challenges_expires_at",
        table_name="registration_otp_challenges",
    )
    op.drop_index(
        "ix_registration_otp_challenges_mobile_key",
        table_name="registration_otp_challenges",
    )
    op.drop_table("registration_otp_challenges")
