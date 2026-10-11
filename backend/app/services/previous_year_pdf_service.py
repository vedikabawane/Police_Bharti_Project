import logging
from math import ceil

from app.extensions import db
from app.repositories.previous_year_pdf_repository import PreviousYearPDFRepository
from app.utils.previous_year_pdf_storage import (
    delete_previous_year_pdf,
    resolve_previous_year_pdf_path,
    save_previous_year_pdf,
)


logger = logging.getLogger(__name__)


class PreviousYearPDFService:
    DEFAULT_PAGE = 1
    DEFAULT_PER_PAGE = 20
    MAX_PER_PAGE = 100

    @classmethod
    def create(cls, data, uploaded_file):
        title = (data.get("title") or "").strip()
        exam_name = (data.get("exam_name") or "").strip()
        if not title:
            raise ValueError("title is required and must not be empty.")
        if len(title) > 200:
            raise ValueError("title must be 200 characters or fewer.")
        if not exam_name:
            raise ValueError("exam_name is required and must not be empty.")
        if len(exam_name) > 200:
            raise ValueError("exam_name must be 200 characters or fewer.")
        try:
            exam_year = int(data.get("exam_year"))
        except (TypeError, ValueError) as error:
            raise ValueError("exam_year must be an integer.") from error

        stored = save_previous_year_pdf(uploaded_file)
        try:
            return PreviousYearPDFRepository.create({
                "title": title,
                "exam_name": exam_name,
                "exam_year": exam_year,
                "description": data.get("description"),
                "storage_key": stored.storage_key,
                "original_filename": stored.original_filename,
                "mime_type": stored.mime_type,
                "file_size_bytes": stored.file_size_bytes,
                "is_active": True,
            })
        except Exception:
            db.session.rollback()
            try:
                delete_previous_year_pdf(stored.storage_key)
            except (OSError, ValueError):
                logger.exception("Failed to clean up Previous Year PDF after database insert failure.")
            raise

    @classmethod
    def list_admin(cls, page_value=None, per_page_value=None, search_value=None,
                   exam_name_value=None, exam_year_value=None, is_active_value=None):
        page = cls._positive_integer(page_value, "page", cls.DEFAULT_PAGE)
        per_page = cls._positive_integer(per_page_value, "per_page", cls.DEFAULT_PER_PAGE)
        if per_page > cls.MAX_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_PER_PAGE}.")
        exam_year = cls._optional_integer(exam_year_value, "exam_year")
        is_active = cls._boolean_filter(is_active_value)
        exam_name = (exam_name_value or "").strip() or None
        total, records = PreviousYearPDFRepository.get_admin_pdfs(
            (search_value or "").strip(), exam_name, exam_year, is_active, page, per_page
        )
        return {
            "previous_year_pdfs": [cls.serialize_admin(item) for item in records],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": ceil(total / per_page),
            },
        }

    @classmethod
    def list_student(cls, page_value=None, per_page_value=None, search_value=None,
                     exam_name_value=None, exam_year_value=None):
        page = cls._positive_integer(page_value, "page", cls.DEFAULT_PAGE)
        per_page = cls._positive_integer(per_page_value, "per_page", cls.DEFAULT_PER_PAGE)
        if per_page > cls.MAX_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_PER_PAGE}.")
        exam_year = cls._optional_integer(exam_year_value, "exam_year")
        exam_name = (exam_name_value or "").strip() or None
        total, records = PreviousYearPDFRepository.get_student_pdfs(
            (search_value or "").strip(), exam_name, exam_year, page, per_page
        )
        return {
            "previous_year_pdfs": [cls.serialize_student(item) for item in records],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": ceil(total / per_page),
            },
        }

    @staticmethod
    def _positive_integer(value, field_name, default):
        if value is None or value == "":
            return default
        try:
            parsed = int(value)
        except (TypeError, ValueError) as error:
            raise ValueError(f"{field_name} must be a positive integer.") from error
        if parsed < 1:
            raise ValueError(f"{field_name} must be a positive integer.")
        return parsed

    @classmethod
    def _optional_integer(cls, value, field_name):
        if value is None or value == "":
            return None
        try:
            return int(value)
        except (TypeError, ValueError) as error:
            raise ValueError(f"{field_name} must be an integer.") from error

    @staticmethod
    def _boolean_filter(value):
        if value is None or value == "":
            return None
        if value.strip().lower() == "true":
            return True
        if value.strip().lower() == "false":
            return False
        raise ValueError("is_active must be 'true' or 'false'.")

    @staticmethod
    def serialize_admin(pdf):
        return {
            "id": pdf.id,
            "title": pdf.title,
            "exam_name": pdf.exam_name,
            "exam_year": pdf.exam_year,
            "description": pdf.description,
            "original_filename": pdf.original_filename,
            "mime_type": pdf.mime_type,
            "file_size_bytes": pdf.file_size_bytes,
            "is_active": pdf.is_active,
            "created_at": pdf.created_at.isoformat() if pdf.created_at else None,
            "updated_at": pdf.updated_at.isoformat() if pdf.updated_at else None,
        }

    @staticmethod
    def serialize_student(pdf):
        return {
            "id": pdf.id,
            "title": pdf.title,
            "exam_name": pdf.exam_name,
            "exam_year": pdf.exam_year,
            "description": pdf.description,
            "original_filename": pdf.original_filename,
            "mime_type": pdf.mime_type,
            "file_size_bytes": pdf.file_size_bytes,
            "is_active": pdf.is_active,
            "created_at": pdf.created_at.isoformat() if pdf.created_at else None,
            "updated_at": pdf.updated_at.isoformat() if pdf.updated_at else None,
        }

    @staticmethod
    def get_active_file(pdf_id):
        pdf = PreviousYearPDFRepository.find_by_id(pdf_id)
        if not pdf or not pdf.is_active:
            raise LookupError("Previous Year PDF not found.")
        path = resolve_previous_year_pdf_path(pdf.storage_key)
        if not path.is_file():
            raise LookupError("Previous Year PDF file not found.")
        return pdf, path

    @staticmethod
    def update_status(pdf_id, is_active):
        pdf = PreviousYearPDFRepository.find_by_id(pdf_id)
        if not pdf:
            raise LookupError("Previous Year PDF not found.")
        return PreviousYearPDFRepository.update_status(pdf, is_active)

    @staticmethod
    def delete(pdf_id):
        pdf = PreviousYearPDFRepository.find_by_id(pdf_id)
        if not pdf:
            raise LookupError("Previous Year PDF not found.")
        storage_key = pdf.storage_key
        PreviousYearPDFRepository.delete(pdf)
        try:
            if not delete_previous_year_pdf(storage_key):
                logger.warning(
                    "Previous Year PDF %s was deleted but its file was already missing.", pdf_id
                )
        except (OSError, ValueError):
            logger.exception(
                "Previous Year PDF %s was deleted but its file could not be removed safely.", pdf_id
            )
