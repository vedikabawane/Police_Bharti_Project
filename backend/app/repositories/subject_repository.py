from sqlalchemy import or_

from app.extensions import db
from app.models.handwritten_note_model import HandwrittenNote
from app.models.note_model import Note
from app.models.question_model import Question
from app.models.subject_model import Subject
from app.models.study_material_model import StudyMaterial
from app.models.test_model import Test
from app.models.topic_model import Topic
from app.models.video_model import Video


class SubjectRepository:

    @staticmethod
    def get_all():
        return Subject.query.order_by(
            Subject.id.asc()
        ).all()

    @staticmethod
    def get_admin_subjects(search: str, is_active, page: int, per_page: int):
        query = Subject.query

        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Subject.name.ilike(pattern),
                    Subject.description.ilike(pattern),
                )
            )

        if is_active is not None:
            query = query.filter(Subject.is_active == is_active)

        total = query.order_by(None).count()
        subjects = query.order_by(
            Subject.id.desc(),
        ).offset((page - 1) * per_page).limit(per_page).all()
        return total, subjects

    @staticmethod
    def find_by_id(subject_id: int):
        return db.session.get(
            Subject,
            subject_id
        )

    @staticmethod
    def find_by_name(name: str):
        return Subject.query.filter_by(
            name=name
        ).first()

    @staticmethod
    def create(name: str, description=None):

        subject = Subject(
            name=name,
            description=description
        )

        db.session.add(subject)
        db.session.commit()

        return subject

    @staticmethod
    def update(subject, data: dict):

        for key, value in data.items():
            setattr(subject, key, value)

        db.session.commit()

        return subject

    @staticmethod
    def delete(subject):
        try:
            db.session.delete(subject)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def has_dependents(subject_id):
        return any((
            Topic.query.filter_by(subject_id=subject_id).first(),
            Question.query.filter_by(subject_id=subject_id).first(),
            Test.query.filter_by(subject_id=subject_id).first(),
            StudyMaterial.query.filter_by(subject_id=subject_id).first(),
            Video.query.filter_by(subject_id=subject_id).first(),
            Note.query.filter_by(subject_id=subject_id).first(),
            HandwrittenNote.query.filter_by(subject_id=subject_id).first(),
        ))
