from sqlalchemy import and_, func, or_
from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models.question_model import Question
from app.models.subject_model import Subject
from app.models.test_answer_model import TestAnswer
from app.models.test_attempt_model import TestAttempt
from app.models.test_model import Test
from app.models.test_question_model import TestQuestion
from app.models.topic_model import Topic
from app.repositories.physical_training_repository import (
    PhysicalTrainingRepository
)


class StudentPerformanceRepository:

    @staticmethod
    def get_attempt_rank(attempt: TestAttempt):
        """Return ordinal rank within this test, without loading student data."""
        completion_time = func.coalesce(
            TestAttempt.submitted_at, TestAttempt.started_at
        )
        current_time = attempt.submitted_at or attempt.started_at
        ahead = TestAttempt.query.filter(
            TestAttempt.test_id == attempt.test_id,
            TestAttempt.status == "submitted",
            or_(
                TestAttempt.score > attempt.score,
                and_(
                    TestAttempt.score == attempt.score,
                    or_(
                        completion_time < current_time,
                        and_(completion_time == current_time, TestAttempt.id < attempt.id),
                    ),
                ),
            ),
        ).count()
        return ahead + 1

    @staticmethod
    def get_previous_submitted_attempt(attempt: TestAttempt):
        """Find this student's immediately preceding completed attempt for the test."""
        completion_time = func.coalesce(
            TestAttempt.submitted_at, TestAttempt.started_at
        )
        current_time = attempt.submitted_at or attempt.started_at
        return TestAttempt.query.filter(
            TestAttempt.test_id == attempt.test_id,
            TestAttempt.student_id == attempt.student_id,
            TestAttempt.status == "submitted",
            TestAttempt.id != attempt.id,
            or_(
                completion_time < current_time,
                and_(completion_time == current_time, TestAttempt.id < attempt.id),
            ),
        ).order_by(
            completion_time.desc(), TestAttempt.id.desc()
        ).first()

    @staticmethod
    def get_attempt_topic_answer_rows(attempt: TestAttempt):
        """Return all questions in the attempt with their saved answer, if any."""
        return db.session.query(
            Question, Topic, TestAnswer
        ).select_from(
            TestQuestion
        ).join(
            Question, Question.id == TestQuestion.question_id
        ).join(
            Topic, Topic.id == Question.topic_id
        ).outerjoin(
            TestAnswer,
            and_(
                TestAnswer.attempt_id == attempt.id,
                TestAnswer.question_id == Question.id,
            ),
        ).filter(
            TestQuestion.test_id == attempt.test_id
        ).order_by(
            Topic.id.asc(), Question.id.asc()
        ).all()

    @staticmethod
    def get_attempts(student_id: int):
        return TestAttempt.query.options(
            joinedload(TestAttempt.test)
        ).filter(
            TestAttempt.student_id == student_id
        ).order_by(
            TestAttempt.started_at.asc(),
            TestAttempt.id.asc()
        ).all()

    @staticmethod
    def get_submitted_answer_rows(student_id: int):
        return db.session.query(
            TestAttempt,
            TestAnswer,
            Question,
            Subject,
            Topic
        ).join(
            TestAnswer,
            TestAnswer.attempt_id == TestAttempt.id
        ).join(
            Question,
            Question.id == TestAnswer.question_id
        ).join(
            Subject,
            Subject.id == Question.subject_id
        ).join(
            Topic,
            Topic.id == Question.topic_id
        ).filter(
            TestAttempt.student_id == student_id,
            TestAttempt.status == "submitted"
        ).order_by(
            TestAttempt.submitted_at.asc(),
            TestAttempt.id.asc(),
            TestAnswer.id.asc()
        ).all()

    @staticmethod
    def get_subjects():
        return Subject.query.order_by(Subject.id.asc()).all()

    @staticmethod
    def get_topics():
        return Topic.query.options(
            joinedload(Topic.subject)
        ).order_by(Topic.id.asc()).all()

    @staticmethod
    def get_physical_records(student_id: int):
        return PhysicalTrainingRepository.get_student_records(student_id)


__all__ = ["StudentPerformanceRepository"]
