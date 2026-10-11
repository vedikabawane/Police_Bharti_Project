from datetime import datetime

from app.extensions import db


class TestAttempt(db.Model):
    __tablename__ = "test_attempts"

    id = db.Column(
        db.BigInteger,
        primary_key=True,
        autoincrement=True
    )

    test_id = db.Column(
        db.BigInteger,
        db.ForeignKey("tests.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    student_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    started_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    submitted_at = db.Column(
        db.DateTime,
        nullable=True
    )

    score = db.Column(
        db.Numeric(8, 2),
        nullable=False,
        default=0
    )

    correct_answers = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    wrong_answers = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    skipped_answers = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    percentage = db.Column(
        db.Numeric(6, 2),
        nullable=False,
        default=0
    )

    time_taken_seconds = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    accuracy = db.Column(
        db.Numeric(6, 2),
        nullable=False,
        default=0
    )

    status = db.Column(
        db.String(20),
        nullable=False,
        default="in_progress"
    )

    test = db.relationship(
        "Test",
        back_populates="attempts"
    )

    student = db.relationship(
        "User",
        backref=db.backref(
            "test_attempts",
            lazy=True
        )
    )

    answers = db.relationship(
        "TestAnswer",
        back_populates="attempt",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<TestAttempt {self.id}>"