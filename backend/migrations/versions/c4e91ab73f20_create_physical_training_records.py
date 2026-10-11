"""create physical training records

Revision ID: c4e91ab73f20
Revises: 0cb2eedc9241, da7283fbad34
Create Date: 2026-10-02

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "c4e91ab73f20"
down_revision = ("0cb2eedc9241", "da7283fbad34")
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "physical_training_records",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.BigInteger(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("running", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column("run_100m", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column("run_1600m", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column("run_800m", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column("long_jump", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column("shot_put", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column("push_ups", sa.Integer(), nullable=True),
        sa.Column(
            "running_distance",
            sa.Numeric(precision=8, scale=2),
            nullable=True
        ),
        sa.Column(
            "running_time",
            sa.Numeric(precision=8, scale=2),
            nullable=True
        ),
        sa.Column("weight", sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id")
    )
    op.create_index(
        "ix_physical_training_records_user_id",
        "physical_training_records",
        ["user_id"],
        unique=False
    )
    op.create_index(
        "ix_physical_training_records_date",
        "physical_training_records",
        ["date"],
        unique=False
    )


def downgrade():
    op.drop_index(
        "ix_physical_training_records_date",
        table_name="physical_training_records"
    )
    op.drop_index(
        "ix_physical_training_records_user_id",
        table_name="physical_training_records"
    )
    op.drop_table("physical_training_records")
