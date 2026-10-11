from datetime import datetime

from app.extensions import db


class Question(db.Model):
    __tablename__ = "questions"

    id = db.Column(
        db.BigInteger,
        primary_key=True,
        autoincrement=True
    )

    subject_id = db.Column(
        db.BigInteger,
        db.ForeignKey("subjects.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    topic_id = db.Column(
        db.BigInteger,
        db.ForeignKey("topics.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    exam_name = db.Column(
        db.String(200),
        nullable=True,
        index=True
    )

    exam_year = db.Column(
        db.Integer,
        nullable=True,
        index=True
    )

    question_text = db.Column(
        db.Text,
        nullable=False
    )

    correct_option = db.Column(
        db.String(1),
        nullable=False
    )

    explanation = db.Column(
        db.Text,
        nullable=True
    )

    difficulty = db.Column(
        db.String(20),
        nullable=False,
        default="medium"
    )

    marks = db.Column(
        db.Numeric(5, 2),
        nullable=False,
        default=1.0
    )

    # Legacy storage only; the application ignores this field for scoring.
    negative_marks = db.Column(
        db.Numeric(5, 2),
        nullable=False,
        default=0.0
    )

    is_pyq = db.Column(
        db.Boolean,
        nullable=False,
        default=False
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
            "questions",
            lazy=True
        )
    )

    topic = db.relationship(
        "Topic",
        backref=db.backref(
            "questions",
            lazy=True
        )
    )

    options = db.relationship(
        "QuestionOption",
        back_populates="question",
        cascade="all, delete-orphan",
        order_by="QuestionOption.option_label"
    )

    def __repr__(self):
        return f"<Question {self.id}>"
