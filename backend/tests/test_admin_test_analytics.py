import unittest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import (
    Question,
    Subject,
    Test,
    TestAnswer,
    TestAttempt,
    TestQuestion,
    Topic,
    User,
)


class AdminTestAnalyticsTest(unittest.TestCase):
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
            User(id=1, name="Active Admin", email="admin@test",
                 password_hash="private-admin-hash", role="admin", is_active=True),
            User(id=2, name="Inactive Admin", email="inactive@test",
                 password_hash="private-inactive-hash", role="admin", is_active=False),
            User(id=3, name="Student One", email="one@test",
                 password_hash="private-student-hash", role="student", is_active=True),
            User(id=4, name="Student Two", email="two@test",
                 password_hash="private-student-hash", role="student", is_active=True),
            Subject(id=1, name="History"),
            Topic(id=1, subject_id=1, name="Ancient"),
            Question(id=1, subject_id=1, topic_id=1, question_text="Question one",
                     correct_option="A", difficulty="easy", marks=2,
                     negative_marks=Decimal("0.50"), is_active=True),
            Question(id=2, subject_id=1, topic_id=1, question_text="Question two",
                     correct_option="B", difficulty="medium", marks=1,
                     negative_marks=Decimal("0.25"), is_active=True),
            Question(id=3, subject_id=1, topic_id=1, question_text="Question three",
                     correct_option="C", difficulty="hard", marks=3,
                     negative_marks=Decimal("1.00"), is_active=True),
            Test(id=10, title="Analytics Test", test_type="mixed", subject_id=1,
                 duration_minutes=30, total_questions=3, total_marks=6,
                 negative_marks=Decimal("0.50"), is_active=True),
            Test(id=11, title="No Attempts Test", test_type="subject", subject_id=1,
                 duration_minutes=20, total_questions=1, total_marks=2,
                 is_active=False),
        ])
        db.session.flush()
        db.session.add_all([
            # Deliberately use a non-ID order to verify the saved test order.
            TestQuestion(id=1, test_id=10, question_id=2, question_order=1),
            TestQuestion(id=2, test_id=10, question_id=1, question_order=2),
            TestQuestion(id=3, test_id=10, question_id=3, question_order=3),
            TestQuestion(id=4, test_id=11, question_id=1, question_order=1),
        ])
        now = datetime.utcnow()
        db.session.add_all([
            TestAttempt(id=101, test_id=10, student_id=3,
                        started_at=now - timedelta(days=4), submitted_at=now,
                        score=Decimal("2.00"), correct_answers=1, wrong_answers=1,
                        skipped_answers=1, percentage=Decimal("33.33"),
                        accuracy=Decimal("50.00"), status="submitted"),
            TestAttempt(id=102, test_id=10, student_id=3,
                        started_at=now - timedelta(days=3), submitted_at=now,
                        score=Decimal("6.00"), correct_answers=3, wrong_answers=0,
                        skipped_answers=0, percentage=Decimal("100.00"),
                        accuracy=Decimal("100.00"), status="submitted"),
            TestAttempt(id=103, test_id=10, student_id=4,
                        started_at=now - timedelta(minutes=2), score=Decimal("0"),
                        percentage=Decimal("0"), accuracy=Decimal("0"),
                        status="in_progress"),
            TestAttempt(id=104, test_id=10, student_id=4,
                        started_at=now - timedelta(days=1), submitted_at=now,
                        score=Decimal("0.00"), correct_answers=0, wrong_answers=3,
                        skipped_answers=0, percentage=Decimal("0.00"),
                        accuracy=Decimal("0.00"), status="submitted"),
        ])
        db.session.flush()
        answers = [
            (1001, 101, 1, "A", "A", True, "2.00"),
            (1002, 101, 2, "A", "B", False, "0.00"),
            (1003, 101, 3, None, "C", False, "0.00"),
            (1004, 102, 1, "A", "A", True, "2.00"),
            (1005, 102, 2, "B", "B", True, "1.00"),
            (1006, 102, 3, "C", "C", True, "3.00"),
            # Unsaved/finally unscored answer data from an active attempt is excluded.
            (1007, 103, 1, "B", "A", False, "0.00"),
            (1008, 104, 1, "B", "A", False, "0.00"),
            (1009, 104, 2, "A", "B", False, "0.00"),
            (1010, 104, 3, "B", "C", False, "0.00"),
        ]
        db.session.add_all([
            TestAnswer(
                id=answer_id, attempt_id=attempt_id, question_id=question_id,
                selected_option=selected, correct_option=correct,
                is_correct=is_correct, marks_obtained=Decimal(marks),
                time_taken_seconds=0,
            )
            for answer_id, attempt_id, question_id, selected, correct, is_correct, marks in answers
        ])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    @staticmethod
    def _headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    def test_admin_authorization_and_unknown_test(self):
        path = "/api/admin/tests/10/analytics"
        self.assertEqual(self.client.get(path).status_code, 401)
        self.assertEqual(self.client.get(path, headers=self._headers(3)).status_code, 403)
        self.assertEqual(self.client.get(path, headers=self._headers(2)).status_code, 403)
        self.assertEqual(self.client.get(path, headers=self._headers(1)).status_code, 200)
        missing = self.client.get(
            "/api/admin/tests/999/analytics", headers=self._headers(1)
        )
        self.assertEqual(missing.status_code, 404)

    def test_attempt_and_score_metrics_use_submitted_results_only(self):
        response = self.client.get(
            "/api/admin/tests/10/analytics", headers=self._headers(1)
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["attempts"], {
            "total": 4, "submitted": 3, "expired": None,
            "in_progress": 1, "unique_students": 2,
        })
        self.assertEqual(data["score"]["average_score"], "2.67")
        self.assertEqual(data["score"]["highest_score"], "6.00")
        self.assertEqual(data["score"]["lowest_score"], "0.00")
        self.assertEqual(data["score"]["average_percentage"], "44.44")
        self.assertEqual(data["score"]["average_accuracy"], "50.00")
        self.assertNotIn("student_name", str(data))
        self.assertNotIn("password", str(data))

    def test_answer_and_question_metrics_follow_saved_submitted_answers(self):
        data = self.client.get(
            "/api/admin/tests/10/analytics", headers=self._headers(1)
        ).get_json()["data"]
        self.assertEqual(data["answers"], {"correct": 4, "wrong": 4, "skipped": 1})
        questions = data["question_performance"]
        self.assertEqual([row["question_number"] for row in questions], [1, 2, 3])
        self.assertEqual([row["question_text"] for row in questions], [
            "Question two", "Question one", "Question three",
        ])
        by_id = {row["question_id"]: row for row in questions}
        self.assertEqual(by_id[1]["attempts"], 3)
        self.assertEqual(by_id[1]["correct"], 2)
        self.assertEqual(by_id[1]["wrong"], 1)
        self.assertEqual(by_id[1]["skipped"], 0)
        self.assertEqual(by_id[1]["accuracy"], 66.67)
        self.assertEqual(by_id[2]["accuracy"], 33.33)
        self.assertEqual(by_id[3]["skipped"], 1)
        self.assertEqual(by_id[3]["accuracy"], 50.0)
        self.assertTrue(all("negative_marks" not in row for row in questions))

    def test_score_distribution_counts_each_finalized_attempt_once(self):
        buckets = self.client.get(
            "/api/admin/tests/10/analytics", headers=self._headers(1)
        ).get_json()["data"]["score_distribution"]
        self.assertEqual([row["range"] for row in buckets], [
            "0-20%", "21-40%", "41-60%", "61-80%", "81-100%",
        ])
        self.assertEqual([row["count"] for row in buckets], [1, 1, 0, 0, 1])
        self.assertEqual(sum(row["count"] for row in buckets), 3)

    def test_zero_attempt_test_returns_null_aggregates_and_zero_safe_questions(self):
        data = self.client.get(
            "/api/admin/tests/11/analytics", headers=self._headers(1)
        ).get_json()["data"]
        self.assertEqual(data["attempts"]["total"], 0)
        self.assertEqual(data["attempts"]["submitted"], 0)
        self.assertIsNone(data["score"]["average_score"])
        self.assertIsNone(data["score"]["highest_score"])
        self.assertIsNone(data["score"]["lowest_score"])
        self.assertIsNone(data["score"]["average_accuracy"])
        self.assertEqual(data["question_performance"][0]["attempts"], 0)
        self.assertIsNone(data["question_performance"][0]["accuracy"])
        self.assertEqual(sum(row["count"] for row in data["score_distribution"]), 0)


if __name__ == "__main__":
    unittest.main()
