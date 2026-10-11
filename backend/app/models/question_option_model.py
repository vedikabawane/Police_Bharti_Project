from app.extensions import db


class QuestionOption(db.Model):
    __tablename__ = "question_options"

    id = db.Column(
        db.BigInteger,
        primary_key=True,
        autoincrement=True
    )

    question_id = db.Column(
        db.BigInteger,
        db.ForeignKey("questions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    option_label = db.Column(
        db.String(1),
        nullable=False
    )

    option_text = db.Column(
        db.Text,
        nullable=False
    )

    question = db.relationship(
        "Question",
        back_populates="options"
    )

    def __repr__(self):
        return (
            f"<QuestionOption "
            f"{self.option_label}>"
        )