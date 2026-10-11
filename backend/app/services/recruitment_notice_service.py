import logging
from datetime import date
from math import ceil
from werkzeug.utils import secure_filename

from app.extensions import db
from app.repositories.recruitment_notice_repository import RecruitmentNoticeRepository
from app.schemas.recruitment_notice_schema import NOTICE_TYPES
from app.utils.previous_year_pdf_storage import (
    delete_previous_year_pdf,
    resolve_previous_year_pdf_path,
    save_previous_year_pdf,
)


logger = logging.getLogger(__name__)


class RecruitmentNoticeService:
    DEFAULT_PAGE = 1
    DEFAULT_PER_PAGE = 20
    MAX_PER_PAGE = 100

    @classmethod
    def _positive_integer(cls, value, field_name, default):
        if value is None or value == "":
            return default
        try:
            parsed = int(value)
        except (TypeError, ValueError) as error:
            raise ValueError(f"{field_name} must be an integer.") from error
        if parsed < 1:
            raise ValueError(f"{field_name} must be a positive integer.")
        return parsed

    @staticmethod
    def _boolean_filter(value):
        if value is None or value == "":
            return None
        normalized = str(value).strip().lower()
        if normalized in {"true", "1"}:
            return True
        if normalized in {"false", "0"}:
            return False
        raise ValueError("is_active must be 'true' or 'false'.")

    @staticmethod
    def _date_filter(value):
        if value is None or value == "":
            return None
        try:
            return date.fromisoformat(str(value))
        except ValueError as error:
            raise ValueError("published_date must be a valid YYYY-MM-DD date.") from error

    @classmethod
    def _list(cls, *, page_value=None, per_page_value=None, search_value=None,
              notice_type_value=None, recruitment_year_value=None,
              department_value=None, is_active_value=None,
              published_date_value=None, active_only=False):
        page = cls._positive_integer(page_value, "page", cls.DEFAULT_PAGE)
        per_page = cls._positive_integer(
            per_page_value, "per_page", cls.DEFAULT_PER_PAGE
        )
        if per_page > cls.MAX_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_PER_PAGE}.")

        notice_type = (notice_type_value or "").strip().upper() or None
        if notice_type and notice_type not in NOTICE_TYPES:
            raise ValueError("notice_type is invalid.")
        recruitment_year = None
        if recruitment_year_value not in (None, ""):
            recruitment_year = cls._positive_integer(
                recruitment_year_value, "recruitment_year", None
            )
        is_active = None if active_only else cls._boolean_filter(is_active_value)
        published_date = cls._date_filter(published_date_value)
        total, records = RecruitmentNoticeRepository.list_notices(
            search=(search_value or "").strip(),
            notice_type=notice_type,
            recruitment_year=recruitment_year,
            department=(department_value or "").strip() or None,
            is_active=is_active,
            published_date=published_date,
            page=page,
            per_page=per_page,
            active_only=active_only,
        )
        serializer = cls.serialize_student if active_only else cls.serialize_admin
        return {
            "recruitment_notices": [serializer(item) for item in records],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": ceil(total / per_page) if total else 0,
            },
        }

    @classmethod
    def list_admin(cls, **filters):
        return cls._list(**filters)

    @classmethod
    def list_student(cls, **filters):
        return cls._list(active_only=True, **filters)

    @staticmethod
    def get_admin(notice_id):
        notice = RecruitmentNoticeRepository.find_by_id(notice_id)
        if not notice:
            raise LookupError("Recruitment notice not found.")
        return notice

    @staticmethod
    def get_student(notice_id):
        notice = RecruitmentNoticeRepository.find_by_id(notice_id)
        if not notice or not notice.is_active:
            raise LookupError("Recruitment notice not found.")
        return notice

    @staticmethod
    def _validate_date_range(data):
        start_date = data.get("application_start_date")
        end_date = data.get("application_end_date")
        if start_date and end_date and start_date > end_date:
            raise ValueError(
                "application_end_date must be on or after application_start_date."
            )

    @staticmethod
    def _pdf_fields(stored):
        return {
            "pdf_storage_key": stored.storage_key,
            "pdf_original_filename": secure_filename(stored.original_filename) or "recruitment-notice.pdf",
            "pdf_mime_type": stored.mime_type,
            "pdf_file_size_bytes": stored.file_size_bytes,
        }

    @staticmethod
    def _clear_pdf_fields():
        return {
            "pdf_storage_key": None,
            "pdf_original_filename": None,
            "pdf_mime_type": None,
            "pdf_file_size_bytes": None,
        }

    @staticmethod
    def _cleanup_pdf(storage_key, *, message):
        if not storage_key:
            return
        try:
            if not delete_previous_year_pdf(storage_key):
                logger.warning("%s: stored PDF was already missing.", message)
        except (OSError, ValueError):
            logger.exception("%s: stored PDF could not be removed safely.", message)

    @classmethod
    def create(cls, data, uploaded_file=None):
        values = dict(data)
        if not values.get("official_source_url") and uploaded_file is None:
            raise ValueError("An official source URL or a PDF notice is required.")
        cls._validate_date_range(values)

        stored = save_previous_year_pdf(uploaded_file) if uploaded_file else None
        if stored:
            values.update(cls._pdf_fields(stored))
        try:
            return RecruitmentNoticeRepository.create(values)
        except Exception:
            db.session.rollback()
            if stored:
                cls._cleanup_pdf(stored.storage_key, message="Notice creation failed")
            raise

    @classmethod
    def update(cls, notice_id, data, uploaded_file=None):
        notice = cls.get_admin(notice_id)
        values = dict(data)
        remove_pdf = values.pop("remove_pdf", False)
        if remove_pdf and uploaded_file:
            raise ValueError("Choose either a replacement PDF or remove the existing PDF.")
        if not values and not remove_pdf and not uploaded_file:
            raise ValueError("At least one notice field must be provided.")

        effective_source_url = values.get(
            "official_source_url", notice.official_source_url
        )
        has_pdf_after_update = bool(uploaded_file) or (
            bool(notice.pdf_storage_key) and not remove_pdf
        )
        if not effective_source_url and not has_pdf_after_update:
            raise ValueError("An official source URL or a PDF notice is required.")

        effective_dates = {
            "application_start_date": values.get(
                "application_start_date", notice.application_start_date
            ),
            "application_end_date": values.get(
                "application_end_date", notice.application_end_date
            ),
        }
        cls._validate_date_range(effective_dates)

        old_storage_key = notice.pdf_storage_key
        stored = save_previous_year_pdf(uploaded_file) if uploaded_file else None
        if stored:
            values.update(cls._pdf_fields(stored))
        elif remove_pdf:
            values.update(cls._clear_pdf_fields())

        try:
            updated = RecruitmentNoticeRepository.update(notice, values)
        except Exception:
            db.session.rollback()
            if stored:
                cls._cleanup_pdf(stored.storage_key, message="Notice update failed")
            raise

        if old_storage_key and (stored or remove_pdf):
            cls._cleanup_pdf(old_storage_key, message=f"Notice {notice_id} PDF replacement")
        return updated

    @staticmethod
    def update_status(notice_id, is_active):
        if type(is_active) is not bool:
            raise ValueError("is_active must be a boolean.")
        notice = RecruitmentNoticeService.get_admin(notice_id)
        return RecruitmentNoticeRepository.update_status(notice, is_active)

    @classmethod
    def delete(cls, notice_id):
        notice = cls.get_admin(notice_id)
        storage_key = notice.pdf_storage_key
        RecruitmentNoticeRepository.delete(notice)
        if storage_key:
            cls._cleanup_pdf(storage_key, message=f"Notice {notice_id} deleted")

    @staticmethod
    def get_active_file(notice_id):
        notice = RecruitmentNoticeService.get_student(notice_id)
        if not notice.pdf_storage_key:
            raise LookupError("Recruitment notice PDF not found.")
        path = resolve_previous_year_pdf_path(notice.pdf_storage_key)
        if not path.is_file():
            raise LookupError("Recruitment notice PDF not found.")
        return notice, path

    @staticmethod
    def serialize_admin(notice):
        return {
            "id": notice.id,
            "title": notice.title,
            "summary": notice.summary,
            "content": notice.content,
            "notice_type": notice.notice_type,
            "recruitment_year": notice.recruitment_year,
            "department": notice.department,
            "post_name": notice.post_name,
            "vacancies": notice.vacancies,
            "application_start_date": notice.application_start_date.isoformat() if notice.application_start_date else None,
            "application_end_date": notice.application_end_date.isoformat() if notice.application_end_date else None,
            "exam_date": notice.exam_date.isoformat() if notice.exam_date else None,
            "published_date": notice.published_date.isoformat(),
            "official_source_name": notice.official_source_name,
            "official_source_url": notice.official_source_url,
            "pdf_available": bool(notice.pdf_storage_key),
            "pdf_original_filename": notice.pdf_original_filename,
            "pdf_mime_type": notice.pdf_mime_type,
            "pdf_file_size_bytes": notice.pdf_file_size_bytes,
            "is_active": notice.is_active,
            "created_at": notice.created_at.isoformat() if notice.created_at else None,
            "updated_at": notice.updated_at.isoformat() if notice.updated_at else None,
        }

    @staticmethod
    def serialize_student(notice):
        return {
            "id": notice.id,
            "title": notice.title,
            "summary": notice.summary,
            "content": notice.content,
            "notice_type": notice.notice_type,
            "recruitment_year": notice.recruitment_year,
            "department": notice.department,
            "post_name": notice.post_name,
            "vacancies": notice.vacancies,
            "application_start_date": notice.application_start_date.isoformat() if notice.application_start_date else None,
            "application_end_date": notice.application_end_date.isoformat() if notice.application_end_date else None,
            "exam_date": notice.exam_date.isoformat() if notice.exam_date else None,
            "published_date": notice.published_date.isoformat(),
            "official_source_name": notice.official_source_name,
            "official_source_url": notice.official_source_url,
            "pdf_available": bool(notice.pdf_storage_key),
            "pdf_original_filename": notice.pdf_original_filename,
            "pdf_file_size_bytes": notice.pdf_file_size_bytes,
        }
