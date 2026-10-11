"""add Current Affairs media support

Revision ID: a47cf0d8c291
Revises: cd74121cf2b8
Create Date: 2026-10-08
"""
from alembic import op
import sqlalchemy as sa


revision = "a47cf0d8c291"
down_revision = "cd74121cf2b8"
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table("current_affairs") as batch_op:
        batch_op.alter_column("content", existing_type=sa.Text(), nullable=True)
        batch_op.add_column(sa.Column(
            "content_type", sa.String(length=10), nullable=False,
            server_default="TEXT",
        ))
        batch_op.add_column(sa.Column("media_storage_key", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("original_filename", sa.String(length=255), nullable=True))
        batch_op.add_column(sa.Column("mime_type", sa.String(length=100), nullable=True))
        batch_op.add_column(sa.Column("file_size_bytes", sa.BigInteger(), nullable=True))
        batch_op.add_column(sa.Column("upload_request_id", sa.String(length=36), nullable=True))
        batch_op.create_unique_constraint("uq_current_affairs_upload_request_id", ["upload_request_id"])
        batch_op.alter_column("content_type", server_default=None)


def downgrade():
    with op.batch_alter_table("current_affairs") as batch_op:
        batch_op.drop_constraint("uq_current_affairs_upload_request_id", type_="unique")
        batch_op.drop_column("upload_request_id")
        batch_op.drop_column("file_size_bytes")
        batch_op.drop_column("mime_type")
        batch_op.drop_column("original_filename")
        batch_op.drop_column("media_storage_key")
        batch_op.drop_column("content_type")
        batch_op.alter_column("content", existing_type=sa.Text(), nullable=False)
