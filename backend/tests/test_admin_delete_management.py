import unittest
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import (
    Notification,
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


class AdminDeleteManagementTest(unittest.TestCase):
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
            User(id=1, name="Student", email="student@delete.test", password_hash="secret", role="student", is_active=True),
            User(id=2, name="Admin", email="admin@delete.test", password_hash="secret", role="admin", is_active=True),
            User(id=3, name="Inactive Admin", email="inactive@delete.test", password_hash="secret", role="admin", is_active=False),
        ])
        db.session.add_all([
            Subject(id=1, name="Referenced Subject", is_active=True),
            Subject(id=2, name="Unused Subject", is_active=True),
            Subject(id=3, name="Second Subject", is_active=True),
        ])
        db.session.add_all([
            Topic(id=1, subject_id=1, name="Referenced Topic", is_active=True),
            Topic(id=2, subject_id=2, name="Unused Topic", is_active=True),
        ])
        db.session.add_all([
            Question(id=1, subject_id=1, topic_id=1, question_text="Referenced question", correct_option="A", difficulty="easy", marks=1, negative_marks=0, is_active=True),
            Question(id=2, subject_id=2, topic_id=2, question_text="Unused question", correct_option="A", difficulty="easy", marks=1, negative_marks=0, is_active=True),
        ])
        db.session.add_all([
            QuestionOption(id=1, question_id=1, option_label="A", option_text="Answer"),
            QuestionOption(id=2, question_id=2, option_label="A", option_text="Answer"),
        ])
        db.session.add(Test(
            id=1, title="History test", test_type="SUBJECT", subject_id=1,
            duration_minutes=30, total_questions=1, total_marks=1, is_active=True,
        ))
        db.session.flush()
        db.session.add_all([
            TestQuestion(id=1, test_id=1, question_id=1, question_order=1),
            TestAttempt(id=1, test_id=1, student_id=1, status="submitted", score=1),
        ])
        db.session.flush()
        db.session.add(TestAnswer(
            id=1, attempt_id=1, question_id=1, selected_option="A",
            correct_option="A", is_correct=True, marks_obtained=1,
        ))
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    @staticmethod
    def _headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    def _delete(self, path, user_id=2):
        return self.client.delete(path, headers=self._headers(user_id))

    def test_delete_routes_require_an_active_admin(self):
        for path in ("/api/subjects/1", "/api/topics/1", "/api/questions/1", "/api/admin/tests/1"):
            with self.subTest(path=path):
                self.assertEqual(self.client.delete(path).status_code, 401)
                self.assertEqual(self._delete(path, user_id=1).status_code, 403)
                self.assertEqual(self._delete(path, user_id=3).status_code, 403)

    def test_subject_and_topic_with_dependents_are_deactivated(self):
        subject_response = self._delete("/api/subjects/1")
        topic_response = self._delete("/api/topics/1")

        self.assertEqual(subject_response.status_code, 200)
        self.assertTrue(subject_response.get_json()["data"]["archived"])
        self.assertFalse(db.session.get(Subject, 1).is_active)
        self.assertIsNotNone(db.session.get(Topic, 1))
        self.assertEqual(topic_response.status_code, 200)
        self.assertTrue(topic_response.get_json()["data"]["archived"])
        self.assertFalse(db.session.get(Topic, 1).is_active)
        self.assertIsNotNone(db.session.get(Question, 1))

    def test_unused_subject_topic_and_question_can_be_deleted(self):
        self.assertFalse(self._delete("/api/questions/2").get_json()["data"]["archived"])
        self.assertIsNone(db.session.get(Question, 2))
        self.assertFalse(self._delete("/api/topics/2").get_json()["data"]["archived"])
        self.assertIsNone(db.session.get(Topic, 2))
        self.assertFalse(self._delete("/api/subjects/2").get_json()["data"]["archived"])
        self.assertIsNone(db.session.get(Subject, 2))

    def test_question_with_test_and_attempt_history_is_deactivated(self):
        response = self._delete("/api/questions/1")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["data"]["archived"])
        self.assertFalse(db.session.get(Question, 1).is_active)
        self.assertIsNotNone(db.session.get(TestQuestion, 1))
        self.assertIsNotNone(db.session.get(TestAnswer, 1))
        self.assertIsNotNone(db.session.get(TestAttempt, 1))

    def test_test_with_attempt_history_is_deactivated_and_history_is_kept(self):
        response = self._delete("/api/admin/tests/1")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["data"]["archived"])
        self.assertFalse(db.session.get(Test, 1).is_active)
        self.assertIsNotNone(db.session.get(TestAttempt, 1))
        self.assertIsNotNone(db.session.get(TestAnswer, 1))
        self.assertIsNotNone(db.session.get(TestQuestion, 1))

    def test_unused_test_can_be_permanently_deleted(self):
        db.session.add(Test(
            id=2, title="Unused test", test_type="MIXED", duration_minutes=15,
            total_questions=0, total_marks=0, is_active=True,
        ))
        db.session.commit()

        response = self._delete("/api/admin/tests/2")

        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.get_json()["data"]["archived"])
        self.assertIsNone(db.session.get(Test, 2))

    def test_test_with_linked_notification_is_deactivated(self):
        db.session.add(Notification(
            id=1, user_id=1, title="New test", message="History test is available",
            notification_type="TEST", related_entity_type="TEST", related_entity_id=1,
        ))
        db.session.commit()
        response = self._delete("/api/admin/tests/1")

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["data"]["archived"])
        self.assertFalse(db.session.get(Test, 1).is_active)
        self.assertIsNotNone(db.session.get(Notification, 1))


if __name__ == "__main__":
    unittest.main()
