from app.extensions import db
from app.models.handwritten_note_model import HandwrittenNote


class HandwrittenNoteRepository:

    @staticmethod
    def get_by_topic_id(topic_id: int):

        return HandwrittenNote.query.filter_by(
            topic_id=topic_id
        ).order_by(
            HandwrittenNote.id.desc()
        ).all()

    @staticmethod
    def find_by_id(note_id: int):

        return db.session.get(
            HandwrittenNote,
            note_id
        )

    @staticmethod
    def create(
        subject_id: int,
        topic_id: int,
        data: dict
    ):

        note = HandwrittenNote(
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