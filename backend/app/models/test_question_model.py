from app.extensions import db


class TestQuestion(db.Model):
    __tablename__ = "test_questions"

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

    question_id = db.Column(
        db.BigInteger,
        db.ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    question_order = db.Column(
        db.Integer,
        nullable=False
    )

    test = db.relationship(
        "Test",
        back_populates="questions"
    )

    question = db.relationship(
        "Question",
        backref=db.backref(
            "test_questions",
            lazy=True
        )
    )

    def __repr__(self):
        return f"<TestQuestion {self.test_id}-{self.question_id}>"