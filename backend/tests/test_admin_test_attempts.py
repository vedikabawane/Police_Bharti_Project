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


class AdminTestAttemptsTest(unittest.TestCase):
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
            User(id=1, name="Alice Student", email="alice@example.test",
                 password_hash="private-password-hash", role="student", is_active=True),
            User(id=2, name="Active Admin", email="admin@example.test",
                 password_hash="admin-password-hash", role="admin", is_active=True),
            User(id=3, name="Inactive Admin", email="inactive@example.test",
                 password_hash="inactive-password-hash", role="admin", is_active=False),
            User(id=4, name="Bob Student", email="bob@example.test",
                 password_hash="other-password-hash", role="student", is_active=True),
        ])
        db.session.add_all([
            Subject(id=1, name="History"),
            Subject(id=2, name="Science"),
            Topic(id=1, subject_id=1, name="Ancient History"),
            Topic(id=2, subject_id=2, name="Physics"),
        ])
        db.session.add_all([
            Question(id=1, subject_id=1, topic_id=1, question_text="Question one",
                     correct_option="A", difficulty="easy", marks=2,
                     negative_marks=Decimal("0.50"), is_active=True),
            Question(id=2, subject_id=1, topic_id=1, question_text="Question two",
                     correct_option="B", difficulty="medium", marks=1,
                     negative_marks=Decimal("0.25"), is_active=True),
            Question(id=3, subject_id=1, topic_id=1, question_text="Question three",
                     correct_option="C", difficulty="hard", marks=3,
                     negative_marks=Decimal("1.00"), is_active=True),
        ])
        db.session.add_all([
            QuestionOption(id=(question_id - 1) * 4 + offset,
                           question_id=question_id, option_label=label,
                           option_text=f"Question {question_id} option {label}")
            for question_id in (1, 2, 3)
            for offset, label in enumerate(("A", "B", "C", "D"), start=1)
        ])
        db.session.add_all([
            Test(id=10, title="History Practice", test_type="mixed", subject_id=1,
                 duration_minutes=30, total_questions=3, total_marks=6,
                 negative_marks=0, is_active=True),
            Test(id=11, title="Weekly Science", test_type="weekly", subject_id=2,
                 duration_minutes=20, total_questions=1, total_marks=3,
                 negative_marks=0, is_active=True),
        ])
        db.session.flush()
        db.session.add_all([
            TestQuestion(id=1, test_id=10, question_id=1, question_order=1),
            TestQuestion(id=2, test_id=10, question_id=2, question_order=2),
            TestQuestion(id=3, test_id=10, question_id=3, question_order=3),
            TestQuestion(id=4, test_id=11, question_id=3, question_order=1),
        ])
        now = datetime.utcnow()
        db.session.add_all([
            TestAttempt(
                id=101, test_id=10, student_id=1,
                started_at=now - timedelta(minutes=10),
                submitted_at=now - timedelta(minutes=5), score=Decimal("2.00"),
                correct_answers=1, wrong_answers=1, skipped_answers=1,
                percentage=Decimal("33.33"), accuracy=Decimal("50.00"),
                time_taken_seconds=300, status="submitted",
            ),
            TestAttempt(
                id=102, test_id=10, student_id=1,
                started_at=now - timedelta(minutes=1), status="in_progress",
            ),
            TestAttempt(
                id=103, test_id=11, student_id=4,
                started_at=now - timedelta(minutes=15),
                submitted_at=now - timedelta(minutes=12), score=Decimal("3.00"),
                correct_answers=1, wrong_answers=0, skipped_answers=0,
                percentage=Decimal("100.00"), accuracy=Decimal("100.00"),
                time_taken_seconds=180, status="submitted",
            ),
        ])
        db.session.add_all([
            TestAnswer(id=1001, attempt_id=101, question_id=1,
                       selected_option="A", correct_option="A", is_correct=True,
                       marks_obtained=Decimal("2.00"), time_taken_seconds=0),
            TestAnswer(id=1002, attempt_id=101, question_id=2,
                       selected_option="A", correct_option="B", is_correct=False,
                       marks_obtained=Decimal("0.00"), time_taken_seconds=0),
            TestAnswer(id=1003, attempt_id=101, question_id=3,
                       selected_option=None, correct_option="C", is_correct=False,
                       marks_obtained=Decimal("0.00"), time_taken_seconds=0),
            TestAnswer(id=1004, attempt_id=102, question_id=1,
                       selected_option="D", correct_option="A", is_correct=False,
                       marks_obtained=Decimal("0.00"), time_taken_seconds=0),
            TestAnswer(id=1005, attempt_id=103, question_id=3,
                       selected_option="C", correct_option="C", is_correct=True,
                       marks_obtained=Decimal("3.00"), time_taken_seconds=0),
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

    def test_admin_access_and_inactive_admin_rejection(self):
        self.assertEqual(self.client.get("/api/admin/test-attempts").status_code, 401)
        self.assertEqual(self.client.get(
            "/api/admin/test-attempts", headers=self._headers(1)
        ).status_code, 403)
        self.assertEqual(self.client.get(
            "/api/admin/test-attempts", headers=self._headers(3)
        ).status_code, 403)
        self.assertEqual(self.client.get(
            "/api/admin/test-attempts", headers=self._headers(2)
        ).status_code, 200)

    def test_pagination_is_newest_first(self):
        response = self.client.get(
            "/api/admin/test-attempts?page=1&per_page=2",
            headers=self._headers(2),
        )
        data = response.get_json()["data"]
        self.assertEqual([row["attempt_id"] for row in data["attempts"]], [102, 101])
        self.assertEqual(data["pagination"], {
            "page": 1, "per_page": 2, "total": 3, "pages": 2,
        })

    def test_search_matches_student_name_email_and_test_title(self):
        for search in ("Alice Student", "alice@example.test", "History Practice"):
            with self.subTest(search=search):
                response = self.client.get(
                    f"/api/admin/test-attempts?search={search.replace(' ', '%20')}",
                    headers=self._headers(2),
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(response.get_json()["data"]["pagination"]["total"], 2)

    def test_test_status_and_type_filters_are_applied_server_side(self):
        cases = [
            ("test_id=11", [103]),
            ("status=in_progress", [102]),
            ("status=submitted", [101, 103]),
            ("test_type=weekly", [103]),
        ]
        for query, expected_ids in cases:
            with self.subTest(query=query):
                response = self.client.get(
                    f"/api/admin/test-attempts?{query}", headers=self._headers(2)
                )
                self.assertEqual(
                    [row["attempt_id"] for row in response.get_json()["data"]["attempts"]],
                    expected_ids,
                )

    def test_invalid_status_and_pagination_are_rejected(self):
        for query in ("status=expired", "page=0", "per_page=101"):
            with self.subTest(query=query):
                self.assertEqual(self.client.get(
                    f"/api/admin/test-attempts?{query}", headers=self._headers(2)
                ).status_code, 400)

    def test_list_contains_safe_monitoring_fields_without_private_data(self):
        response = self.client.get(
            "/api/admin/test-attempts?page=2&per_page=1", headers=self._headers(2)
        )
        row = response.get_json()["data"]["attempts"][0]
        self.assertEqual(row["student_name"], "Alice Student")
        self.assertEqual(row["student_email"], "alice@example.test")
        self.assertEqual(row["score"], "2.00")
        self.assertEqual(row["correct_count"], 1)
        self.assertEqual(row["wrong_count"], 1)
        self.assertEqual(row["skipped_count"], 1)
        self.assertNotIn("password_hash", row)
        self.assertNotIn("mobile", row)
        self.assertNotIn("token", row)
        self.assertNotIn("negative_marks", row)
        self.assertNotIn("private-password-hash", response.get_data(as_text=True))

    def test_non_admin_cannot_view_attempt_detail(self):
        response = self.client.get(
            "/api/admin/test-attempts/101", headers=self._headers(1)
        )
        self.assertEqual(response.status_code, 403)

    def test_unknown_attempt_detail_returns_not_found(self):
        response = self.client.get(
            "/api/admin/test-attempts/999", headers=self._headers(2)
        )
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.get_json()["message"], "Test attempt not found.")

    def test_submitted_detail_uses_saved_scoring_and_read_only_question_review(self):
        response = self.client.get(
            "/api/admin/test-attempts/101", headers=self._headers(2)
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["student"], {
            "student_id": 1, "name": "Alice Student", "email": "alice@example.test",
        })
        self.assertEqual(data["result"]["score"], "2.00")
        self.assertEqual(data["result"]["total_marks"], "6.00")
        self.assertEqual(data["result"]["percentage"], "33.33")
        self.assertEqual(data["result"]["correct_count"], 1)
        self.assertEqual(data["result"]["wrong_count"], 1)
        self.assertEqual(data["result"]["skipped_count"], 1)
        self.assertEqual(data["result"]["accuracy"], "50.00")
        self.assertNotIn("negative_marks", data["result"])
        self.assertEqual(
            [row["result_status"] for row in data["questions"]],
            ["correct", "wrong", "skipped"],
        )
        self.assertEqual(data["questions"][1]["marks_earned"], "0.00")
        self.assertEqual(data["questions"][2]["selected_option"], None)
        self.assertEqual(data["questions"][2]["correct_option"], "C")
        self.assertNotIn("explanation", data["questions"][0])
        self.assertNotIn("negative_marks", str(data))

    def test_in_progress_detail_does_not_publish_correctness_or_keys(self):
        response = self.client.get(
            "/api/admin/test-attempts/102", headers=self._headers(2)
        )
        question = response.get_json()["data"]["questions"][0]
        self.assertEqual(question["selected_option"], "D")
        self.assertEqual(question["result_status"], "saved")
        self.assertIsNone(question["correct_option"])
        self.assertIsNone(question["marks_earned"])

    def test_detail_values_match_existing_submission_result_and_wrong_score_is_zero(self):
        now = datetime.utcnow()
        db.session.add(TestAttempt(
            id=104, test_id=10, student_id=1,
            started_at=now - timedelta(minutes=5), status="in_progress",
        ))
        db.session.add_all([
            TestAnswer(id=1041, attempt_id=104, question_id=1,
                       selected_option="A", correct_option="A", is_correct=False,
                       marks_obtained=Decimal("0.00"), time_taken_seconds=0),
            TestAnswer(id=1042, attempt_id=104, question_id=2,
                       selected_option="A", correct_option="B", is_correct=False,
                       marks_obtained=Decimal("0.00"), time_taken_seconds=0),
        ])
        db.session.commit()

        def create_answer_for_sqlite(**values):
            answer_id = (db.session.query(db.func.max(TestAnswer.id)).scalar() or 0) + 1
            answer = TestAnswer(id=answer_id, **values)
            db.session.add(answer)
            return answer

        with patch.object(TestRepository, "create_answer", side_effect=create_answer_for_sqlite):
            submitted = self.client.post(
                "/api/tests/attempts/104/submit", headers=self._headers(1)
            )
        self.assertEqual(submitted.status_code, 200)
        result = submitted.get_json()["data"]
        detail = self.client.get(
            "/api/admin/test-attempts/104", headers=self._headers(2)
        ).get_json()["data"]
        self.assertEqual(detail["result"]["score"], result["score"])
        self.assertEqual(detail["result"]["percentage"], result["percentage"])
        self.assertEqual(detail["result"]["correct_count"], result["correct_answers"])
        self.assertEqual(detail["result"]["wrong_count"], result["wrong_answers"])
        self.assertEqual(detail["result"]["skipped_count"], result["skipped_questions"])
        self.assertEqual(detail["questions"][1]["marks_earned"], "0.00")
        self.assertGreaterEqual(Decimal(detail["result"]["score"]), Decimal("0"))


if __name__ == "__main__":
    unittest.main()
