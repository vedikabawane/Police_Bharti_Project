from sqlalchemy import or_

from app.extensions import db
from app.models.previous_year_pdf_model import PreviousYearPDF


class PreviousYearPDFRepository:
    @staticmethod
    def create(data):
        pdf = PreviousYearPDF(**data)
        db.session.add(pdf)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return pdf

    @staticmethod
    def get_admin_pdfs(search, exam_name, exam_year, is_active, page, per_page):
        query = PreviousYearPDF.query
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(
                PreviousYearPDF.title.ilike(pattern),
                PreviousYearPDF.exam_name.ilike(pattern),
                PreviousYearPDF.original_filename.ilike(pattern),
            ))
        if exam_name is not None:
            query = query.filter(PreviousYearPDF.exam_name == exam_name)
        if exam_year is not None:
            query = query.filter(PreviousYearPDF.exam_year == exam_year)
        if is_active is not None:
            query = query.filter(PreviousYearPDF.is_active == is_active)

        total = query.order_by(None).count()
        records = query.order_by(
            PreviousYearPDF.created_at.desc(), PreviousYearPDF.id.desc()
        ).offset((page - 1) * per_page).limit(per_page).all()
        return total, records

    @staticmethod
    def get_student_pdfs(search, exam_name, exam_year, page, per_page):
        query = PreviousYearPDF.query.filter(PreviousYearPDF.is_active.is_(True))
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(
                PreviousYearPDF.title.ilike(pattern),
                PreviousYearPDF.exam_name.ilike(pattern),
                PreviousYearPDF.original_filename.ilike(pattern),
            ))
        if exam_name is not None:
            query = query.filter(PreviousYearPDF.exam_name == exam_name)
        if exam_year is not None:
            query = query.filter(PreviousYearPDF.exam_year == exam_year)

        total = query.order_by(None).count()
        records = query.order_by(
            PreviousYearPDF.created_at.desc(), PreviousYearPDF.id.desc()
        ).offset((page - 1) * per_page).limit(per_page).all()
        return total, records

    @staticmethod
    def find_by_id(pdf_id):
        return db.session.get(PreviousYearPDF, pdf_id)

    @staticmethod
    def update_status(pdf, is_active):
        pdf.is_active = is_active
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return pdf

    @staticmethod
    def delete(pdf):
        db.session.delete(pdf)
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
