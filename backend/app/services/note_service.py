from math import ceil

from app.repositories.subject_repository import SubjectRepository
from app.repositories.topic_repository import TopicRepository
from app.repositories.note_repository import NoteRepository


class NoteService:

    DEFAULT_PAGE = 1
    DEFAULT_PER_PAGE = 20
    MAX_PER_PAGE = 100

    @classmethod
    def get_admin_notes(cls, page_value=None, per_page_value=None, search_value=None,
                        subject_id_value=None, topic_id_value=None, is_active_value=None):
        page = cls._positive_integer(page_value, "page", cls.DEFAULT_PAGE)
        per_page = cls._positive_integer(per_page_value, "per_page", cls.DEFAULT_PER_PAGE)
        if per_page > cls.MAX_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_PER_PAGE}.")

        subject_id = cls._optional_positive_integer(subject_id_value, "subject_id")
        topic_id = cls._optional_positive_integer(topic_id_value, "topic_id")
        is_active = cls._boolean_filter(is_active_value)
        total, notes = NoteRepository.get_admin_notes(
            (search_value or "").strip(), subject_id, topic_id, is_active, page, per_page
        )
        return {
            "notes": [cls._serialize_admin_note(note) for note in notes],
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
        except (TypeError, ValueError):
            raise ValueError(f"{field_name} must be a positive integer.")
        if parsed < 1:
            raise ValueError(f"{field_name} must be a positive integer.")
        return parsed

    @classmethod
    def _optional_positive_integer(cls, value, field_name):
        return None if value is None or value == "" else cls._positive_integer(value, field_name, None)

    @staticmethod
    def _boolean_filter(value):
        if value is None:
            return None
        normalized = value.strip().lower()
        if normalized == "true":
            return True
        if normalized == "false":
            return False
        raise ValueError("is_active must be 'true' or 'false'.")

    @staticmethod
    def _serialize_admin_note(note):
        return {
            "id": note.id,
            "subject_id": note.subject_id,
            "subject_name": note.subject.name,
            "topic_id": note.topic_id,
            "topic_name": note.topic.name,
            "title": note.title,
            "content": note.content,
            "is_active": note.is_active,
            "created_at": note.created_at.isoformat() if note.created_at else None,
            "updated_at": note.updated_at.isoformat() if note.updated_at else None,
        }

    @staticmethod
    def get_notes_by_topic(topic_id: int):

        topic = TopicRepository.find_by_id(topic_id)

        if not topic:
            raise ValueError("Topic not found.")

        return NoteRepository.get_by_topic_id(topic_id)

    @staticmethod
    def create_note(subject_id: int, topic_id: int, data: dict):

        subject = SubjectRepository.find_by_id(subject_id)

        if not subject:
            raise ValueError("Subject not found.")

        topic = TopicRepository.find_by_id(topic_id)

        if not topic:
            raise ValueError("Topic not found.")

        if topic.subject_id != subject_id:
            raise ValueError(
                "Topic does not belong to this subject."
            )

        return NoteRepository.create(
            subject_id,
            topic_id,
            data
        )

    @staticmethod
    def update_note(note_id: int, data: dict):

        note = NoteRepository.find_by_id(note_id)

        if not note:
            raise ValueError("Note not found.")

        return NoteRepository.update(
            note,
            data
        )

    @staticmethod
    def delete_note(note_id: int):

        note = NoteRepository.find_by_id(note_id)

        if not note:
            raise ValueError("Note not found.")

        NoteRepository.delete(note)
