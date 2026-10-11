from datetime import datetime

from app.extensions import db


class RecruitmentNotice(db.Model):
    __tablename__ = "recruitment_notices"
    __table_args__ = (
        db.Index(
            "ix_recruitment_notices_active_published_id",
            "is_active",
            "published_date",
            "id",
        ),
        db.Index("ix_recruitment_notices_notice_type", "notice_type"),
        db.Index("ix_recruitment_notices_recruitment_year", "recruitment_year"),
        db.Index("ix_recruitment_notices_department", "department"),
        db.Index("ix_recruitment_notices_published_date", "published_date"),
    )

    id = db.Column(
        db.BigInteger().with_variant(db.Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    title = db.Column(db.String(200), nullable=False)
    summary = db.Column(db.String(1000), nullable=True)
    content = db.Column(db.Text, nullable=True)
    notice_type = db.Column(db.String(40), nullable=False)
    recruitment_year = db.Column(db.Integer, nullable=True)
    department = db.Column(db.String(200), nullable=True)
    post_name = db.Column(db.String(200), nullable=True)
    vacancies = db.Column(db.Integer, nullable=True)
    application_start_date = db.Column(db.Date, nullable=True)
    application_end_date = db.Column(db.Date, nullable=True)
    exam_date = db.Column(db.Date, nullable=True)
    published_date = db.Column(db.Date, nullable=False)
    official_source_name = db.Column(db.String(200), nullable=True)
    official_source_url = db.Column(db.String(500), nullable=True)
    pdf_storage_key = db.Column(db.String(255), nullable=True)
    pdf_original_filename = db.Column(db.String(255), nullable=True)
    pdf_mime_type = db.Column(db.String(100), nullable=True)
    pdf_file_size_bytes = db.Column(db.BigInteger, nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    def __repr__(self):
        return f"<RecruitmentNotice {self.title}>"
