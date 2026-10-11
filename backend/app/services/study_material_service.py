import logging
from math import ceil

from app.extensions import db
from app.repositories.study_material_repository import StudyMaterialRepository
from app.services.notification_service import NotificationService
from app.utils.study_material_storage import (
    delete_study_material_pdf,
    resolve_study_material_path,
    save_study_material_pdf,
)


logger = logging.getLogger(__name__)


class StudyMaterialService:
    DEFAULT_PAGE = 1
    DEFAULT_PER_PAGE = 20
    MAX_PER_PAGE = 100

    @classmethod
    def create(cls, data, uploaded_file):
        subject = StudyMaterialRepository.find_subject(data["subject_id"])
        if not subject:
            raise ValueError("Subject not found.")
        topic = StudyMaterialRepository.find_topic(data["topic_id"])
        if not topic:
            raise ValueError("Topic not found.")
        if topic.subject_id != subject.id:
            raise ValueError("Topic does not belong to this subject.")

        stored = save_study_material_pdf(uploaded_file)
        try:
            material = StudyMaterialRepository.create({
                **data,
                "storage_key": stored.storage_key,
                "original_filename": stored.original_filename,
                "mime_type": stored.mime_type,
                "file_size_bytes": stored.file_size_bytes,
                "is_active": True,
            })
            NotificationService.try_automatic_notification(
                NotificationService.notify_students_about_study_material,
                title="नवीन अभ्यास साहित्य उपलब्ध",
                message=f"नवीन अभ्यास साहित्य उपलब्ध आहे: {material.title}",
                material_id=material.id,
            )
            return material
        except Exception:
            db.session.rollback()
            try:
                delete_study_material_pdf(stored.storage_key)
            except (OSError, ValueError):
                logger.exception("Failed to clean up study material PDF after database insert failure.")
            raise

    @classmethod
    def list_admin(cls, page_value=None, per_page_value=None, search_value=None,
                   subject_id_value=None, topic_id_value=None, is_active_value=None):
        page = cls._positive_integer(page_value, "page", cls.DEFAULT_PAGE)
        per_page = cls._positive_integer(per_page_value, "per_page", cls.DEFAULT_PER_PAGE)
        if per_page > cls.MAX_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_PER_PAGE}.")
        subject_id = cls._optional_positive_integer(subject_id_value, "subject_id")
        topic_id = cls._optional_positive_integer(topic_id_value, "topic_id")
        is_active = cls._boolean_filter(is_active_value)
        total, materials = StudyMaterialRepository.get_admin_materials(
            (search_value or "").strip(), subject_id, topic_id, is_active, page, per_page
        )
        return {
            "study_materials": [cls.serialize_admin(item) for item in materials],
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
    def _optional_positive_integer(cls, value, field_name):
        return None if value is None or value == "" else cls._positive_integer(value, field_name, None)

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
    def serialize_admin(material):
        return {
            "id": material.id,
            "title": material.title,
            "subject_id": material.subject_id,
            "subject_name": material.subject.name,
            "topic_id": material.topic_id,
            "topic_name": material.topic.name,
            "original_filename": material.original_filename,
            "mime_type": material.mime_type,
            "file_size_bytes": material.file_size_bytes,
            "is_active": material.is_active,
            "created_at": material.created_at.isoformat() if material.created_at else None,
            "updated_at": material.updated_at.isoformat() if material.updated_at else None,
        }

    @staticmethod
    def serialize_student(material):
        return {
            "id": material.id,
            "title": material.title,
            "original_filename": material.original_filename,
            "mime_type": material.mime_type,
            "file_size_bytes": material.file_size_bytes,
            "created_at": material.created_at.isoformat() if material.created_at else None,
            "updated_at": material.updated_at.isoformat() if material.updated_at else None,
        }

    @staticmethod
    def update_status(material_id, is_active):
        material = StudyMaterialRepository.find_by_id(material_id)
        if not material:
            raise LookupError("Study material not found.")
        was_active = material.is_active
        updated_material = StudyMaterialRepository.update_status(material, is_active)
        if not was_active and updated_material.is_active:
            NotificationService.try_automatic_notification(
                NotificationService.notify_students_about_study_material,
                title="नवीन अभ्यास साहित्य उपलब्ध",
                message=f"नवीन अभ्यास साहित्य उपलब्ध आहे: {updated_material.title}",
                material_id=updated_material.id,
            )
        return updated_material

    @staticmethod
    def delete(material_id):
        material = StudyMaterialRepository.find_by_id(material_id)
        if not material:
            raise LookupError("Study material not found.")
        storage_key = material.storage_key
        StudyMaterialRepository.delete(material)
        try:
            if not delete_study_material_pdf(storage_key):
                logger.warning("Study material %s was deleted but its PDF file was already missing.", material_id)
        except (OSError, ValueError):
            logger.exception("Study material %s was deleted but its PDF file could not be removed.", material_id)

    @staticmethod
    def list_active_for_topic(topic_id):
        if not StudyMaterialRepository.find_topic(topic_id):
            raise LookupError("Topic not found.")
        return StudyMaterialRepository.get_active_by_topic(topic_id)

    @staticmethod
    def get_active_file(material_id):
        material = StudyMaterialRepository.find_by_id(material_id)
        if not material or not material.is_active:
            raise LookupError("Study material not found.")
        path = resolve_study_material_path(material.storage_key)
        if not path.is_file():
            raise LookupError("Study material file not found.")
        return material, path
