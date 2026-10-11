"""create study materials table

Revision ID: b6f0c14d9a27
Revises: 5992f072ad2b
Create Date: 2026-10-06

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "b6f0c14d9a27"
down_revision = "5992f072ad2b"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "study_materials",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("subject_id", sa.BigInteger(), nullable=False),
        sa.Column("topic_id", sa.BigInteger(), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("storage_key", sa.String(length=500), nullable=False),
        sa.Column("original_filename", sa.String(length=255), nullable=False),
        sa.Column("mime_type", sa.String(length=100), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["subject_id"], ["subjects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["topic_id"], ["topics.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_study_materials_subject_id", "study_materials", ["subject_id"])
    op.create_index("ix_study_materials_topic_id", "study_materials", ["topic_id"])
    op.create_index("ix_study_materials_is_active", "study_materials", ["is_active"])


def downgrade():
    op.drop_index("ix_study_materials_is_active", table_name="study_materials")
    op.drop_index("ix_study_materials_topic_id", table_name="study_materials")
    op.drop_index("ix_study_materials_subject_id", table_name="study_materials")
    op.drop_table("study_materials")
