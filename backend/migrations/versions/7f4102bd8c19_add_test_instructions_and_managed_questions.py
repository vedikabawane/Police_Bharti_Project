"""add test instructions and managed test questions

Revision ID: 7f4102bd8c19
Revises: d7c2f40a9b61
Create Date: 2026-10-14
"""
from alembic import op
import sqlalchemy as sa


revision = "7f4102bd8c19"
down_revision = "d7c2f40a9b61"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("tests", sa.Column("instructions", sa.Text(), nullable=True))
    op.add_column(
        "test_questions",
        sa.Column(
            "is_admin_created",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )
    op.alter_column("test_questions", "is_admin_created", server_default=None)


def downgrade():
    op.drop_column("test_questions", "is_admin_created")
    op.drop_column("tests", "instructions")
