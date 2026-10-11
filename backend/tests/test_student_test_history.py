import unittest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import Subject, Test, TestAttempt, Topic, User


class StudentTestHistoryTest(unittest.TestCase):
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
            User(id=1, name="Student One", email="one@test", password_hash="secret",
                 role="student", is_active=True),
            User(id=2, name="Student Two", email="two@test", password_hash="secret",
                 role="student", is_active=True),
            User(id=3, name="Admin", email="admin@test", password_hash="secret",
                 role="admin", is_active=True),
            Subject(id=1, name="Marathi"),
            Subject(id=2, name="Mathematics"),
            Topic(id=1, subject_id=1, name="Grammar"),
            Topic(id=2, subject_id=2, name="Arithmetic"),
            Test(
                id=1, title="Marathi Grammar Practice", test_type="topic",
                subject_id=1, topic_id=1, duration_minutes=30,
                total_questions=4, total_marks=10, is_active=True,
            ),
            Test(
                id=2, title="Mathematics Mock", test_type="full_mock",
                subject_id=2, topic_id=2, duration_minutes=60,
                total_questions=15, total_marks=20, is_active=True,
            ),
        ])
        db.session.flush()
        self._add_attempt(
            10, 1, 1, datetime(2026, 1, 1, 10), "4", "40", 2, 1, 1, 300
        )
        self._add_attempt(
            11, 1, 1, datetime(2026, 1, 2, 10), "8", "80", 4, 0, 0, 500
        )
        self._add_attempt(
            12, 1, 2, datetime(2026, 1, 3, 10), "15", "75", 15, 0, 0, 1200
        )
        self._add_attempt(
            13, 1, 1, datetime(2026, 1, 4, 10), "100", "100", 0, 0, 0, 0,
            status="in_progress", submitted=False,
        )
        self._add_attempt(
            14, 2, 1, datetime(2026, 1, 5, 10), "10", "100", 4, 0, 0, 200
        )
        db.session.commit()

    def _add_attempt(
        self, attempt_id, student_id, test_id, completed_at, score, percentage,
        correct, wrong, skipped, time_taken, status="submitted", submitted=True,
    ):
        db.session.add(TestAttempt(
            id=attempt_id,
            student_id=student_id,
            test_id=test_id,
            started_at=completed_at - timedelta(minutes=10),
            submitted_at=completed_at if submitted else None,
            score=Decimal(score),
            percentage=Decimal(percentage),
            accuracy=Decimal("66.67") if wrong else Decimal("100"),
            correct_answers=correct,
            wrong_answers=wrong,
            skipped_answers=skipped,
            time_taken_seconds=time_taken,
            status=status,
        ))

    @staticmethod
    def _headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_returns_only_owned_submitted_attempts_newest_first_and_safe_fields(self):
        response = self.client.get(
            "/api/student/tests/history?student_id=2",
            headers=self._headers(1),
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["pagination"]["total"], 3)
        history = data["history"]
        self.assertEqual([item["attempt_id"] for item in history], [12, 11, 10])
        self.assertNotIn(14, [item["attempt_id"] for item in history])
        self.assertNotIn(13, [item["attempt_id"] for item in history])
        latest_same_test = history[1]
        self.assertEqual(latest_same_test["test_title"], "Marathi Grammar Practice")
        self.assertEqual(latest_same_test["subject_name"], "Marathi")
        self.assertEqual(latest_same_test["topic_name"], "Grammar")
        self.assertEqual(latest_same_test["score"], 8)
        self.assertEqual(latest_same_test["total_marks"], 10)
        self.assertEqual(latest_same_test["percentage"], 80)
        self.assertEqual(latest_same_test["correct"], 4)
        self.assertEqual(latest_same_test["attempted"], 4)
        self.assertEqual(latest_same_test["rank"], 2)
        self.assertEqual(latest_same_test["previous_percentage"], 40)
        self.assertEqual(latest_same_test["improvement_percentage_points"], 40)
        self.assertTrue(latest_same_test["completed_at"].startswith("2026-01-02"))
        for forbidden in ("student_id", "answers", "correct_option", "explanation"):
            self.assertNotIn(forbidden, latest_same_test)

    def test_query_filters_search_and_pagination(self):
        search = self.client.get(
            "/api/student/tests/history?search=Marathi", headers=self._headers(1)
        ).get_json()["data"]
        self.assertEqual(search["pagination"]["total"], 2)

        test_type = self.client.get(
            "/api/student/tests/history?type=TOPIC", headers=self._headers(1)
        ).get_json()["data"]
        self.assertEqual([item["attempt_id"] for item in test_type["history"]], [11, 10])

        subject = self.client.get(
            "/api/student/tests/history?subject_id=2", headers=self._headers(1)
        ).get_json()["data"]
        self.assertEqual([item["attempt_id"] for item in subject["history"]], [12])

        topic = self.client.get(
            "/api/student/tests/history?topic_id=1", headers=self._headers(1)
        ).get_json()["data"]
        self.assertEqual(topic["pagination"]["total"], 2)

        first_page = self.client.get(
            "/api/student/tests/history?page=1&per_page=1", headers=self._headers(1)
        ).get_json()["data"]
        second_page = self.client.get(
            "/api/student/tests/history?page=2&per_page=1", headers=self._headers(1)
        ).get_json()["data"]
        self.assertEqual(first_page["history"][0]["attempt_id"], 12)
        self.assertEqual(second_page["history"][0]["attempt_id"], 11)
        self.assertEqual(first_page["pagination"], {
            "page": 1, "per_page": 1, "total": 3, "pages": 3,
        })

    def test_student_isolation_authentication_and_role_are_enforced(self):
        own_history = self.client.get(
            "/api/student/tests/history", headers=self._headers(2)
        )
        self.assertEqual(own_history.status_code, 200)
        self.assertEqual(
            [item["attempt_id"] for item in own_history.get_json()["data"]["history"]],
            [14],
        )
        self.assertEqual(self.client.get("/api/student/tests/history").status_code, 401)
        self.assertEqual(self.client.get(
            "/api/student/tests/history", headers=self._headers(3)
        ).status_code, 403)

    def test_invalid_filters_and_page_sizes_are_rejected(self):
        for query in (
            "type=not_a_test_type",
            "subject_id=0",
            "topic_id=invalid",
            "per_page=101",
        ):
            with self.subTest(query=query):
                response = self.client.get(
                    f"/api/student/tests/history?{query}", headers=self._headers(1)
                )
                self.assertEqual(response.status_code, 400)


if __name__ == "__main__":
    unittest.main()
