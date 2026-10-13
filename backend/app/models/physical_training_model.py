from datetime import datetime

from app.extensions import db


class PhysicalTraining(db.Model):
    """Store running times in seconds, distances/shot put in meters, and weight in kg.

    ``running`` is a general running duration in seconds. ``run_100m``,
    ``run_1600m``, and ``run_800m`` are event times in seconds.
    """

    __tablename__ = "physical_training_records"

    id = db.Column(
        db.BigInteger().with_variant(db.Integer, "sqlite"),
        primary_key=True,
        autoincrement=True
    )

    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    date = db.Column(
        db.Date,
        nullable=False,
        index=True
    )

    running = db.Column(
        db.Numeric(8, 2),
        nullable=True
    )

    run_100m = db.Column(
        db.Numeric(8, 2),
        nullable=True
    )

    run_1600m = db.Column(
        db.Numeric(8, 2),
        nullable=True
    )

    run_800m = db.Column(
        db.Numeric(8, 2),
        nullable=True
    )

    shot_put = db.Column(
        db.Numeric(8, 2),
        nullable=True
    )

    push_ups = db.Column(
        db.Integer,
        nullable=True
    )

    running_distance = db.Column(
        db.Numeric(8, 2),
        nullable=True
    )

    running_time = db.Column(
        db.Numeric(8, 2),
        nullable=True
    )

    weight = db.Column(
        db.Numeric(8, 2),
        nullable=True
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    user = db.relationship(
        "User",
        backref=db.backref(
            "physical_training_records",
            lazy=True
        )
    )

    def __repr__(self):
        return f"<PhysicalTraining {self.id} user_id={self.user_id}>"
