from app.extensions import db


class TestAnswer(db.Model):
    __tablename__ = "test_answers"

    id = db.Column(
        db.BigInteger,
        primary_key=True,
        autoincrement=True
    )

    attempt_id = db.Column(
        db.BigInteger,
        db.ForeignKey(
            "test_attempts.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    question_id = db.Column(
        db.BigInteger,
        db.ForeignKey(
            "questions.id",
            ondelete="CASCADE"
        ),
        nullable=False,
        index=True
    )

    selected_option = db.Column(
        db.String(1),
        nullable=True
    )

    correct_option = db.Column(
        db.String(1),
        nullable=False
    )

    is_correct = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    marks_obtained = db.Column(
        db.Numeric(6, 2),
        nullable=False,
        default=0
    )

    time_taken_seconds = db.Column(
        db.Integer,
        nullable=False,
        default=0
    )

    attempt = db.relationship(
        "TestAttempt",
        back_populates="answers"
    )

    question = db.relationship(
        "Question",
        backref=db.backref(
            "test_answers",
            lazy=True
        )
    )

    def __repr__(self):
        return f"<TestAnswer {self.id}>"