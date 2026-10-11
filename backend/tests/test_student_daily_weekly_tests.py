import unittest
from decimal import Decimal
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import (
    Question,
    QuestionOption,
    Subject,
    Test,
    TestAnswer,
    TestAttempt,
    TestQuestion,
    Topic,
    User,
)
from app.repositories.test_repository import TestRepository


class StudentDailyWeeklyTestsTest(unittest.TestCase):
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
            User(id=1, name="Student", email="student@test", password_hash="secret",
                 role="student", is_active=True),
            User(id=2, name="Admin", email="admin@test", password_hash="secret",
                 role="admin", is_active=True),
            Subject(id=1, name="Marathi"),
            Topic(id=1, subject_id=1, name="Grammar"),
            Question(
                id=1, subject_id=1, topic_id=1, question_text="Question",
                correct_option="A", difficulty="easy", marks=Decimal("1"),
                is_active=True,
            ),
        ])
        for option_id, label in enumerate(("A", "B", "C", "D"), start=1):
            db.session.add(QuestionOption(
                id=option_id, question_id=1, option_label=label,
                option_text=f"Option {label}",
            ))

        tests = [
            (1, "Daily Marathi", "daily", True),
            (2, "Weekly Marathi", "weekly", True),
            (3, "Full Mock", "full_mock", True),
            (4, "Inactive Daily", "daily", False),
            (5, "Inactive Weekly", "weekly", False),
        ]
        for test_id, title, test_type, is_active in tests:
            db.session.add(Test(
                id=test_id,
                title=title,
                test_type=test_type,
                subject_id=1,
                topic_id=1,
                duration_minutes=20,
                total_questions=1,
                total_marks=1,
                is_active=is_active,
            ))
            db.session.add(TestQuestion(
                id=test_id, test_id=test_id, question_id=1, question_order=1,
            ))
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    @staticmethod
    def _headers(user_id=1):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    @staticmethod
    def _create_attempt_for_sqlite(test_id, student_id):
        attempt_id = (db.session.query(db.func.max(TestAttempt.id)).scalar() or 0) + 1
        attempt = TestAttempt(
            id=attempt_id,
            test_id=test_id,
            student_id=student_id,
        )
        db.session.add(attempt)
        db.session.commit()
        return attempt

    @staticmethod
    def _create_answer_for_sqlite(**values):
        answer_id = (db.session.query(db.func.max(TestAnswer.id)).scalar() or 0) + 1
        answer = TestAnswer(id=answer_id, **values)
        db.session.add(answer)
        return answer

    def test_active_daily_and_weekly_tests_are_listed_with_their_types(self):
        response = self.client.get(
            "/api/student/tests?per_page=20", headers=self._headers()
        )
        self.assertEqual(response.status_code, 200)
        tests = response.get_json()["data"]["tests"]
        by_id = {test["id"]: test for test in tests}
        self.assertEqual(by_id[1]["test_type"], "daily")
        self.assertEqual(by_id[2]["test_type"], "weekly")
        self.assertEqual(by_id[1]["title"], "Daily Marathi")
        self.assertEqual(by_id[2]["title"], "Weekly Marathi")
        self.assertNotIn(4, by_id)
        self.assertNotIn(5, by_id)

        daily_detail = self.client.get(
            "/api/student/tests/1", headers=self._headers()
        )
        weekly_detail = self.client.get(
            "/api/student/tests/2", headers=self._headers()
        )
        self.assertEqual(daily_detail.get_json()["data"]["test_type"], "daily")
        self.assertEqual(weekly_detail.get_json()["data"]["test_type"], "weekly")
        self.assertNotIn("questions", daily_detail.get_json()["data"])

    def test_inactive_daily_and_weekly_tests_cannot_start(self):
        for test_id in (4, 5):
            with self.subTest(test_id=test_id):
                response = self.client.post(
                    f"/api/tests/{test_id}/start", headers=self._headers()
                )
                self.assertEqual(response.status_code, 409)
        self.assertEqual(TestAttempt.query.count(), 0)

    def test_daily_weekly_start_result_and_history_use_existing_flows(self):
        with patch.object(
            TestRepository, "create_attempt", side_effect=self._create_attempt_for_sqlite
        ):
            daily_start = self.client.post(
                "/api/tests/1/start", headers=self._headers()
            )
            weekly_start = self.client.post(
                "/api/tests/2/start", headers=self._headers()
            )
            mock_start = self.client.post(
                "/api/tests/3/start", headers=self._headers()
            )
        self.assertEqual(daily_start.status_code, 201)
        self.assertEqual(weekly_start.status_code, 201)
        self.assertEqual(mock_start.status_code, 201)

        attempt_ids = [
            daily_start.get_json()["data"]["id"],
            weekly_start.get_json()["data"]["id"],
        ]
        with patch.object(
            TestRepository, "create_answer", side_effect=self._create_answer_for_sqlite
        ):
            for attempt_id in attempt_ids:
                submitted = self.client.post(
                    f"/api/tests/attempts/{attempt_id}/submit",
                    headers=self._headers(),
                )
                self.assertEqual(submitted.status_code, 200)
                result = self.client.get(
                    f"/api/tests/attempts/{attempt_id}/result",
                    headers=self._headers(),
                )
                self.assertEqual(result.status_code, 200)
                self.assertEqual(result.get_json()["data"]["status"], "submitted")

        history = self.client.get(
            "/api/student/tests/history", headers=self._headers()
        )
        self.assertEqual(history.status_code, 200)
        history_types = {
            item["test_type"] for item in history.get_json()["data"]["history"]
        }
        self.assertEqual(history_types, {"daily", "weekly"})


if __name__ == "__main__":
    unittest.main()
