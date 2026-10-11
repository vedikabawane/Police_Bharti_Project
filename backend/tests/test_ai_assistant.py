import unittest
from datetime import date, datetime
from decimal import Decimal
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import (
    AIChatMessage,
    AIChatSession,
    Note,
    PhysicalTraining,
    Question,
    Subject,
    Test,
    TestAnswer,
    TestAttempt,
    Topic,
    User,
)


class AIAssistantTest(unittest.TestCase):

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
                name="Student One",
                email="student1@example.test",
                password_hash="test-hash",
                role="student",
                is_active=True,
            ),
            User(
                id=2,
                name="Student Two",
                email="student2@example.test",
                password_hash="test-hash",
                role="student",
                is_active=True,
            ),
            User(
                id=3,
                name="Admin",
                email="admin@example.test",
                password_hash="test-hash",
                role="admin",
                is_active=True,
            ),
            Subject(id=1, name="मराठी"),
            Subject(id=2, name="गणित"),
            Topic(id=1, subject_id=1, name="व्याकरण"),
            Topic(id=2, subject_id=2, name="टक्केवारी"),
            Note(
                id=1,
                subject_id=1,
                topic_id=1,
                title="मराठी व्याकरण",
                content="नाम आणि सर्वनाम यांचा परिचय.",
                is_active=True,
            ),
        ])
        db.session.commit()
        self.student_headers = self._headers(1)
        self.other_student_headers = self._headers(2)
        self.admin_headers = self._headers(3)

    @staticmethod
    def _headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    def _add_performance_attempt(self, attempt_id, subject_id, topic_id, correct):
        question_count = 5
        score = Decimal(str(correct - (question_count - correct) * 0.25))
        db.session.add(Test(
            id=attempt_id,
            title="गणित चाचणी",
            test_type="subject",
            subject_id=subject_id,
            topic_id=topic_id,
            total_questions=question_count,
            total_marks=question_count,
            negative_marks=Decimal("0.25"),
        ))
        db.session.flush()
        db.session.add(TestAttempt(
            id=attempt_id,
            test_id=attempt_id,
            student_id=1,
            started_at=datetime(2026, 1, attempt_id % 20 + 1, 9),
            submitted_at=datetime(2026, 1, attempt_id % 20 + 1, 10),
            score=score,
            correct_answers=correct,
            wrong_answers=question_count - correct,
            skipped_answers=0,
            percentage=score * 100 / question_count,
            time_taken_seconds=300,
            accuracy=Decimal(str(correct * 100 / question_count)),
            status="submitted",
        ))
        db.session.flush()
        for offset in range(question_count):
            question_id = attempt_id * 10 + offset
            is_correct = offset < correct
            db.session.add(Question(
                id=question_id,
                subject_id=subject_id,
                topic_id=topic_id,
                question_text=f"गणित प्रश्न {question_id}",
                correct_option="A",
                marks=Decimal("1"),
            ))
            db.session.add(TestAnswer(
                id=question_id,
                attempt_id=attempt_id,
                question_id=question_id,
                selected_option="A" if is_correct else "B",
                correct_option="A",
                is_correct=is_correct,
                marks_obtained=Decimal("1" if is_correct else "-0.25"),
                time_taken_seconds=60,
            ))
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_marathi_chat_searches_existing_study_material(self):
        response = self.client.post(
            "/api/student/ai/chat",
            json={"message": "मराठी व्याकरणाबद्दल सांगा"},
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["question"], "मराठी व्याकरणाबद्दल सांगा")
        self.assertIn("नाम आणि सर्वनाम", data["answer"])
        self.assertTrue(data["session_id"])

    def test_chatboard_persists_and_returns_owned_history(self):
        chat = self.client.post(
            "/api/student/ai/chat",
            json={"message": "पोलीस भरतीची तयारी कशी करावी?"},
            headers=self.student_headers,
        )
        self.assertEqual(chat.status_code, 200)
        session_id = chat.get_json()["data"]["session_id"]

        follow_up = self.client.post(
            "/api/student/ai/chat",
            json={
                "message": "माझी तयारी कशी सुधारू?",
                "session_id": session_id,
            },
            headers=self.student_headers,
        )
        self.assertEqual(follow_up.status_code, 200)
        self.assertEqual(
            follow_up.get_json()["data"]["session_id"],
            session_id,
        )

        history = self.client.get(
            "/api/student/ai/history",
            headers=self.student_headers,
        )
        self.assertEqual(history.status_code, 200)
        sessions = history.get_json()["data"]
        self.assertEqual(len(sessions), 1)
        self.assertEqual(len(sessions[0]["messages"]), 4)
        self.assertEqual(
            [message["role"] for message in sessions[0]["messages"]],
            ["user", "assistant", "user", "assistant"],
        )

        foreign_history = self.client.get(
            f"/api/student/ai/history?session_id={session_id}",
            headers=self.other_student_headers,
        )
        self.assertEqual(foreign_history.status_code, 404)

    def test_chat_uses_actual_student_performance_for_weak_topics(self):
        db.session.add(Test(
            id=1,
            title="मराठी चाचणी",
            test_type="subject",
            subject_id=1,
            topic_id=1,
            total_questions=5,
            total_marks=5,
            negative_marks=Decimal("0.25"),
        ))
        db.session.flush()
        db.session.add(TestAttempt(
            id=1,
            test_id=1,
            student_id=1,
            started_at=datetime(2026, 1, 1, 9),
            submitted_at=datetime(2026, 1, 1, 10),
            score=Decimal("-1.25"),
            correct_answers=0,
            wrong_answers=5,
            skipped_answers=0,
            percentage=Decimal("-25"),
            time_taken_seconds=300,
            accuracy=Decimal("0"),
            status="submitted",
        ))
        db.session.flush()
        for question_id in range(1, 6):
            db.session.add(Question(
                id=question_id,
                subject_id=1,
                topic_id=1,
                question_text=f"प्रश्न {question_id}",
                correct_option="A",
                marks=Decimal("1"),
            ))
            db.session.add(TestAnswer(
                id=question_id,
                attempt_id=1,
                question_id=question_id,
                selected_option="B",
                correct_option="A",
                is_correct=False,
                marks_obtained=Decimal("-0.25"),
                time_taken_seconds=60,
            ))
        db.session.commit()

        response = self.client.post(
            "/api/student/ai/chat",
            json={"message": "माझे कोणते विषय कमजोर आहेत?"},
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("मराठी – व्याकरण", response.get_json()["data"]["answer"])
        self.assertIn("0.0%", response.get_json()["data"]["answer"])

    def test_transliterated_math_weak_subject_query_uses_student_performance(self):
        self._add_performance_attempt(12, 2, 2, 1)

        response = self.client.post(
            "/api/student/ai/chat",
            json={"message": "maza math weak ahe ka?"},
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        answer = response.get_json()["data"]["answer"]
        self.assertIn("गणित", answer)
        self.assertIn("Accuracy: 20.0%", answer)

    def test_strong_math_subject_query_reports_actual_student_performance(self):
        self._add_performance_attempt(13, 2, 2, 5)

        response = self.client.post(
            "/api/student/ai/chat",
            json={"message": "Is my math a strong subject?"},
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        answer = response.get_json()["data"]["answer"]
        self.assertIn("मजबूत", answer)
        self.assertIn("Accuracy: 100.0%", answer)

    def test_math_arithmetic_is_deterministic_and_handles_percentages(self):
        percentage = self.client.post(
            "/api/student/ai/chat",
            json={"message": "What is 25% of 200?"},
            headers=self.student_headers,
        )
        addition = self.client.post(
            "/api/student/ai/chat",
            json={"message": "What is 12 + 8?"},
            headers=self.student_headers,
        )

        self.assertEqual(percentage.status_code, 200)
        self.assertIn("= 50.", percentage.get_json()["data"]["answer"])
        self.assertEqual(addition.status_code, 200)
        self.assertIn("= 20.", addition.get_json()["data"]["answer"])

    def test_follow_up_study_plan_uses_recent_subject_context(self):
        first = self.client.post(
            "/api/student/ai/chat",
            json={"message": "ganit kasa karu?"},
            headers=self.student_headers,
        )
        session_id = first.get_json()["data"]["session_id"]
        follow_up = self.client.post(
            "/api/student/ai/chat",
            json={
                "message": "tyasathi daily plan de",
                "session_id": session_id,
            },
            headers=self.student_headers,
        )

        self.assertEqual(follow_up.status_code, 200)
        self.assertIn("गणितासाठी", follow_up.get_json()["data"]["answer"])

    def test_transliterated_test_count_uses_student_attempt_history(self):
        self._add_performance_attempt(14, 2, 2, 4)

        response = self.client.post(
            "/api/student/ai/chat",
            json={"message": "mi kiti test dilya?"},
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("1 tests पूर्ण", response.get_json()["data"]["answer"])

    def test_pyq_request_reuses_existing_question_service(self):
        db.session.add(Question(
            id=99,
            subject_id=1,
            topic_id=1,
            exam_year=2024,
            exam_name="Police Bharti",
            question_text="नाम म्हणजे काय?",
            correct_option="A",
            explanation="नाम म्हणजे व्यक्ती, वस्तू किंवा ठिकाणाचे नाव.",
            is_pyq=True,
            is_active=True,
        ))
        db.session.commit()

        response = self.client.post(
            "/api/student/ai/chat",
            json={"message": "Show Marathi PYQ from 2024"},
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        answer = response.get_json()["data"]["answer"]
        self.assertIn("नाम म्हणजे काय?", answer)
        self.assertIn("2024", answer)

    def test_current_affairs_without_verified_material_is_honest(self):
        response = self.client.post(
            "/api/student/ai/chat",
            json={"message": "आजच्या current affairs सांगा"},
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn(
            "पडताळलेली चालू घडामोडींची माहिती",
            response.get_json()["data"]["answer"],
        )

    def test_transliterated_physical_query_reads_student_training_record(self):
        db.session.add(PhysicalTraining(
            user_id=1,
            date=date(2026, 2, 1),
            run_1600m=Decimal("480"),
            weight=Decimal("65"),
        ))
        db.session.commit()

        response = self.client.post(
            "/api/student/ai/chat",
            json={"message": "maza 1600m time kay ahe?"},
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("1600m: 480.0", response.get_json()["data"]["answer"])

    def test_unrelated_question_gets_a_scope_response(self):
        response = self.client.post(
            "/api/student/ai/chat",
            json={"message": "What is the latest weather today?"},
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("महाराष्ट्र पोलीस भरती", response.get_json()["data"]["answer"])

    def test_english_preparation_question_gets_a_study_plan(self):
        response = self.client.post(
            "/api/student/ai/chat",
            json={"message": "How to prepare for Police Bharti?"},
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("अभ्यास आराखडा", response.get_json()["data"]["answer"])

    def test_invalid_and_empty_messages_are_rejected(self):
        whitespace = self.client.post(
            "/api/student/ai/chat",
            json={"message": "   "},
            headers=self.student_headers,
        )
        missing = self.client.post(
            "/api/student/ai/chat",
            json={},
            headers=self.student_headers,
        )
        too_long = self.client.post(
            "/api/student/ai/chat",
            json={"message": "अ" * 2001},
            headers=self.student_headers,
        )
        non_string = self.client.post(
            "/api/student/ai/chat",
            json={"message": 123},
            headers=self.student_headers,
        )

        self.assertEqual(whitespace.status_code, 422)
        self.assertEqual(missing.status_code, 422)
        self.assertEqual(too_long.status_code, 422)
        self.assertEqual(non_string.status_code, 422)

    def test_malformed_json_is_rejected(self):
        response = self.client.post(
            "/api/student/ai/chat",
            data="{",
            content_type="application/json",
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 400)

    def test_unknown_user_supplied_fields_are_rejected(self):
        response = self.client.post(
            "/api/student/ai/chat",
            json={
                "message": "पोलीस भरतीची तयारी",
                "user_id": 2,
            },
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 422)

    def test_chat_history_can_be_deleted_for_current_student(self):
        self.client.post(
            "/api/student/ai/chat",
            json={"message": "पोलीस भरतीची तयारी"},
            headers=self.student_headers,
        )

        response = self.client.delete(
            "/api/student/ai/history",
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["deleted_sessions"], 1)
        self.assertEqual(
            AIChatSession.query.filter_by(user_id=1).count(),
            0,
        )
        self.assertEqual(AIChatMessage.query.count(), 0)

    def test_student_role_and_authentication_are_required(self):
        self.assertEqual(
            self.client.post(
                "/api/student/ai/chat",
                json={"message": "पोलीस भरती"},
            ).status_code,
            401,
        )
        self.assertEqual(
            self.client.post(
                "/api/student/ai/chat",
                json={"message": "पोलीस भरती"},
                headers=self.admin_headers,
            ).status_code,
            403,
        )

    def test_invalid_or_foreign_session_ids_cannot_be_deleted(self):
        created = self.client.post(
            "/api/student/ai/chat",
            json={"message": "पोलीस भरतीची तयारी"},
            headers=self.student_headers,
        )
        session_id = created.get_json()["data"]["session_id"]

        malformed = self.client.delete(
            "/api/student/ai/history?session_id=not-a-uuid",
            headers=self.student_headers,
        )
        foreign = self.client.delete(
            f"/api/student/ai/history?session_id={session_id}",
            headers=self.other_student_headers,
        )

        self.assertEqual(malformed.status_code, 400)
        self.assertEqual(foreign.status_code, 404)
        self.assertEqual(AIChatSession.query.filter_by(user_id=1).count(), 1)


if __name__ == "__main__":
    unittest.main()
