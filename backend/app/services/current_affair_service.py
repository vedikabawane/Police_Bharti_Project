from datetime import date
from math import ceil
import re
from pathlib import Path
from uuid import UUID

from werkzeug.utils import secure_filename

from app.repositories.current_affair_repository import CurrentAffairRepository
from app.schemas.current_affair_schema import CATEGORIES
from app.extensions import db
from app.models.current_affair_model import CurrentAffair
from app.utils.current_affair_image_storage import (
    delete_current_affair_image, save_current_affair_image,
)
from app.utils.previous_year_pdf_storage import (
    delete_previous_year_pdf, save_previous_year_pdf,
)


class CurrentAffairService:
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
            raise ValueError(f"{field_name} must be a positive integer.") from error
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

    @staticmethod
    def _category_filter(value):
        if value is None or value == "":
            return None
        category = str(value).strip()
        if category not in CATEGORIES:
            raise ValueError("category is invalid.")
        return category

    @staticmethod
    def _content_type_filter(value):
        if value is None or value == "":
            return None
        content_type = str(value).strip().upper()
        if content_type not in {"TEXT", "IMAGE", "PDF"}:
            raise ValueError("content_type must be TEXT, IMAGE, or PDF.")
        return content_type

    @classmethod
    def _list(cls, *, page_value=None, per_page_value=None, search_value=None,
              category_value=None, is_active_value=None, published_date_value=None,
              active_only=False, content_type_value=None):
        page = cls._positive_integer(page_value, "page", cls.DEFAULT_PAGE)
        per_page = cls._positive_integer(
            per_page_value, "per_page", cls.DEFAULT_PER_PAGE
        )
        if per_page > cls.MAX_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_PER_PAGE}.")
        category = cls._category_filter(category_value)
        is_active = None if active_only else cls._boolean_filter(is_active_value)
        published_date = cls._date_filter(published_date_value)
        content_type = cls._content_type_filter(content_type_value)
        total, rows = CurrentAffairRepository.list_current_affairs(
            search=(search_value or "").strip(),
            category=category,
            is_active=is_active,
            published_date=published_date,
            page=page,
            per_page=per_page,
            active_only=active_only,
            content_type=content_type,
        )
        serializer = cls.serialize_student if active_only else cls.serialize_admin
        return {
            "current_affairs": [serializer(row) for row in rows],
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
    def get_admin(current_affair_id):
        current_affair = CurrentAffairRepository.find_by_id(current_affair_id)
        if not current_affair:
            raise LookupError("Current affair not found.")
        return current_affair

    @staticmethod
    def get_student(current_affair_id):
        current_affair = CurrentAffairRepository.find_by_id(current_affair_id)
        if not current_affair or not current_affair.is_active:
            raise LookupError("Current affair not found.")
        return current_affair

    @staticmethod
    def create(data):
        return CurrentAffairRepository.create(data)

    @staticmethod
    def _derived_title(filename):
        stem = Path(secure_filename(filename or "")).stem
        title = re.sub(r"[-_]+", " ", stem)
        title = re.sub(r"\s+", " ", title).strip(" .")
        if not title or not re.search(r"[A-Za-z0-9\u0900-\u097f]", title):
            return "चालू घडामोडी"
        return title[:200].title()

    @classmethod
    def upload_media(cls, uploaded_file, content_type, current_affair_id=None,
                     upload_request_id=None):
        content_type = cls._content_type_filter(content_type)
        if content_type not in {"IMAGE", "PDF"}:
            raise ValueError("Media uploads must be IMAGE or PDF.")
        if current_affair_id is None and upload_request_id:
            try:
                upload_request_id = str(UUID(upload_request_id))
            except (TypeError, ValueError, AttributeError) as error:
                raise ValueError("X-Upload-Request-ID must be a valid UUID.") from error
            existing = CurrentAffair.query.filter_by(upload_request_id=upload_request_id).first()
            if existing:
                return existing
        if current_affair_id is not None:
            current_affair = cls.get_admin(current_affair_id)
            if current_affair.content_type != content_type:
                raise ValueError("Replacement media must match the current affair content type.")
        stored = None
        if content_type == "IMAGE":
            stored = save_current_affair_image(uploaded_file)
        else:
            stored = save_previous_year_pdf(uploaded_file)
            stored = type("StoredPDF", (), {
                "storage_key": stored.storage_key,
                "original_filename": secure_filename(uploaded_file.filename or "document.pdf")[:255],
                "mime_type": stored.mime_type,
                "file_size_bytes": stored.file_size_bytes,
            })()
        metadata = {
            "content_type": content_type,
            "media_storage_key": stored.storage_key,
            "original_filename": stored.original_filename,
            "mime_type": stored.mime_type,
            "file_size_bytes": stored.file_size_bytes,
        }
        try:
            if current_affair_id is None:
                current_affair = CurrentAffair(
                    title=cls._derived_title(uploaded_file.filename),
                    summary=None, content=None,
                    category=CATEGORIES[0], published_date=date.today(),
                    source_name=None, source_url=None, is_active=True,
                    upload_request_id=upload_request_id,
                    **metadata,
                )
                db.session.add(current_affair)
                db.session.commit()
                return current_affair
            old_key = current_affair.media_storage_key
            for key, value in metadata.items():
                setattr(current_affair, key, value)
            db.session.commit()
        except Exception:
            db.session.rollback()
            cls._delete_stored_media(content_type, stored.storage_key)
            raise
        if old_key:
            cls._delete_stored_media(content_type, old_key, ignore_errors=True)
        return current_affair

    @staticmethod
    def _delete_stored_media(content_type, storage_key, ignore_errors=False):
        try:
            if content_type == "IMAGE":
                delete_current_affair_image(storage_key)
            elif content_type == "PDF":
                delete_previous_year_pdf(storage_key)
        except (OSError, ValueError):
            if not ignore_errors:
                raise

    @classmethod
    def update(cls, current_affair_id, data):
        current_affair = cls.get_admin(current_affair_id)
        if not data:
            raise ValueError("At least one content field must be provided.")
        return CurrentAffairRepository.update(current_affair, data)

    @classmethod
    def update_status(cls, current_affair_id, is_active):
        if type(is_active) is not bool:
            raise ValueError("is_active must be a boolean.")
        current_affair = cls.get_admin(current_affair_id)
        return CurrentAffairRepository.update_status(current_affair, is_active)

    @classmethod
    def delete(cls, current_affair_id):
        current_affair = cls.get_admin(current_affair_id)
        content_type = current_affair.content_type
        storage_key = current_affair.media_storage_key
        CurrentAffairRepository.delete(current_affair)
        if storage_key:
            cls._delete_stored_media(content_type, storage_key, ignore_errors=True)

    @staticmethod
    def serialize_admin(current_affair):
        return {
            "id": current_affair.id,
            "title": current_affair.title,
            "summary": current_affair.summary,
            "content": current_affair.content,
            "category": current_affair.category,
            "published_date": current_affair.published_date.isoformat(),
            "source_name": current_affair.source_name,
            "source_url": current_affair.source_url,
            "is_active": current_affair.is_active,
            "content_type": current_affair.content_type,
            "original_filename": current_affair.original_filename,
            "file_size_bytes": current_affair.file_size_bytes,
            "media_url": f"/api/admin/current-affairs/{current_affair.id}/media" if current_affair.media_storage_key else None,
            "created_at": current_affair.created_at.isoformat() if current_affair.created_at else None,
            "updated_at": current_affair.updated_at.isoformat() if current_affair.updated_at else None,
        }

    @staticmethod
    def serialize_student(current_affair):
        data = {
            "id": current_affair.id,
            "title": current_affair.title,
            "summary": current_affair.summary,
            "content": current_affair.content,
            "category": current_affair.category,
            "published_date": current_affair.published_date.isoformat(),
            "source_name": current_affair.source_name,
            "source_url": current_affair.source_url,
        }
        if current_affair.content_type in {"IMAGE", "PDF"}:
            data.update({
                "content_type": current_affair.content_type,
                "original_filename": current_affair.original_filename,
                "file_size_bytes": current_affair.file_size_bytes,
                "media_url": f"/api/student/current-affairs/{current_affair.id}/media",
                "download_url": (
                    f"/api/student/current-affairs/{current_affair.id}/download"
                    if current_affair.content_type == "PDF" else None
                ),
            })
        return data
