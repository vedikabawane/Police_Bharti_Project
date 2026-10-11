from app.extensions import db
from app.models.question_model import Question
from app.models.question_option_model import QuestionOption
from app.models.test_answer_model import TestAnswer
from app.models.test_question_model import TestQuestion
from app.models.topic_model import Topic
from sqlalchemy import or_
from sqlalchemy.orm import contains_eager, selectinload


class QuestionRepository:

    @staticmethod
    def get_admin_questions(
        search: str,
        subject_id,
        topic_id,
        exam_name,
        exam_year,
        is_pyq,
        difficulty,
        is_active,
        page: int,
        per_page: int,
    ):
        query = Question.query.join(Question.subject).join(Question.topic).options(
            contains_eager(Question.subject),
            contains_eager(Question.topic),
            selectinload(Question.options),
        )

        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Question.question_text.ilike(pattern),
                    Question.exam_name.ilike(pattern),
                )
            )
        if subject_id is not None:
            query = query.filter(Question.subject_id == subject_id)
        if topic_id is not None:
            query = query.filter(Question.topic_id == topic_id)
        if subject_id is not None and topic_id is not None:
            query = query.filter(Topic.subject_id == subject_id)
        if exam_name is not None:
            query = query.filter(Question.exam_name == exam_name)
        if exam_year is not None:
            query = query.filter(Question.exam_year == exam_year)
        if is_pyq is not None:
            query = query.filter(Question.is_pyq == is_pyq)
        if difficulty is not None:
            query = query.filter(Question.difficulty == difficulty)
        if is_active is not None:
            query = query.filter(Question.is_active == is_active)

        total = query.order_by(None).count()
        questions = query.order_by(
            Question.created_at.desc(),
            Question.id.desc(),
        ).offset((page - 1) * per_page).limit(per_page).all()
        return total, questions

    @staticmethod
    def find_by_id(question_id: int):

        return db.session.get(
            Question,
            question_id
        )

    @staticmethod
    def get_by_ids(question_ids):
        if not question_ids:
            return []
        return Question.query.options(
            selectinload(Question.options)
        ).filter(Question.id.in_(question_ids)).all()

    @staticmethod
    def get_by_topic_id(topic_id: int):

        return Question.query.filter_by(
            topic_id=topic_id,
            is_active=True
        ).order_by(
            Question.id.desc()
        ).all()

    @staticmethod
    def get_pyq(
        subject_id=None,
        topic_id=None,
        exam_year=None
    ):

        query = Question.query.filter_by(
            is_pyq=True,
            is_active=True
        )

        if subject_id is not None:
            query = query.filter_by(
                subject_id=subject_id
            )

        if topic_id is not None:
            query = query.filter_by(
                topic_id=topic_id
            )

        if exam_year is not None:
            query = query.filter_by(
                exam_year=exam_year
            )

        return query.order_by(
            Question.exam_year.desc(),
            Question.id.desc()
        ).all()

    @staticmethod
    def create(
        subject_id: int,
        topic_id: int,
        data: dict
    ):

        options = data.pop("options")

        question = Question(
            subject_id=subject_id,
            topic_id=topic_id,
            **data
        )

        try:
            db.session.add(question)
            db.session.flush()

            for option in options:
                question_option = QuestionOption(
                    question_id=question.id,
                    option_label=option["option_label"],
                    option_text=option["option_text"]
                )
                db.session.add(question_option)

            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return question

    @staticmethod
    def update(
        question,
        data: dict
    ):

        options = data.pop(
            "options",
            None
        )

        try:
            for key, value in data.items():
                setattr(question, key, value)

            if options is not None:
                QuestionOption.query.filter_by(
                    question_id=question.id
                ).delete()

                for option in options:
                    question_option = QuestionOption(
                        question_id=question.id,
                        option_label=option["option_label"],
                        option_text=option["option_text"]
                    )
                    db.session.add(question_option)

            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return question

    @staticmethod
    def delete(question):
        try:
            db.session.delete(question)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def has_test_references(question_id):
        return (
            TestQuestion.query.filter_by(question_id=question_id).first() is not None
            or TestAnswer.query.filter_by(question_id=question_id).first() is not None
        )
