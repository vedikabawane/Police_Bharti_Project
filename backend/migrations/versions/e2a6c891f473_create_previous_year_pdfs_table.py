"""create previous year PDFs table

Revision ID: e2a6c891f473
Revises: b6f0c14d9a27
Create Date: 2026-10-07

"""
from alembic import op
import sqlalchemy as sa


revision = "e2a6c891f473"
down_revision = "b6f0c14d9a27"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "previous_year_pdfs",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("exam_name", sa.String(length=200), nullable=False),
        sa.Column("exam_year", sa.Integer(), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("storage_key", sa.String(length=255), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_previous_year_pdfs_exam_year", "previous_year_pdfs", ["exam_year"])
    op.create_index("ix_previous_year_pdfs_exam_name", "previous_year_pdfs", ["exam_name"])
    op.create_index("ix_previous_year_pdfs_is_active", "previous_year_pdfs", ["is_active"])


def downgrade():
    op.drop_index("ix_previous_year_pdfs_is_active", table_name="previous_year_pdfs")
    op.drop_index("ix_previous_year_pdfs_exam_name", table_name="previous_year_pdfs")
    op.drop_index("ix_previous_year_pdfs_exam_year", table_name="previous_year_pdfs")
    op.drop_table("previous_year_pdfs")
