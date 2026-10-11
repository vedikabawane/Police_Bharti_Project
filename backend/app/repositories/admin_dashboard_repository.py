from datetime import datetime

from sqlalchemy import func

from app.extensions import db
from app.models import (
    AIChatMessage,
    AIChatSession,
    HandwrittenNote,
    Note,
    PhysicalTraining,
    Question,
    Subject,
    Test,
    TestAttempt,
    Topic,
    User,
    Video,
)


class AdminDashboardRepository:

    @staticmethod
    def get_counts(recent_since: datetime):
        def count_query(model, *criteria):
            query = db.session.query(func.count(model.id))
            if criteria:
                query = query.filter(*criteria)
            return query.scalar_subquery()

        notes_count = count_query(Note)
        handwritten_notes_count = count_query(HandwrittenNote)
        study_material_count = notes_count + handwritten_notes_count
        student_attempts = db.session.query(
            func.count(TestAttempt.id)
        ).join(
            User,
            User.id == TestAttempt.student_id
        ).filter(
            User.role == "student"
        ).scalar_subquery()
        completed_student_attempts = db.session.query(
            func.count(TestAttempt.id)
        ).join(
            User,
            User.id == TestAttempt.student_id
        ).filter(
            User.role == "student",
            TestAttempt.status == "submitted"
        ).scalar_subquery()
        student_training_records = db.session.query(
            func.count(PhysicalTraining.id)
        ).join(
            User,
            User.id == PhysicalTraining.user_id
        ).filter(
            User.role == "student"
        ).scalar_subquery()
        ai_student_sessions = db.session.query(
            func.count(AIChatSession.id)
        ).join(
            User,
            User.id == AIChatSession.user_id
        ).filter(
            User.role == "student"
        ).scalar_subquery()
        ai_student_messages = db.session.query(
            func.count(AIChatMessage.id)
        ).join(
            AIChatSession,
            AIChatSession.id == AIChatMessage.chat_session_id
        ).join(
            User,
            User.id == AIChatSession.user_id
        ).filter(
            User.role == "student"
        ).scalar_subquery()

        row = db.session.query(
            count_query(User, User.role == "student").label("students_total"),
            count_query(
                User,
                User.role == "student",
                User.is_active.is_(True)
            ).label("students_active"),
            count_query(
                User,
                User.role == "student",
                User.is_active.is_(False)
            ).label("students_inactive"),
            count_query(
                User,
                User.role == "student",
                User.created_at >= recent_since
            ).label("students_recent"),
            count_query(Subject).label("subjects"),
            count_query(Topic).label("topics"),
            study_material_count.label("study_materials"),
            notes_count.label("notes"),
            handwritten_notes_count.label("handwritten_notes"),
            count_query(Video).label("videos"),
            count_query(Question).label("questions"),
            count_query(Question, Question.is_pyq.is_(True)).label("pyq"),
            count_query(Test).label("tests_total"),
            count_query(Test, Test.is_active.is_(True)).label("tests_active"),
            count_query(Test, Test.is_active.is_(False)).label("tests_inactive"),
            student_attempts.label("attempts_total"),
            completed_student_attempts.label("attempts_completed"),
            student_training_records.label("physical_training_records"),
            ai_student_sessions.label("ai_chat_sessions"),
            ai_student_messages.label("ai_chat_messages"),
        ).one()
        return row._asdict()

    @staticmethod
    def get_recent_students(limit=10):
        return User.query.with_entities(
            User.id,
            User.name,
            User.email,
            User.created_at,
            User.is_active
        ).filter(
            User.role == "student"
        ).order_by(
            User.created_at.desc(),
            User.id.desc()
        ).limit(limit).all()

    @staticmethod
    def get_recent_test_attempts(limit=10):
        attempted_at = func.coalesce(
            TestAttempt.submitted_at,
            TestAttempt.started_at
        )
        return db.session.query(
            TestAttempt.id,
            TestAttempt.student_id,
            User.name.label("student_name"),
            TestAttempt.test_id,
            Test.title.label("test_name"),
            TestAttempt.score,
            TestAttempt.percentage,
            attempted_at.label("attempted_at"),
            TestAttempt.submitted_at,
            TestAttempt.status
        ).join(
            User,
            User.id == TestAttempt.student_id
        ).join(
            Test,
            Test.id == TestAttempt.test_id
        ).filter(
            User.role == "student"
        ).order_by(
            attempted_at.desc(),
            TestAttempt.id.desc()
        ).limit(limit).all()


__all__ = ["AdminDashboardRepository"]
