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


class AdminTestsTest(unittest.TestCase):
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
            User(id=3, name="Inactive Admin", email="inactive@test", password_hash="secret",
                 role="admin", is_active=False),
            User(id=4, name="Other Student", email="other-student@test", password_hash="secret",
                 role="student", is_active=True),
        ])
        db.session.add_all([
            Subject(id=1, name="History"),
            Subject(id=2, name="Science"),
        ])
        db.session.add_all([
            Topic(id=1, subject_id=1, name="Ancient"),
            Topic(id=2, subject_id=1, name="Modern"),
            Topic(id=3, subject_id=2, name="Physics"),
        ])
        db.session.add_all([
            Question(id=1, subject_id=1, topic_id=1, exam_name="Police Bharti",
                     exam_year=2024, question_text="Question one", correct_option="A",
                     difficulty="easy", marks=1, negative_marks=0, is_pyq=True,
                     is_active=True),
            Question(id=2, subject_id=1, topic_id=2, exam_name=None,
                     exam_year=None, question_text="Question two", correct_option="B",
                     difficulty="medium", marks=2, negative_marks=0, is_pyq=False,
                     is_active=True),
            Question(id=3, subject_id=2, topic_id=3, exam_name="Police Bharti",
                     exam_year=2023, question_text="Question three", correct_option="C",
                     difficulty="hard", marks=3, negative_marks=0, is_pyq=True,
                     is_active=True),
            Question(id=4, subject_id=1, topic_id=1, exam_name=None,
                     exam_year=None, question_text="Inactive question", correct_option="D",
                     difficulty="easy", marks=1, negative_marks=0, is_pyq=False,
                     is_active=False),
        ])
        db.session.add_all([
            QuestionOption(id=1, question_id=1, option_label="A", option_text="First"),
            QuestionOption(id=2, question_id=1, option_label="B", option_text="Second"),
            QuestionOption(id=3, question_id=1, option_label="C", option_text="Third"),
            QuestionOption(id=4, question_id=1, option_label="D", option_text="Fourth"),
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

    @staticmethod
    def _create_for_sqlite(data, questions):
        test_id = (db.session.query(db.func.max(Test.id)).scalar() or 0) + 1
        test = Test(id=test_id, **data)
        db.session.add(test)
        db.session.flush()
        next_question_id = (db.session.query(db.func.max(TestQuestion.id)).scalar() or 0) + 1
        for order, question in enumerate(questions, start=1):
            db.session.add(TestQuestion(
                id=next_question_id + order - 1,
                test_id=test.id,
                question_id=question.id,
                question_order=order,
            ))
        db.session.commit()
        return test

    def _create(self, payload, user_id=2):
        with patch.object(TestRepository, "create_admin_test", side_effect=self._create_for_sqlite):
            return self.client.post(
                "/api/admin/tests", json=payload, headers=self._headers(user_id)
            )

    @staticmethod
    def _payload(**overrides):
        payload = {
            "title": "Ancient History",
            "description": "A focused practice test.",
            "test_type": "SUBJECT",
            "subject_id": 1,
            "duration_minutes": 30,
            "question_ids": [1],
            "negative_marks": "0.25",  # Legacy input must be ignored.
        }
        payload.update(overrides)
        return payload

    def test_admin_authentication_role_and_active_account(self):
        self.assertEqual(self.client.get("/api/admin/tests").status_code, 401)
        self.assertEqual(self.client.get("/api/admin/tests", headers=self._headers(1)).status_code, 403)
        self.assertEqual(self.client.get("/api/admin/tests", headers=self._headers(3)).status_code, 403)
        self.assertEqual(self.client.get("/api/admin/tests", headers=self._headers(2)).status_code, 200)
        self.assertEqual(self._create(self._payload(), user_id=1).status_code, 403)
        self.assertEqual(self._create(self._payload(), user_id=3).status_code, 403)

    def test_create_subject_topic_and_mixed_tests_preserves_order_and_marks(self):
        subject = self._create(self._payload(question_ids=[2, 1]))
        self.assertEqual(subject.status_code, 201)
        subject_data = subject.get_json()["data"]
        self.assertEqual([q["question_id"] for q in subject_data["questions"]], [2, 1])
        self.assertEqual(subject_data["total_questions"], 2)
        self.assertEqual(Decimal(subject_data["total_marks"]), Decimal("3.00"))
        self.assertNotIn("negative_marks", subject_data)
        created_subject = Test.query.filter_by(title="Ancient History").first()
        self.assertEqual(created_subject.negative_marks, Decimal("0.00"))

        topic = self._create(self._payload(
            title="Ancient Topic", test_type="TOPIC", topic_id=1, question_ids=[1]
        ))
        self.assertEqual(topic.status_code, 201)

        mixed = self._create(self._payload(
            title="Mixed", test_type="MIXED", subject_id=None, question_ids=[1, 3]
        ))
        self.assertEqual(mixed.status_code, 201)
        self.assertEqual(mixed.get_json()["data"]["total_questions"], 2)
        for test_type in ("FULL_MOCK", "DAILY", "WEEKLY"):
            with self.subTest(test_type=test_type):
                response = self._create(self._payload(
                    title=test_type, test_type=test_type, subject_id=None, question_ids=[1]
                ))
                self.assertEqual(response.status_code, 201)

    def test_create_rejects_invalid_type_missing_scope_and_bad_topic_pair(self):
        cases = [
            (self._payload(test_type="BOGUS"), 422),
            (self._payload(subject_id=None), 400),
            (self._payload(test_type="TOPIC", topic_id=None), 400),
            (self._payload(test_type="TOPIC", topic_id=3), 400),
            (self._payload(topic_id=999), 400),
            (self._payload(subject_id=999), 400),
        ]
        for payload, expected in cases:
            with self.subTest(payload=payload):
                self.assertEqual(self._create(payload).status_code, expected)

    def test_create_rejects_invalid_inactive_duplicate_and_empty_questions(self):
        cases = [
            (self._payload(question_ids=[999]), 400),
            (self._payload(question_ids=[4]), 400),
            (self._payload(question_ids=[1, 1]), 400),
            (self._payload(question_ids=[]), 422),
            (self._payload(duration_minutes=0), 422),
        ]
        for payload, expected in cases:
            with self.subTest(payload=payload):
                self.assertEqual(self._create(payload).status_code, expected)

    def test_create_enforces_question_scope_and_previous_year_bank(self):
        self.assertEqual(self._create(self._payload(question_ids=[3])).status_code, 400)
        self.assertEqual(self._create(self._payload(
            test_type="TOPIC", topic_id=1, question_ids=[2]
        )).status_code, 400)
        self.assertEqual(self._create(self._payload(
            test_type="PREVIOUS_YEAR", subject_id=None, question_ids=[2]
        )).status_code, 400)
        pyq = self._create(self._payload(
            test_type="PREVIOUS_YEAR", subject_id=None, question_ids=[3]
        ))
        self.assertEqual(pyq.status_code, 201)

    def test_list_filters_paginates_and_serializes_only_admin_metadata(self):
        self.assertEqual(self._create(self._payload(title="History Alpha")).status_code, 201)
        self.assertEqual(self._create(self._payload(
            title="History Beta", test_type="MIXED", subject_id=None, question_ids=[1, 3]
        )).status_code, 201)
        inactive = self._create(self._payload(title="Inactive"))
        test_id = inactive.get_json()["data"]["id"]
        self.client.patch(
            f"/api/admin/tests/{test_id}/status", json={"is_active": False},
            headers=self._headers(2),
        )

        response = self.client.get("/api/admin/tests?search=history&per_page=1", headers=self._headers(2))
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["pagination"], {"page": 1, "per_page": 1, "total": 2, "pages": 2})
        self.assertEqual(data["tests"][0]["title"], "History Beta")
        self.assertIn("subject", data["tests"][0])
        self.assertNotIn("attempts", data["tests"][0])
        self.assertEqual(len(self.client.get(
            "/api/admin/tests?test_type=MIXED&subject_id=1", headers=self._headers(2)
        ).get_json()["data"]["tests"]), 0)
        self.assertEqual(len(self.client.get(
            "/api/admin/tests?is_active=false", headers=self._headers(2)
        ).get_json()["data"]["tests"]), 1)
        self.assertEqual(self.client.get(
            "/api/admin/tests?per_page=101", headers=self._headers(2)
        ).status_code, 400)

    def test_detail_includes_ordered_questions_and_metadata(self):
        created = self._create(self._payload(question_ids=[2, 1])).get_json()["data"]
        response = self.client.get(
            f"/api/admin/tests/{created['id']}", headers=self._headers(2)
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual([row["question_order"] for row in data["questions"]], [1, 2])
        self.assertEqual([row["question_id"] for row in data["questions"]], [2, 1])
        self.assertEqual(data["subject"]["name"], "History")
        self.assertEqual(data["question_count"], 2)
        self.assertEqual(self.client.get(
            "/api/admin/tests/999", headers=self._headers(2)
        ).status_code, 404)

    def test_update_safe_fields_and_rejects_structural_changes_after_attempt(self):
        created = self._create(self._payload()).get_json()["data"]
        test_id = created["id"]
        safe = self.client.patch(
            f"/api/admin/tests/{test_id}",
            json={"title": "Renamed test", "description": None, "duration_minutes": 45},
            headers=self._headers(2),
        )
        self.assertEqual(safe.status_code, 200)
        self.assertEqual(safe.get_json()["data"]["title"], "Renamed test")

        db.session.add(TestAttempt(id=1, test_id=test_id, student_id=1))
        db.session.add(TestAnswer(
            id=1, attempt_id=1, question_id=1, selected_option="A",
            correct_option="A", is_correct=True, marks_obtained=Decimal("1"),
            time_taken_seconds=5,
        ))
        db.session.commit()
        for payload in (
            {"question_ids": [2]},
            {"test_type": "MIXED"},
            {"subject_id": 2},
        ):
            with self.subTest(payload=payload):
                response = self.client.patch(
                    f"/api/admin/tests/{test_id}", json=payload, headers=self._headers(2)
                )
                self.assertEqual(response.status_code, 409)
        legacy_update = self.client.patch(
            f"/api/admin/tests/{test_id}", json={"negative_marks": "9.99"},
            headers=self._headers(2),
        )
        self.assertEqual(legacy_update.status_code, 200)
        self.assertNotIn("negative_marks", legacy_update.get_json()["data"])
        self.assertEqual(db.session.get(Test, test_id).negative_marks, Decimal("0.00"))
        self.assertIsNotNone(db.session.get(TestAttempt, 1))
        self.assertIsNotNone(db.session.get(TestAnswer, 1))

    def test_question_replacement_updates_order_and_marks_without_attempts(self):
        created = self._create(self._payload()).get_json()["data"]
        with patch.object(TestRepository, "update_admin_test", side_effect=self._sqlite_update_for_test):
            updated = self.client.patch(
                f"/api/admin/tests/{created['id']}",
                json={"question_ids": [3, 1], "test_type": "MIXED", "subject_id": None},
                headers=self._headers(2),
            )
        self.assertEqual(updated.status_code, 200)
        data = updated.get_json()["data"]
        self.assertEqual([row["question_id"] for row in data["questions"]], [3, 1])
        self.assertEqual(Decimal(data["total_marks"]), Decimal("4.00"))

    @staticmethod
    def _sqlite_update_for_test(test, data, questions=None):
        for key, value in data.items():
            setattr(test, key, value)
        if questions is not None:
            TestQuestion.query.filter_by(test_id=test.id).delete(synchronize_session=False)
            next_id = (db.session.query(db.func.max(TestQuestion.id)).scalar() or 0) + 1
            for order, question in enumerate(questions, start=1):
                db.session.add(TestQuestion(
                    id=next_id + order - 1,
                    test_id=test.id,
                    question_id=question.id,
                    question_order=order,
                ))
            test.total_questions = len(questions)
            test.total_marks = sum((q.marks for q in questions), start=Decimal("0"))
        db.session.commit()
        if questions is not None:
            db.session.expire(test, ["questions"])
        return test

    def test_status_requires_boolean_and_preserves_attempts(self):
        created = self._create(self._payload()).get_json()["data"]
        test_id = created["id"]
        db.session.add(TestAttempt(id=1, test_id=test_id, student_id=1,
                                   started_at=datetime.utcnow()))
        db.session.commit()
        invalid = self.client.patch(
            f"/api/admin/tests/{test_id}/status", json={"is_active": "false"},
            headers=self._headers(2),
        )
        self.assertEqual(invalid.status_code, 400)
        inactive = self.client.patch(
            f"/api/admin/tests/{test_id}/status", json={"is_active": False},
            headers=self._headers(2),
        )
        self.assertEqual(inactive.status_code, 200)
        self.assertFalse(inactive.get_json()["data"]["is_active"])
        self.assertIsNotNone(db.session.get(TestAttempt, 1))

    def test_students_cannot_read_detail_or_modify_or_delete(self):
        created = self._create(self._payload()).get_json()["data"]
        test_id = created["id"]
        self.assertEqual(self.client.get(
            f"/api/admin/tests/{test_id}", headers=self._headers(1)
        ).status_code, 403)
        self.assertEqual(self.client.patch(
            f"/api/admin/tests/{test_id}", json={"title": "Student edit"},
            headers=self._headers(1),
        ).status_code, 403)
        self.assertEqual(self.client.patch(
            f"/api/admin/tests/{test_id}/status", json={"is_active": False},
            headers=self._headers(1),
        ).status_code, 403)
        self.assertEqual(self.client.delete(
            f"/api/admin/tests/{test_id}", headers=self._headers(1)
        ).status_code, 403)
        self.assertEqual(self.client.delete(
            f"/api/admin/tests/{test_id}", headers=self._headers(2)
        ).status_code, 200)

    def test_student_test_list_filters_paginates_and_exposes_safe_active_metadata(self):
        self.assertEqual(self.client.get("/api/student/tests").status_code, 401)
        self.assertEqual(self.client.get(
            "/api/student/tests", headers=self._headers(2)
        ).status_code, 403)

        self.assertEqual(self._create(self._payload(title="History Alpha")).status_code, 201)
        self.assertEqual(self._create(self._payload(
            title="History Beta", test_type="MIXED", subject_id=None, question_ids=[1, 3]
        )).status_code, 201)
        inactive = self._create(self._payload(title="History Inactive"))
        inactive_id = inactive.get_json()["data"]["id"]
        self.client.patch(
            f"/api/admin/tests/{inactive_id}/status", json={"is_active": False},
            headers=self._headers(2),
        )

        response = self.client.get(
            "/api/student/tests?search=history&per_page=1",
            headers=self._headers(1),
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["pagination"], {"page": 1, "per_page": 1, "total": 2, "pages": 2})
        test = data["tests"][0]
        self.assertEqual(test["title"], "History Beta")
        self.assertTrue(test["is_active"])
        self.assertEqual(test["question_count"], 2)
        self.assertEqual(test["subject"], None)
        self.assertNotIn("negative_marks", test)
        self.assertNotIn("questions", test)
        self.assertNotIn("attempts", test)
        self.assertNotIn("created_at", test)

        filtered = self.client.get(
            "/api/student/tests?test_type=MIXED&subject_id=1",
            headers=self._headers(1),
        )
        self.assertEqual(filtered.status_code, 200)
        self.assertEqual(filtered.get_json()["data"]["pagination"]["total"], 0)
        self.assertEqual(self.client.get(
            "/api/student/tests?per_page=101", headers=self._headers(1)
        ).status_code, 400)

    def test_student_test_detail_hides_inactive_and_returns_metadata_only(self):
        created = self._create(self._payload(topic_id=1)).get_json()["data"]
        response = self.client.get(
            f"/api/student/tests/{created['id']}", headers=self._headers(1)
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["subject"], "History")
        self.assertEqual(data["topic"], "Ancient")
        self.assertEqual(data["question_count"], 1)
        self.assertNotIn("questions", data)
        self.assertNotIn("correct_option", data)

        self.client.patch(
            f"/api/admin/tests/{created['id']}/status", json={"is_active": False},
            headers=self._headers(2),
        )
        self.assertEqual(self.client.get(
            f"/api/student/tests/{created['id']}", headers=self._headers(1)
        ).status_code, 404)

    def test_student_start_uses_existing_attempt_endpoint_and_role_protection(self):
        created = self._create(self._payload()).get_json()["data"]
        test_id = created["id"]
        self.assertEqual(self.client.post(f"/api/tests/{test_id}/start").status_code, 401)
        self.assertEqual(self.client.post(
            f"/api/tests/{test_id}/start", headers=self._headers(2)
        ).status_code, 403)

        def create_attempt_for_sqlite(test_id, student_id):
            attempt_id = (db.session.query(db.func.max(TestAttempt.id)).scalar() or 0) + 1
            attempt = TestAttempt(id=attempt_id, test_id=test_id, student_id=student_id)
            db.session.add(attempt)
            db.session.commit()
            return attempt

        with patch.object(TestRepository, "create_attempt", side_effect=create_attempt_for_sqlite):
            started = self.client.post(
                f"/api/tests/{test_id}/start", headers=self._headers(1)
            )
            self.assertEqual(started.status_code, 201)
            self.assertEqual(started.get_json()["data"]["status"], "in_progress")

            second_start = self.client.post(
                f"/api/tests/{test_id}/start", headers=self._headers(1)
            )
            self.assertEqual(second_start.status_code, 201)
            self.assertNotEqual(started.get_json()["data"]["id"], second_start.get_json()["data"]["id"])

    def test_student_can_load_only_own_attempt_without_answer_keys(self):
        test = self._create(self._payload()).get_json()["data"]
        db.session.add(TestAttempt(id=1, test_id=test["id"], student_id=1))
        db.session.commit()

        self.assertEqual(self.client.get("/api/tests/attempts/1").status_code, 401)
        own_attempt = self.client.get(
            "/api/tests/attempts/1", headers=self._headers(1)
        )
        self.assertEqual(own_attempt.status_code, 200)
        data = own_attempt.get_json()["data"]
        self.assertEqual(data["question_count"], 1)
        self.assertGreater(data["remaining_seconds"], 0)
        question = data["questions"][0]
        self.assertEqual(question["selected_answer"], None)
        self.assertEqual([option["option_label"] for option in question["options"]], ["A", "B", "C", "D"])
        self.assertNotIn("correct_option", question)
        self.assertNotIn("explanation", question)

        other_student = self.client.get(
            "/api/tests/attempts/1", headers=self._headers(4)
        )
        self.assertEqual(other_student.status_code, 404)

    def test_student_can_save_and_change_answer_without_duplicate_rows(self):
        test = self._create(self._payload()).get_json()["data"]
        db.session.add(TestAttempt(id=1, test_id=test["id"], student_id=1))
        db.session.commit()
        endpoint = "/api/tests/attempts/1/answers"

        def save_answer_for_sqlite(attempt_id, question, selected_option):
            answer = TestRepository.find_attempt_answer(attempt_id, question.id)
            if answer:
                answer.selected_option = selected_option
            else:
                answer_id = (db.session.query(db.func.max(TestAnswer.id)).scalar() or 0) + 1
                answer = TestAnswer(
                    id=answer_id,
                    attempt_id=attempt_id,
                    question_id=question.id,
                    selected_option=selected_option,
                    correct_option=question.correct_option,
                    is_correct=False,
                    marks_obtained=Decimal("0"),
                    time_taken_seconds=0,
                )
                db.session.add(answer)
            db.session.commit()
            return answer

        with patch.object(TestRepository, "save_attempt_answer", side_effect=save_answer_for_sqlite):
            saved = self.client.patch(endpoint, json={
                "question_id": 1, "selected_option": "A",
            }, headers=self._headers(1))
            self.assertEqual(saved.status_code, 200)
            changed = self.client.patch(endpoint, json={
                "question_id": 1, "selected_option": "C",
            }, headers=self._headers(1))
            self.assertEqual(changed.status_code, 200)
            answers = TestAnswer.query.filter_by(attempt_id=1, question_id=1).all()
            self.assertEqual(len(answers), 1)
            self.assertEqual(answers[0].selected_option, "C")

            self.assertEqual(self.client.patch(endpoint, json={
                "question_id": 999, "selected_option": "A",
            }, headers=self._headers(1)).status_code, 400)
            self.assertEqual(self.client.patch(endpoint, json={
                "question_id": 1, "selected_option": "Z",
            }, headers=self._headers(1)).status_code, 422)
            self.assertNotEqual(self.client.patch(endpoint, json={
                "question_id": 1, "selected_option": "B",
            }, headers=self._headers(4)).status_code, 200)

    def test_student_cannot_change_submitted_or_expired_attempt_answers(self):
        test = self._create(self._payload()).get_json()["data"]
        submitted = TestAttempt(id=1, test_id=test["id"], student_id=1, status="submitted")
        expired = TestAttempt(id=2, test_id=test["id"], student_id=1,
                              started_at=datetime.utcnow() - timedelta(minutes=31))
        db.session.add_all([submitted, expired])
        db.session.commit()
        payload = {"question_id": 1, "selected_option": "A"}

        self.assertEqual(self.client.patch(
            "/api/tests/attempts/1/answers", json=payload, headers=self._headers(1)
        ).status_code, 409)
        self.assertEqual(self.client.patch(
            "/api/tests/attempts/2/answers", json=payload, headers=self._headers(1)
        ).status_code, 409)


if __name__ == "__main__":
    unittest.main()
