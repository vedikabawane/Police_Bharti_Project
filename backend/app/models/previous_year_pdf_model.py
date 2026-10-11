from datetime import datetime

from app.extensions import db


class PreviousYearPDF(db.Model):
    __tablename__ = "previous_year_pdfs"

    id = db.Column(db.BigInteger, primary_key=True, autoincrement=True)
    title = db.Column(db.String(200), nullable=False)
    exam_name = db.Column(db.String(200), nullable=False, index=True)
    exam_year = db.Column(db.Integer, nullable=False, index=True)
    description = db.Column(db.Text, nullable=True)
    storage_key = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(100), nullable=False)
    file_size_bytes = db.Column(db.BigInteger, nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self):
        return f"<PreviousYearPDF {self.title}>"
