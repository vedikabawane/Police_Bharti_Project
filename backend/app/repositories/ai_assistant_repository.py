from datetime import datetime

from sqlalchemy import or_
from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models.ai_chat_message_model import AIChatMessage
from app.models.ai_chat_session_model import AIChatSession
from app.models.note_model import Note
from app.models.question_model import Question
from app.models.student_profile_model import StudentProfile
from app.models.subject_model import Subject
from app.models.topic_model import Topic


class AIAssistantRepository:

    @staticmethod
    def find_student_profile(user_id: int):
        return StudentProfile.query.filter_by(user_id=user_id).first()

    @staticmethod
    def search_study_notes(search_terms, limit=8):
        if not search_terms:
            return []

        matches = []
        for term in search_terms:
            pattern = f"%{term}%"
            matches.extend((
                Note.title.ilike(pattern),
                Note.content.ilike(pattern),
                Topic.name.ilike(pattern),
                Subject.name.ilike(pattern)
            ))

        notes = Note.query.join(
            Topic,
            Topic.id == Note.topic_id
        ).join(
            Subject,
            Subject.id == Note.subject_id
        ).options(
            joinedload(Note.topic),
            joinedload(Note.subject)
        ).filter(
            Note.is_active.is_(True),
            or_(*matches)
        ).order_by(
            Note.id.desc()
        ).limit(limit).all()
        search_text = " ".join(search_terms).casefold()
        return sorted(
            notes,
            key=lambda note: sum(
                term in " ".join((
                    note.title or "",
                    note.content or "",
                    note.topic.name if note.topic else "",
                    note.subject.name if note.subject else ""
                )).casefold()
                for term in search_text.split()
            ),
            reverse=True
        )

    @staticmethod
    def search_questions(search_terms, limit=5):
        if not search_terms:
            return []

        matches = []
        for term in search_terms:
            pattern = f"%{term}%"
            matches.extend((
                Question.question_text.ilike(pattern),
                Question.explanation.ilike(pattern),
                Topic.name.ilike(pattern),
                Subject.name.ilike(pattern)
            ))

        questions = Question.query.join(
            Topic,
            Topic.id == Question.topic_id
        ).join(
            Subject,
            Subject.id == Question.subject_id
        ).options(
            joinedload(Question.topic),
            joinedload(Question.subject)
        ).filter(
            Question.is_active.is_(True),
            or_(*matches)
        ).order_by(
            Question.id.desc()
        ).limit(limit).all()
        return sorted(
            questions,
            key=lambda question: sum(
                term in " ".join((
                    question.question_text or "",
                    question.explanation or "",
                    question.topic.name if question.topic else "",
                    question.subject.name if question.subject else ""
                )).casefold()
                for term in search_terms
            ),
            reverse=True
        )

    @staticmethod
    def search_subject_topics(search_terms, limit=8):
        if not search_terms:
            return []

        matches = []
        for term in search_terms:
            pattern = f"%{term}%"
            matches.extend((
                Topic.name.ilike(pattern),
                Subject.name.ilike(pattern)
            ))
        return Topic.query.join(
            Subject,
            Subject.id == Topic.subject_id
        ).options(
            joinedload(Topic.subject)
        ).filter(
            or_(*matches)
        ).order_by(
            Topic.id.asc()
        ).limit(limit).all()

    @staticmethod
    def find_session(user_id: int, session_id: str):
        return AIChatSession.query.options(
            joinedload(AIChatSession.messages)
        ).filter_by(
            user_id=user_id,
            session_id=session_id
        ).first()

    @staticmethod
    def get_recent_messages(session, limit=8):
        if session.id is None:
            return []
        messages = AIChatMessage.query.filter_by(
            chat_session_id=session.id
        ).order_by(
            AIChatMessage.created_at.desc(),
            AIChatMessage.id.desc()
        ).limit(limit).all()
        return list(reversed(messages))

    @staticmethod
    def get_sessions(user_id: int, session_id=None):
        query = AIChatSession.query.options(
            joinedload(AIChatSession.messages)
        ).filter_by(user_id=user_id)
        if session_id is not None:
            query = query.filter_by(session_id=session_id)
        return query.order_by(
            AIChatSession.updated_at.desc(),
            AIChatSession.id.desc()
        ).all()

    @staticmethod
    def save_exchange(session, question: str, answer: str):
        try:
            session.updated_at = datetime.utcnow()
            session.messages.extend([
                AIChatMessage(role="user", message=question),
                AIChatMessage(role="assistant", message=answer)
            ])
            db.session.add(session)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return session

    @staticmethod
    def create_session(user_id: int, session_id: str):
        session = AIChatSession(
            user_id=user_id,
            session_id=session_id
        )
        db.session.add(session)
        return session

    @staticmethod
    def delete_sessions(user_id: int, session_id=None):
        sessions = AIAssistantRepository.get_sessions(
            user_id=user_id,
            session_id=session_id
        )
        if session_id is not None and not sessions:
            return None

        try:
            for session in sessions:
                db.session.delete(session)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return len(sessions)


__all__ = ["AIAssistantRepository"]
