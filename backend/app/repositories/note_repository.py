from app.extensions import db
from app.models.note_model import Note
from app.models.subject_model import Subject
from app.models.topic_model import Topic
from sqlalchemy import or_
from sqlalchemy.orm import contains_eager


class NoteRepository:

    @staticmethod
    def get_admin_notes(search: str, subject_id, topic_id, is_active, page: int, per_page: int):
        query = Note.query.join(Subject, Note.subject_id == Subject.id).join(
            Topic, Note.topic_id == Topic.id
        ).options(
            contains_eager(Note.subject), contains_eager(Note.topic)
        )
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(Note.title.ilike(pattern), Note.content.ilike(pattern)))
        if subject_id is not None:
            query = query.filter(Note.subject_id == subject_id)
        if topic_id is not None:
            query = query.filter(Note.topic_id == topic_id)
        if is_active is not None:
            query = query.filter(Note.is_active == is_active)

        total = query.order_by(None).count()
        notes = query.order_by(Note.id.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return total, notes

    @staticmethod
    def get_by_topic_id(topic_id: int):

        return Note.query.filter_by(
            topic_id=topic_id
        ).order_by(
            Note.id.desc()
        ).all()

    @staticmethod
    def find_by_id(note_id: int):

        return db.session.get(
            Note,
            note_id
        )

    @staticmethod
    def create(
        subject_id: int,
        topic_id: int,
        data: dict
    ):

        note = Note(
            subject_id=subject_id,
            topic_id=topic_id,
            **data
        )

        db.session.add(note)
        db.session.commit()

        return note

    @staticmethod
    def update(note, data: dict):

        for key, value in data.items():
            setattr(note, key, value)

        db.session.commit()

        return note

    @staticmethod
    def delete(note):

        db.session.delete(note)
        db.session.commit()
