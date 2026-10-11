from math import ceil

from app.repositories.subject_repository import SubjectRepository


class SubjectService:
    DEFAULT_PAGE = 1
    DEFAULT_PER_PAGE = 20
    MAX_PER_PAGE = 100

    @staticmethod
    def get_all_subjects():

        return SubjectRepository.get_all()

    @classmethod
    def get_admin_subjects(
        cls,
        page_value=None,
        per_page_value=None,
        search_value=None,
        is_active_value=None,
    ):
        page = cls._positive_integer(page_value, "page", cls.DEFAULT_PAGE)
        per_page = cls._positive_integer(
            per_page_value, "per_page", cls.DEFAULT_PER_PAGE
        )
        if per_page > cls.MAX_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_PER_PAGE}.")

        is_active = cls._boolean_filter(is_active_value)
        search = (search_value or "").strip()
        total, records = SubjectRepository.get_admin_subjects(
            search=search,
            is_active=is_active,
            page=page,
            per_page=per_page,
        )
        return {
            "subjects": [cls._serialize_admin_subject(item) for item in records],
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
    def _serialize_admin_subject(subject):
        return {
            "id": subject.id,
            "name": subject.name,
            "description": subject.description,
            "is_active": subject.is_active,
            "created_at": subject.created_at.isoformat() if subject.created_at else None,
            "updated_at": subject.updated_at.isoformat() if subject.updated_at else None,
        }

    @staticmethod
    def get_subject(subject_id: int):

        subject = SubjectRepository.find_by_id(
            subject_id
        )

        if not subject:
            raise ValueError(
                "Subject not found."
            )

        return subject

    @staticmethod
    def create_subject(data: dict):

        name = data["name"].strip()

        existing_subject = (
            SubjectRepository.find_by_name(name)
        )

        if existing_subject:
            raise ValueError(
                "Subject already exists."
            )

        return SubjectRepository.create(
            name=name,
            description=data.get("description")
        )

    @staticmethod
    def update_subject(
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

        if "name" in data:
            data["name"] = data["name"].strip()

        return SubjectRepository.update(
            subject,
            data
        )

    @staticmethod
    def delete_subject(subject_id: int):

        subject = SubjectRepository.find_by_id(
            subject_id
        )

        if not subject:
            raise ValueError(
                "Subject not found."
            )

        if SubjectRepository.has_dependents(subject.id):
            SubjectRepository.update(subject, {"is_active": False})
            return {"archived": True}

        SubjectRepository.delete(subject)
        return {"archived": False}
