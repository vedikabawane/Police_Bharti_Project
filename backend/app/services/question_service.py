from math import ceil

from app.repositories.subject_repository import SubjectRepository
from app.repositories.topic_repository import TopicRepository
from app.repositories.question_repository import QuestionRepository


class QuestionService:

    DEFAULT_PAGE = 1
    DEFAULT_PER_PAGE = 20
    MAX_PER_PAGE = 100

    @classmethod
    def get_admin_questions(
        cls,
        page_value=None,
        per_page_value=None,
        search_value=None,
        subject_id_value=None,
        topic_id_value=None,
        exam_name_value=None,
        exam_year_value=None,
        is_pyq_value=None,
        difficulty_value=None,
        is_active_value=None,
    ):
        page = cls._positive_integer(page_value, "page", cls.DEFAULT_PAGE)
        per_page = cls._positive_integer(
            per_page_value, "per_page", cls.DEFAULT_PER_PAGE
        )
        if per_page > cls.MAX_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_PER_PAGE}.")

        subject_id = cls._optional_positive_integer(subject_id_value, "subject_id")
        topic_id = cls._optional_positive_integer(topic_id_value, "topic_id")
        exam_year = cls._optional_integer(exam_year_value, "exam_year")
        is_pyq = cls._boolean_filter(is_pyq_value, "is_pyq")
        is_active = cls._boolean_filter(is_active_value, "is_active")
        difficulty = cls._optional_difficulty(difficulty_value)
        exam_name = (exam_name_value or "").strip() or None

        total, questions = QuestionRepository.get_admin_questions(
            search=(search_value or "").strip(),
            subject_id=subject_id,
            topic_id=topic_id,
            exam_name=exam_name,
            exam_year=exam_year,
            is_pyq=is_pyq,
            difficulty=difficulty,
            is_active=is_active,
            page=page,
            per_page=per_page,
        )
        return {
            "questions": questions,
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
        if value is None or value == "":
            return None
        return cls._positive_integer(value, field_name, None)

    @staticmethod
    def _optional_integer(value, field_name):
        if value is None or value == "":
            return None
        try:
            return int(value)
        except (TypeError, ValueError):
            raise ValueError(f"{field_name} must be an integer.")

    @staticmethod
    def _boolean_filter(value, field_name):
        if value is None:
            return None
        normalized = str(value).strip().lower()
        if normalized in {"true", "1"}:
            return True
        if normalized in {"false", "0"}:
            return False
        raise ValueError(f"{field_name} must be 'true', 'false', '1', or '0'.")

    @staticmethod
    def _optional_difficulty(value):
        if value is None or value == "":
            return None
        normalized = value.strip().lower()
        if normalized not in {"easy", "medium", "hard"}:
            raise ValueError("difficulty must be easy, medium, or hard.")
        return normalized


    @staticmethod
    def create_question(
        subject_id: int,
        topic_id: int,
        data: dict
    ):

        # The database column is retained for legacy records only.
        data.pop("negative_marks", None)
        data["negative_marks"] = 0

        subject = SubjectRepository.find_by_id(
            subject_id
        )

        if not subject:
            raise ValueError(
                "Subject not found."
            )

        topic = TopicRepository.find_by_id(
            topic_id
        )

        if not topic:
            raise ValueError(
                "Topic not found."
            )

        if topic.subject_id != subject_id:
            raise ValueError(
                "Topic does not belong to this subject."
            )

        return QuestionRepository.create(
            subject_id,
            topic_id,
            data
        )

    @staticmethod
    def get_questions_by_topic(
        topic_id: int
    ):

        topic = TopicRepository.find_by_id(
            topic_id
        )

        if not topic:
            raise ValueError(
                "Topic not found."
            )

        return QuestionRepository.get_by_topic_id(
            topic_id
        )

    @staticmethod
    def get_pyq(
        subject_id=None,
        topic_id=None,
        exam_year=None
    ):

        if subject_id is not None:

            subject = SubjectRepository.find_by_id(
                subject_id
            )

            if not subject:
                raise ValueError(
                    "Subject not found."
                )

        if topic_id is not None:

            topic = TopicRepository.find_by_id(
                topic_id
            )

            if not topic:
                raise ValueError(
                    "Topic not found."
                )

        return QuestionRepository.get_pyq(
            subject_id=subject_id,
            topic_id=topic_id,
            exam_year=exam_year
        )

    @staticmethod
    def update_question(
        question_id: int,
        data: dict
    ):

        # Ignore values sent by older admin clients; negative marking is disabled.
        data.pop("negative_marks", None)

        question = QuestionRepository.find_by_id(
            question_id
        )

        if not question:
            raise ValueError(
                "Question not found."
            )

        if (
            "correct_option" in data
            and "options" not in data
        ):

            existing_labels = {
                option.option_label
                for option in question.options
            }

            if data["correct_option"] not in existing_labels:
                raise ValueError(
                    "Correct option does not exist."
                )

        if "options" in data:

            labels = {
                option["option_label"]
                for option in data["options"]
            }

            correct_option = data.get(
                "correct_option",
                question.correct_option
            )

            if correct_option not in labels:
                raise ValueError(
                    "Correct option must exist in the options."
                )

        return QuestionRepository.update(
            question,
            data
        )

    @staticmethod
    def delete_question(
        question_id: int
    ):

        question = QuestionRepository.find_by_id(
            question_id
        )

        if not question:
            raise ValueError(
                "Question not found."
            )

        if QuestionRepository.has_test_references(question.id):
            QuestionRepository.update(question, {"is_active": False})
            return {"archived": True}

        QuestionRepository.delete(question)
        return {"archived": False}
