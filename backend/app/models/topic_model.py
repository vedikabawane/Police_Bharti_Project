from datetime import datetime

from app.extensions import db


class Topic(db.Model):
    __tablename__ = "topics"

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

    name = db.Column(
        db.String(150),
        nullable=False
    )

    description = db.Column(
        db.Text,
        nullable=True
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
        back_populates="topics"
    )

    def __repr__(self):
        return f"<Topic {self.name}>"