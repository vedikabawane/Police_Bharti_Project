from datetime import datetime

from app.extensions import db


class CurrentAffair(db.Model):
    __tablename__ = "current_affairs"
    __table_args__ = (
        db.Index(
            "ix_current_affairs_active_published_date_id",
            "is_active",
            "published_date",
            "id",
        ),
        db.Index("ix_current_affairs_category", "category"),
    )

    id = db.Column(
        db.BigInteger().with_variant(db.Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    title = db.Column(db.String(200), nullable=False)
    summary = db.Column(db.String(1000), nullable=True)
    content = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(80), nullable=False, default="महाराष्ट्र")
    published_date = db.Column(db.Date, nullable=False, index=True)
    source_name = db.Column(db.String(200), nullable=True)
    source_url = db.Column(db.String(500), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True, index=True)
    content_type = db.Column(db.String(10), nullable=False, default="TEXT")
    media_storage_key = db.Column(db.String(100), nullable=True)
    original_filename = db.Column(db.String(255), nullable=True)
    mime_type = db.Column(db.String(100), nullable=True)
    file_size_bytes = db.Column(db.BigInteger, nullable=True)
    upload_request_id = db.Column(db.String(36), nullable=True, unique=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    def __repr__(self):
        return f"<CurrentAffair {self.title}>"
