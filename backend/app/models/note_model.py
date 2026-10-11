from datetime import datetime

from app.extensions import db


class Note(db.Model):
    __tablename__ = "notes"

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

    title = db.Column(
        db.String(200),
        nullable=False
    )

    content = db.Column(
        db.Text,
        nullable=False
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
        backref=db.backref("notes", lazy=True)
    )

    topic = db.relationship(
        "Topic",
        backref=db.backref("notes", lazy=True)
    )

    def __repr__(self):
        return f"<Note {self.title}>"