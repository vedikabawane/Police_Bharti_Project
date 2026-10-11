from math import ceil

from app.repositories.subject_repository import SubjectRepository
from app.repositories.topic_repository import TopicRepository


class TopicService:

    DEFAULT_PAGE = 1
    DEFAULT_PER_PAGE = 20
    MAX_PER_PAGE = 100

    @classmethod
    def get_admin_topics(cls, page_value=None, per_page_value=None, search_value=None,
                         subject_id_value=None, is_active_value=None):
        page = cls._positive_integer(page_value, "page", cls.DEFAULT_PAGE)
        per_page = cls._positive_integer(per_page_value, "per_page", cls.DEFAULT_PER_PAGE)
        if per_page > cls.MAX_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_PER_PAGE}.")
        subject_id = None
        if subject_id_value is not None and subject_id_value != "":
            subject_id = cls._positive_integer(subject_id_value, "subject_id", None)
        is_active = cls._boolean_filter(is_active_value)
        total, topics = TopicRepository.get_admin_topics(
            (search_value or "").strip(), subject_id, is_active, page, per_page
        )
        return {
            "topics": [cls._serialize_admin_topic(topic) for topic in topics],
            "pagination": {"page": page, "per_page": per_page, "total": total,
                           "pages": ceil(total / per_page)},
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
    def _serialize_admin_topic(topic):
        return {"id": topic.id, "subject_id": topic.subject_id,
                "subject_name": topic.subject.name, "name": topic.name,
                "description": topic.description, "is_active": topic.is_active,
                "created_at": topic.created_at.isoformat() if topic.created_at else None,
                "updated_at": topic.updated_at.isoformat() if topic.updated_at else None}

    @staticmethod
    def get_topics_by_subject(subject_id: int):

        subject = SubjectRepository.find_by_id(
            subject_id
        )

        if not subject:
            raise ValueError(
                "Subject not found."
            )

        return TopicRepository.get_by_subject_id(
            subject_id
        )

    @staticmethod
    def create_topic(
        subject_id: int,
        data: dict
    ):

        subject = SubjectRepository.find_by_id(
            subject_id
        )

        if not subject:
            raise ValueError(
                "Subject not found."
            )

        name = data["name"].strip()

        existing_topic = TopicRepository.find_by_name(
            subject_id,
            name
        )

        if existing_topic:
            raise ValueError(
                "Topic already exists in this subject."
            )

        return TopicRepository.create(
            subject_id=subject_id,
            name=name,
            description=data.get("description"),
            is_active=data.get("is_active", True)
        )

    @staticmethod
    def update_topic(
        topic_id: int,
        data: dict
    ):

        topic = TopicRepository.find_by_id(
            topic_id
        )

        if not topic:
            raise ValueError(
                "Topic not found."
            )

        if "name" in data:
            data["name"] = data["name"].strip()

        if "subject_id" in data and not SubjectRepository.find_by_id(data["subject_id"]):
            raise ValueError("Subject not found.")

        return TopicRepository.update(
            topic,
            data
        )

    @staticmethod
    def delete_topic(topic_id: int):

        topic = TopicRepository.find_by_id(
            topic_id
        )

        if not topic:
            raise ValueError(
                "Topic not found."
            )

        if TopicRepository.has_dependents(topic.id):
            TopicRepository.update(topic, {"is_active": False})
            return {"archived": True}

        TopicRepository.delete(topic)
        return {"archived": False}
