from datetime import datetime

from app.extensions import db


class Video(db.Model):
    __tablename__ = "videos"
    __table_args__ = (
        db.UniqueConstraint("storage_key", name="uq_videos_storage_key"),
    )

    id = db.Column(
        db.BigInteger().with_variant(db.Integer, "sqlite"),
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

    video_url = db.Column(
        db.String(500),
        nullable=True
    )

    source_type = db.Column(
        db.String(10), nullable=False, default="URL", server_default="URL"
    )

    storage_key = db.Column(db.String(255), nullable=True)
    original_filename = db.Column(db.String(255), nullable=True)
    mime_type = db.Column(db.String(100), nullable=True)
    file_size_bytes = db.Column(db.BigInteger, nullable=True)

    description = db.Column(
        db.Text,
        nullable=True
    )

    duration = db.Column(
        db.String(20),
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
        backref=db.backref(
            "videos",
            lazy=True
        )
    )

    topic = db.relationship(
        "Topic",
        backref=db.backref(
            "videos",
            lazy=True
        )
    )

    def __repr__(self):
        return f"<Video {self.title}>"
