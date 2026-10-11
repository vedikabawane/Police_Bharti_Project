import unittest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
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


class AdminDashboardAccessTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()

        cls.app.config.update(TESTING=True)
        cls.client = cls.app.test_client()
        with cls.app.app_context():
            db.create_all()

    def setUp(self):
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.drop_all()
        db.create_all()
        db.session.add_all([
            User(
                id=1,
                name="Student",
                email="student@example.test",
                password_hash="test-hash",
                role="student",
                is_active=True,
                created_at=datetime(2026, 10, 1, 10),
            ),
            User(
                id=2,
                name="Administrator",
                email="admin@example.test",
                password_hash="test-hash",
                role="admin",
                is_active=True,
                created_at=datetime(2026, 9, 1, 10),
            ),
            User(
                id=3,
                name="Inactive Administrator",
                email="inactive-admin@example.test",
                password_hash="test-hash",
                role="admin",
                is_active=False,
                created_at=datetime(2026, 9, 1, 10),
            ),
        ])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    @staticmethod
    def _headers(user_id, expires_delta=None):
        token = create_access_token(
            identity=str(user_id),
            expires_delta=expires_delta,
        )
        return {"Authorization": f"Bearer {token}"}

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.get("/api/admin/dashboard")

        self.assertEqual(response.status_code, 401)

    def test_student_cannot_access_admin_dashboard_api(self):
        response = self.client.get(
            "/api/admin/dashboard",
            headers=self._headers(1),
        )

        self.assertEqual(response.status_code, 403)

    def test_active_admin_can_access_dashboard_and_receives_real_identity(self):
        response = self.client.get(
            "/api/admin/dashboard",
            headers=self._headers(2),
        )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["data"]["admin"]["id"], 2)
        self.assertEqual(payload["data"]["admin"]["name"], "Administrator")
        self.assertEqual(payload["data"]["admin"]["email"], "admin@example.test")
        self.assertEqual(payload["data"]["admin"]["role"], "admin")
        self.assertEqual(payload["data"]["students"]["total"], 1)
        self.assertEqual(payload["data"]["students"]["active"], 1)
        self.assertEqual(payload["data"]["students"]["inactive"], 0)
        self.assertEqual(payload["data"]["content"]["subjects"], 0)
        self.assertEqual(payload["data"]["tests"]["total"], 0)
        self.assertEqual(payload["data"]["tests"]["attempts"], 0)
        self.assertEqual(payload["data"]["physical"]["training_records"], 0)
        self.assertEqual(payload["data"]["ai"]["chat_sessions"], 0)
        self.assertEqual(payload["data"]["ai"]["chat_messages"], 0)
        self.assertNotIn("password_hash", str(payload))

    def test_inactive_admin_cannot_access_dashboard(self):
        response = self.client.get(
            "/api/admin/dashboard",
            headers=self._headers(3),
        )

        self.assertEqual(response.status_code, 403)

    def test_expired_jwt_is_rejected_by_existing_authentication(self):
        response = self.client.get(
            "/api/admin/dashboard",
            headers=self._headers(2, expires_delta=timedelta(seconds=-1)),
        )

        self.assertEqual(response.status_code, 401)

    def test_dashboard_counts_existing_content_tests_physical_and_ai_data(self):
        student = db.session.get(User, 1)
        subject = Subject(id=1, name="Mathematics", is_active=True)
        db.session.add(subject)
        db.session.flush()
        topic = Topic(
            id=1,
            subject_id=subject.id,
            name="Arithmetic",
            is_active=True,
        )
        db.session.add(topic)
        db.session.flush()
        db.session.add_all([
            Note(
                id=1,
                subject_id=subject.id,
                topic_id=topic.id,
                title="Basic notes",
                content="Arithmetic fundamentals.",
                is_active=True,
            ),
            HandwrittenNote(
                id=1,
                subject_id=subject.id,
                topic_id=topic.id,
                title="Formula sheet",
                file_url="/uploads/formulas.pdf",
                is_active=True,
            ),
            Video(
                id=1,
                subject_id=subject.id,
                topic_id=topic.id,
                title="Arithmetic lesson",
                video_url="https://example.test/video",
                is_active=True,
            ),
            Question(
                id=1,
                subject_id=subject.id,
                topic_id=topic.id,
                question_text="What is 2 + 2?",
                correct_option="A",
                is_pyq=False,
            ),
            Question(
                id=2,
                subject_id=subject.id,
                topic_id=topic.id,
                question_text="What is 3 + 3?",
                correct_option="A",
                is_pyq=True,
            ),
        ])
        test = Test(
            id=1,
            title="Arithmetic test",
            test_type="subject",
            subject_id=subject.id,
            topic_id=topic.id,
            is_active=True,
        )
        db.session.add(test)
        db.session.flush()
        db.session.add_all([
            TestAttempt(
                id=1,
                test_id=test.id,
                student_id=student.id,
                started_at=datetime(2026, 10, 2, 10),
                submitted_at=datetime(2026, 10, 2, 10, 30),
                score=Decimal("4.5"),
                percentage=Decimal("75"),
                status="submitted",
            ),
            TestAttempt(
                id=2,
                test_id=test.id,
                student_id=student.id,
                started_at=datetime(2026, 10, 3, 10),
                status="in_progress",
            ),
            PhysicalTraining(
                id=1,
                user_id=student.id,
                date=datetime(2026, 10, 2).date(),
            ),
        ])
        session = AIChatSession(user_id=student.id, session_id="student-chat")
        db.session.add(session)
        db.session.flush()
        db.session.add(AIChatMessage(
            chat_session_id=session.id,
            role="user",
            message="Private chat text must not be exposed.",
        ))
        db.session.commit()

        response = self.client.get(
            "/api/admin/dashboard",
            headers=self._headers(2),
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["content"]["subjects"], 1)
        self.assertEqual(data["content"]["topics"], 1)
        self.assertEqual(data["content"]["notes"], 1)
        self.assertEqual(data["content"]["handwritten_notes"], 1)
        self.assertEqual(data["content"]["study_materials"], 2)
        self.assertEqual(data["content"]["videos"], 1)
        self.assertEqual(data["content"]["questions"], 2)
        self.assertEqual(data["content"]["pyq"], 1)
        self.assertEqual(data["tests"]["total"], 1)
        self.assertEqual(data["tests"]["active"], 1)
        self.assertEqual(data["tests"]["inactive"], 0)
        self.assertEqual(data["tests"]["attempts"], 2)
        self.assertEqual(data["tests"]["completed_attempts"], 1)
        self.assertEqual(data["physical"]["training_records"], 1)
        self.assertEqual(data["ai"]["chat_sessions"], 1)
        self.assertEqual(data["ai"]["chat_messages"], 1)
        self.assertNotIn("Private chat text", str(data))
        self.assertNotIn("password_hash", str(data))

    def test_dashboard_recent_lists_are_limited_and_return_safe_fields(self):
        students = [
            User(
                id=100 + index,
                name=f"Student {index}",
                email=f"student{index}@example.test",
                password_hash="never-return-this",
                role="student",
                is_active=index % 2 == 0,
                created_at=datetime(2026, 10, 1, 10) + timedelta(minutes=index),
            )
            for index in range(2, 14)
        ]
        db.session.add_all(students)
        db.session.flush()
        attempts = []
        for index, student in enumerate(students, start=1):
            test = Test(
                id=index,
                title=f"Test {index}",
                test_type="mock",
                is_active=True,
            )
            db.session.add(test)
            db.session.flush()
            attempts.append(TestAttempt(
                id=index,
                test_id=test.id,
                student_id=student.id,
                started_at=datetime(2026, 10, 2, 10) + timedelta(minutes=index),
                status="submitted" if index % 2 else "in_progress",
            ))
        db.session.add_all(attempts)
        db.session.commit()

        response = self.client.get(
            "/api/admin/dashboard",
            headers=self._headers(2),
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(len(data["students"]["recent"]), 10)
        self.assertEqual(len(data["recent_activity"]["students"]), 10)
        self.assertEqual(len(data["recent_activity"]["test_attempts"]), 10)
        self.assertEqual(data["students"]["total"], 13)
        self.assertEqual(data["students"]["active"], 7)
        self.assertEqual(data["students"]["inactive"], 6)
        self.assertEqual(data["tests"]["attempts"], 12)
        self.assertEqual(data["tests"]["completed_attempts"], 6)
        self.assertNotIn("password_hash", str(data))
        self.assertNotIn("never-return-this", str(data))
        self.assertNotIn("mobile", data["students"]["recent"][0])


if __name__ == "__main__":
    unittest.main()
