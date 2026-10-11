import unittest
from datetime import datetime
from decimal import Decimal
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import Question, QuestionOption, Subject, Topic, User
from app.repositories.question_repository import QuestionRepository


class AdminQuestionsTest(unittest.TestCase):
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
        ])
        db.session.add_all([
            Subject(id=1, name="History"),
            Subject(id=2, name="Science"),
        ])
        db.session.add_all([
            Topic(id=1, subject_id=1, name="Ancient India"),
            Topic(id=2, subject_id=1, name="Modern India"),
            Topic(id=3, subject_id=2, name="Physics"),
        ])
        questions = [
            Question(id=1, subject_id=1, topic_id=1, exam_name="Police Bharti",
                     exam_year=2024, question_text="Who founded the Maurya Empire?",
                     correct_option="A", explanation="Chandragupta founded the empire.",
                     difficulty="medium", marks=1, negative_marks=0, is_pyq=True,
                     is_active=True, created_at=datetime(2026, 1, 1), updated_at=datetime(2026, 1, 2)),
            Question(id=2, subject_id=1, topic_id=2, exam_name="Police Bharti",
                     exam_year=2023, question_text="When did the movement begin?",
                     correct_option="B", explanation="A history question.", difficulty="easy",
                     marks=2, negative_marks=0.5, is_pyq=True, is_active=False,
                     created_at=datetime(2026, 1, 2), updated_at=datetime(2026, 1, 3)),
            Question(id=3, subject_id=2, topic_id=3, exam_name="Maharashtra Police",
                     exam_year=2024, question_text="What is Newton's second law?",
                     correct_option="C", explanation=None, difficulty="hard", marks=1,
                     negative_marks=0, is_pyq=False, is_active=True,
                     created_at=datetime(2026, 1, 2), updated_at=datetime(2026, 1, 3)),
            Question(id=4, subject_id=1, topic_id=1, exam_name=None,
                     exam_year=None, question_text="A regular ancient history question",
                     correct_option="D", explanation=None, difficulty="medium", marks=1,
                     negative_marks=0, is_pyq=False, is_active=True,
                     created_at=datetime(2026, 1, 2), updated_at=datetime(2026, 1, 3)),
        ]
        db.session.add_all(questions)
        db.session.flush()
        option_id = 1
        for question in questions:
            for label in ("A", "B", "C", "D"):
                db.session.add(QuestionOption(
                    id=option_id,
                    question_id=question.id,
                    option_label=label,
                    option_text=f"Question {question.id} option {label}",
                ))
                option_id += 1
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    @staticmethod
    def _headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    def _get(self, query=None):
        return self.client.get("/api/admin/questions", query_string=query,
                               headers=self._headers(2))

    @staticmethod
    def _question_payload(is_pyq=False, is_active=True):
        return {
            "question_text": "Which option is correct?",
            "options": [
                {"option_label": label, "option_text": f"Option {label}"}
                for label in ("A", "B", "C", "D")
            ],
            "correct_option": "C",
            "explanation": "Because option C is correct.",
            "difficulty": "medium",
            "marks": "2.00",
            "negative_marks": "0.50",
            "exam_name": "Police Bharti",
            "exam_year": 2024,
            "is_pyq": is_pyq,
            "is_active": is_active,
        }

    def _create_with_explicit_sqlite_ids(self, subject_id, topic_id, data):
        values = dict(data)
        options = values.pop("options")
        question_id = (db.session.query(db.func.max(Question.id)).scalar() or 0) + 1
        question = Question(id=question_id, subject_id=subject_id, topic_id=topic_id, **values)
        db.session.add(question)
        db.session.flush()
        first_option_id = (db.session.query(db.func.max(QuestionOption.id)).scalar() or 0) + 1
        for option_id, option in enumerate(options, start=first_option_id):
            db.session.add(QuestionOption(id=option_id, question_id=question.id, **option))
        db.session.commit()
        return question

    def _update_with_explicit_option_ids(self, question, data):
        values = dict(data)
        options = values.pop("options", None)
        for key, value in values.items():
            setattr(question, key, value)
        if options is not None:
            QuestionOption.query.filter_by(question_id=question.id).delete()
            first_option_id = (db.session.query(db.func.max(QuestionOption.id)).scalar() or 0) + 1
            for option_id, option in enumerate(options, start=first_option_id):
                db.session.add(QuestionOption(id=option_id, question_id=question.id, **option))
        db.session.commit()
        return question

    def test_create_requires_admin_role(self):
        url = "/api/questions/subject/1/topic/1"
        payload = self._question_payload()
        self.assertEqual(self.client.post(url, json=payload).status_code, 401)
        self.assertEqual(self.client.post(url, json=payload, headers=self._headers(1)).status_code, 403)

    def test_admin_can_create_regular_and_pyq_with_four_options(self):
        with patch.object(QuestionRepository, "create", side_effect=self._create_with_explicit_sqlite_ids):
            for is_pyq in (False, True):
                payload = self._question_payload(is_pyq=is_pyq, is_active=not is_pyq)
                if not is_pyq:
                    payload.pop("is_active")
                response = self.client.post(
                    "/api/questions/subject/1/topic/1",
                    json=payload,
                    headers=self._headers(2),
                )
                self.assertEqual(response.status_code, 201)
                data = response.get_json()["data"]
                self.assertEqual(data["correct_option"], "C")
                self.assertEqual(data["is_pyq"], is_pyq)
                self.assertEqual(data["is_active"], not is_pyq)
                self.assertNotIn("negative_marks", data)
                self.assertEqual([option["option_label"] for option in data["options"]],
                                 ["A", "B", "C", "D"])
                self.assertNotIn("password_hash", str(data))
                self.assertNotIn("email", str(data))
        created_questions = Question.query.filter_by(question_text="Which option is correct?").order_by(
            Question.id.asc()
        ).all()
        self.assertEqual(len(created_questions), 2)
        for question, is_pyq in zip(created_questions, (False, True)):
            self.assertEqual(question.correct_option, "C")
            self.assertEqual(question.subject_id, 1)
            self.assertEqual(question.topic_id, 1)
            self.assertEqual(question.is_pyq, is_pyq)
            self.assertEqual(question.negative_marks, Decimal("0.00"))
            self.assertEqual(len(question.options), 4)

    def test_create_validates_topic_relationship_and_question_schema(self):
        payload = self._question_payload()
        mismatched_topic = self.client.post(
            "/api/questions/subject/1/topic/3", json=payload, headers=self._headers(2)
        )
        self.assertEqual(mismatched_topic.status_code, 409)

        invalid_labels = self._question_payload()
        invalid_labels["options"][3]["option_label"] = "C"
        invalid_correct = self._question_payload()
        invalid_correct["correct_option"] = "E"
        invalid_difficulty = self._question_payload()
        invalid_difficulty["difficulty"] = "expert"
        invalid_marks = self._question_payload()
        invalid_marks["marks"] = "-1"
        for invalid_payload in (invalid_labels, invalid_correct, invalid_difficulty, invalid_marks):
            with self.subTest(payload=invalid_payload):
                response = self.client.post(
                    "/api/questions/subject/1/topic/1",
                    json=invalid_payload,
                    headers=self._headers(2),
                )
                self.assertEqual(response.status_code, 422)

    def test_admin_can_update_question_fields_and_replace_all_options(self):
        payload = {
            "question_text": "Updated question text",
            "options": [
                {"option_label": label, "option_text": f"New option {label}"}
                for label in ("A", "B", "C", "D")
            ],
            "correct_option": "D",
            "explanation": "Updated explanation",
            "difficulty": "hard",
            "marks": "3.50",
            "negative_marks": "1.25",
            "exam_name": "Updated Exam",
            "exam_year": 2025,
            "is_pyq": True,
            "is_active": False,
        }
        with patch.object(QuestionRepository, "update", side_effect=self._update_with_explicit_option_ids):
            response = self.client.patch(
                "/api/questions/1", json=payload, headers=self._headers(2)
            )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        for key in ("question_text", "explanation", "difficulty", "marks",
                    "exam_name", "exam_year", "is_pyq", "is_active", "correct_option"):
            self.assertEqual(data[key], payload[key])
        self.assertNotIn("negative_marks", data)
        self.assertEqual(db.session.get(Question, 1).negative_marks, Decimal("0.00"))
        self.assertEqual([option["option_text"] for option in data["options"]],
                         [f"New option {label}" for label in ("A", "B", "C", "D")])
        self.assertNotIn("password_hash", str(data))
        self.assertNotIn("email", str(data))

    def test_update_requires_admin_and_preserves_subject_topic_assignment(self):
        self.assertEqual(self.client.patch("/api/questions/1", json={"question_text": "x"}).status_code, 401)
        self.assertEqual(self.client.patch("/api/questions/1", json={"question_text": "x"},
                                           headers=self._headers(1)).status_code, 403)
        response = self.client.patch("/api/questions/1", json={"subject_id": 2, "topic_id": 3},
                                     headers=self._headers(2))
        self.assertEqual(response.status_code, 422)
        stored = db.session.get(Question, 1)
        self.assertEqual((stored.subject_id, stored.topic_id), (1, 1))

    def test_update_rejects_duplicate_option_labels(self):
        invalid_options = [
            {"option_label": "A", "option_text": "One"},
            {"option_label": "A", "option_text": "Two"},
            {"option_label": "C", "option_text": "Three"},
            {"option_label": "D", "option_text": "Four"},
        ]
        response = self.client.patch("/api/questions/1", json={"options": invalid_options},
                                     headers=self._headers(2))
        self.assertEqual(response.status_code, 422)
        self.assertEqual(QuestionOption.query.filter_by(question_id=1).count(), 4)

    def test_status_patch_deactivates_and_activates_without_deleting(self):
        inactive = self.client.patch("/api/questions/1", json={"is_active": False},
                                     headers=self._headers(2))
        self.assertEqual(inactive.status_code, 200)
        self.assertFalse(inactive.get_json()["data"]["is_active"])
        self.assertIsNotNone(db.session.get(Question, 1))
        admin_list = self._get({"is_active": "false"})
        self.assertIn(1, [item["id"] for item in admin_list.get_json()["data"]["questions"]])
        topic_list = self.client.get("/api/questions/topic/1", headers=self._headers(1))
        self.assertNotIn(1, [item["id"] for item in topic_list.get_json()["data"]])
        pyq_list = self.client.get("/api/questions/pyq?subject_id=1", headers=self._headers(1))
        self.assertNotIn(1, [item["id"] for item in pyq_list.get_json()["data"]])

        active = self.client.patch("/api/questions/1", json={"is_active": True},
                                   headers=self._headers(2))
        self.assertEqual(active.status_code, 200)
        self.assertTrue(active.get_json()["data"]["is_active"])

    def test_create_failure_rolls_back_question_and_options(self):
        original_add = db.session.add
        added_options = 0

        def fail_while_adding_option(entity):
            nonlocal added_options
            if isinstance(entity, Question):
                entity.id = 99
                return original_add(entity)
            added_options += 1
            if added_options == 1:
                raise RuntimeError("option insert failed")
            return original_add(entity)

        payload = self._question_payload()
        with patch.object(db.session, "add", side_effect=fail_while_adding_option):
            with self.assertRaises(RuntimeError):
                QuestionRepository.create(1, 1, payload)
        self.assertIsNone(db.session.get(Question, 99))
        self.assertEqual(QuestionOption.query.filter_by(question_id=99).count(), 0)

    def test_update_option_failure_rolls_back_question_and_option_replacement(self):
        question = db.session.get(Question, 1)
        previous_text = question.question_text
        previous_options = [option.option_text for option in question.options]
        with patch.object(db.session, "add", side_effect=RuntimeError("option insert failed")):
            with self.assertRaises(RuntimeError):
                QuestionRepository.update(question, {
                    "question_text": "Partially updated text",
                    "options": [
                        {"option_label": label, "option_text": f"Replacement {label}"}
                        for label in ("A", "B", "C", "D")
                    ],
                })
        stored = db.session.get(Question, 1)
        self.assertEqual(stored.question_text, previous_text)
        self.assertEqual([option.option_text for option in stored.options], previous_options)

    def test_authentication_and_active_admin_required(self):
        self.assertEqual(self.client.get("/api/admin/questions").status_code, 401)
        self.assertEqual(self.client.get("/api/admin/questions", headers=self._headers(1)).status_code, 403)
        self.assertEqual(self.client.get("/api/admin/questions", headers=self._headers(3)).status_code, 403)
        self.assertEqual(self._get().status_code, 200)

    def test_default_pagination_order_and_safe_serialization(self):
        response = self._get()
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual([item["id"] for item in data["questions"]], [4, 3, 2, 1])
        self.assertEqual(data["pagination"], {"page": 1, "per_page": 20, "total": 4, "pages": 1})
        question = data["questions"][0]
        self.assertEqual(question["correct_option"], "D")
        self.assertEqual(datetime.fromisoformat(question["created_at"]), datetime(2026, 1, 2))
        self.assertEqual(datetime.fromisoformat(question["updated_at"]), datetime(2026, 1, 3))
        self.assertEqual([option["option_label"] for option in question["options"]], ["A", "B", "C", "D"])
        self.assertEqual(question["subject"], {"id": 1, "name": "History"})
        self.assertEqual(question["topic"], {"id": 1, "name": "Ancient India"})
        self.assertEqual(set(question), {
            "id", "subject_id", "topic_id", "exam_name", "exam_year", "question_text",
            "correct_option", "explanation", "difficulty", "marks",
            "is_pyq", "is_active", "created_at", "updated_at", "subject", "topic", "options",
        })
        self.assertNotIn("password_hash", str(data))
        self.assertNotIn("email", str(data))

    def test_custom_pagination_and_per_page_maximum(self):
        response = self._get({"page": "2", "per_page": "2"})
        data = response.get_json()["data"]
        self.assertEqual([item["id"] for item in data["questions"]], [2, 1])
        self.assertEqual(data["pagination"], {"page": 2, "per_page": 2, "total": 4, "pages": 2})
        self.assertEqual(self._get({"per_page": "100"}).status_code, 200)
        self.assertEqual(self._get({"per_page": "101"}).status_code, 400)
        self.assertEqual(self._get({"page": "0"}).status_code, 400)

    def test_search_matches_question_text_and_exam_name_case_insensitively(self):
        for term, expected in (("MAURYA", [1]), ("MAHARASHTRA POLICE", [3])):
            with self.subTest(term=term):
                response = self._get({"search": term})
                self.assertEqual([item["id"] for item in response.get_json()["data"]["questions"]], expected)

    def test_individual_filters(self):
        cases = [
            ({"subject_id": "1"}, [4, 2, 1]),
            ({"topic_id": "3"}, [3]),
            ({"exam_name": "Police Bharti"}, [2, 1]),
            ({"exam_year": "2024"}, [3, 1]),
            ({"is_pyq": "true"}, [2, 1]),
            ({"is_pyq": "1"}, [2, 1]),
            ({"is_pyq": "false"}, [4, 3]),
            ({"difficulty": "HARD"}, [3]),
            ({"is_active": "true"}, [4, 3, 1]),
            ({"is_active": "0"}, [2]),
        ]
        for query, expected in cases:
            with self.subTest(query=query):
                response = self._get(query)
                self.assertEqual(response.status_code, 200)
                self.assertEqual([item["id"] for item in response.get_json()["data"]["questions"]], expected)

    def test_combined_filters_and_subject_topic_consistency(self):
        query = {"subject_id": "1", "topic_id": "1", "is_pyq": "true",
                 "exam_year": "2024", "difficulty": "medium", "is_active": "true"}
        response = self._get(query)
        self.assertEqual([item["id"] for item in response.get_json()["data"]["questions"]], [1])
        mismatch = self._get({"subject_id": "2", "topic_id": "1"})
        self.assertEqual(mismatch.get_json()["data"]["questions"], [])

    def test_invalid_filters_return_bad_request(self):
        cases = [
            ({"is_pyq": "sometimes"}, "is_pyq"),
            ({"is_pyq": ""}, "is_pyq"),
            ({"is_active": "enabled"}, "is_active"),
            ({"difficulty": "expert"}, "difficulty"),
            ({"exam_year": "2024x"}, "exam_year"),
            ({"subject_id": "invalid"}, "subject_id"),
            ({"topic_id": "invalid"}, "topic_id"),
        ]
        for query, message_part in cases:
            with self.subTest(query=query):
                response = self._get(query)
                self.assertEqual(response.status_code, 400)
                self.assertIn(message_part, response.get_json()["message"])

    def test_existing_student_question_and_pyq_reads_remain_unchanged(self):
        topic_response = self.client.get("/api/questions/topic/1", headers=self._headers(1))
        self.assertEqual(topic_response.status_code, 200)
        self.assertEqual([item["id"] for item in topic_response.get_json()["data"]], [4, 1])
        self.assertNotIn("created_at", topic_response.get_json()["data"][0])

        pyq_response = self.client.get("/api/questions/pyq?subject_id=1", headers=self._headers(1))
        self.assertEqual(pyq_response.status_code, 200)
        self.assertEqual([item["id"] for item in pyq_response.get_json()["data"]], [1])


if __name__ == "__main__":
    unittest.main()
