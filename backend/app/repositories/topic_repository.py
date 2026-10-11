from app.extensions import db
from app.models.handwritten_note_model import HandwrittenNote
from app.models.note_model import Note
from app.models.question_model import Question
from app.models.study_material_model import StudyMaterial
from app.models.test_model import Test
from app.models.topic_model import Topic
from app.models.video_model import Video
from app.models.subject_model import Subject
from sqlalchemy import or_
from sqlalchemy.orm import contains_eager


class TopicRepository:

    @staticmethod
    def get_admin_topics(search: str, subject_id, is_active, page: int, per_page: int):
        query = Topic.query.join(Subject, Topic.subject_id == Subject.id).options(
            contains_eager(Topic.subject)
        )
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(Topic.name.ilike(pattern), Topic.description.ilike(pattern)))
        if subject_id is not None:
            query = query.filter(Topic.subject_id == subject_id)
        if is_active is not None:
            query = query.filter(Topic.is_active == is_active)
        total = query.order_by(None).count()
        topics = query.order_by(Topic.id.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return total, topics

    @staticmethod
    def get_by_subject_id(subject_id: int):

        return Topic.query.filter_by(
            subject_id=subject_id
        ).order_by(
            Topic.id.asc()
        ).all()

    @staticmethod
    def find_by_id(topic_id: int):

        return db.session.get(
            Topic,
            topic_id
        )

    @staticmethod
    def find_by_name(subject_id: int, name: str):

        return Topic.query.filter_by(
            subject_id=subject_id,
            name=name
        ).first()

    @staticmethod
    def create(
        subject_id: int,
        name: str,
        description=None,
        is_active=True
    ):

        topic = Topic(
            subject_id=subject_id,
            name=name,
            description=description,
            is_active=is_active
        )

        db.session.add(topic)
        db.session.commit()

        return topic

    @staticmethod
    def update(topic, data: dict):

        for key, value in data.items():
            setattr(topic, key, value)

        db.session.commit()

        return topic

    @staticmethod
    def delete(topic):
        try:
            db.session.delete(topic)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def has_dependents(topic_id):
        return any((
            Question.query.filter_by(topic_id=topic_id).first(),
            Test.query.filter_by(topic_id=topic_id).first(),
            StudyMaterial.query.filter_by(topic_id=topic_id).first(),
            Video.query.filter_by(topic_id=topic_id).first(),
            Note.query.filter_by(topic_id=topic_id).first(),
            HandwrittenNote.query.filter_by(topic_id=topic_id).first(),
        ))
