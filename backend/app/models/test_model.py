from datetime import datetime

from app.extensions import db


class Test(db.Model):
    __tablename__ = "tests"

    id = db.Column(
        db.BigInteger,
        primary_key=True,
        autoincrement=True
    )

    title = db.Column(
        db.String(200),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
    )

    instructions = db.Column(
        db.Text,
        nullable=True
    )

    test_type = db.Column(
        db.String(30),
        nullable=False,
        index=True
    )

    subject_id = db.Column(
        db.BigInteger,
        db.ForeignKey("subjects.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    topic_id = db.Column(
        db.BigInteger,
        db.ForeignKey("topics.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    duration_minutes = db.Column(
        db.Integer,
        nullable=False,
        default=30
    )

    total_questions = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    total_marks = db.Column(
        db.Numeric(8, 2),
        nullable=False,
        default=0
    )

    # Legacy storage only; tests no longer support negative marking.
    negative_marks = db.Column(
        db.Numeric(5, 2),
        nullable=False,
        default=0
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
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

    subject = db.relationship(
        "Subject",
        backref=db.backref(
            "tests",
            lazy=True
        )
    )

    topic = db.relationship(
        "Topic",
        backref=db.backref(
            "tests",
            lazy=True
        )
    )

    questions = db.relationship(
        "TestQuestion",
        back_populates="test",
        cascade="all, delete-orphan"
    )

    attempts = db.relationship(
        "TestAttempt",
        back_populates="test",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Test {self.title}>"
