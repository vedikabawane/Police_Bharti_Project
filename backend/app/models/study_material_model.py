from datetime import datetime

from app.extensions import db


class StudyMaterial(db.Model):
    __tablename__ = "study_materials"

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

    storage_key = db.Column(
        db.String(500),
        nullable=False
    )

    original_filename = db.Column(
        db.String(255),
        nullable=False
    )

    mime_type = db.Column(
        db.String(100),
        nullable=False
    )

    file_size_bytes = db.Column(
        db.BigInteger,
        nullable=False
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True,
        index=True
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
            "study_materials",
            lazy=True
        )
    )

    topic = db.relationship(
        "Topic",
        backref=db.backref(
            "study_materials",
            lazy=True
        )
    )

    def __repr__(self):
        return f"<StudyMaterial {self.title}>"
