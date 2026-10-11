"""add website team members

Revision ID: f01a29c0d512
Revises: d53c11a4a998
Create Date: 2026-10-08
"""
from alembic import op
import sqlalchemy as sa


revision = "f01a29c0d512"
down_revision = "d53c11a4a998"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "website_team_members",
        sa.Column("id", sa.BigInteger().with_variant(sa.Integer(), "sqlite"), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("role", sa.String(120), nullable=False),
        sa.Column("bio", sa.String(1000), nullable=False, server_default=""),
        sa.Column("email", sa.String(255)),
        sa.Column("mobile", sa.String(20)),
        sa.Column("location", sa.String(255)),
        sa.Column("photo_storage_key", sa.String(100)),
        sa.Column("photo_original_filename", sa.String(255)),
        sa.Column("photo_mime_type", sa.String(50)),
        sa.Column("photo_file_size_bytes", sa.Integer()),
        sa.Column("display_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_website_team_members_active_order", "website_team_members", ["is_active", "display_order", "id"])
    op.create_index("ix_website_team_members_is_active", "website_team_members", ["is_active"])


def downgrade():
    op.drop_index("ix_website_team_members_is_active", table_name="website_team_members")
    op.drop_index("ix_website_team_members_active_order", table_name="website_team_members")
    op.drop_table("website_team_members")
