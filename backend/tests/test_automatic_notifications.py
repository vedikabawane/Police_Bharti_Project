import unittest
from datetime import datetime
from types import SimpleNamespace
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import (
    Notification, Question, StudyMaterial, Subject, Test, TestAnswer, TestAttempt,
    TestQuestion, Topic, User, Video,
)
from app.repositories.test_repository import TestRepository
from app.services.notification_service import NotificationService
from app.services.study_material_service import StudyMaterialService
from app.services.test_service import TestService
from app.services.video_service import VideoService


class AutomaticNotificationsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()
        cls.app.config.update(TESTING=True)
        cls.client = cls.app.test_client()
        with cls.app.app_context():
            db.create_all()

    def setUp(self):
        self.context = self.app.app_context()
        self.context.push()
        db.drop_all()
        db.create_all()
        db.session.add_all([
            User(id=1, name="Student", email="student@test", password_hash="x",
                 role="student", is_active=True),
            User(id=2, name="Inactive student", email="inactive@test", password_hash="x",
                 role="student", is_active=False),
            User(id=3, name="Admin", email="admin@test", password_hash="x",
                 role="admin", is_active=True),
        ])
        db.session.add(Subject(id=1, name="History", is_active=True))
        db.session.add(Topic(id=1, subject_id=1, name="Ancient", is_active=True))
        db.session.add(Question(
            id=1, subject_id=1, topic_id=1, question_text="Question",
            correct_option="A", difficulty="easy", marks=1, is_active=True,
        ))
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    @staticmethod
    def _create_test(data, questions):
        test_id = (db.session.query(db.func.max(Test.id)).scalar() or 0) + 1
        test = Test(id=test_id, **data)
        db.session.add(test)
        db.session.flush()
        for index, question in enumerate(questions, start=1):
            question_row_id = (db.session.query(db.func.max(TestQuestion.id)).scalar() or 0) + 1
            db.session.add(TestQuestion(
                id=question_row_id, test_id=test.id, question_id=question.id,
                question_order=index,
            ))
        db.session.commit()
        return test

    @staticmethod
    def _notifications(kind=None, related_id=None):
        query = Notification.query
        if kind:
            query = query.filter_by(notification_type=kind)
        if related_id:
            query = query.filter_by(related_entity_id=related_id)
        return query.order_by(Notification.user_id).all()

    def test_test_notifies_only_when_created_active_or_activated(self):
        payload = {
            "title": "History practice", "test_type": "SUBJECT", "subject_id": 1,
            "duration_minutes": 30, "question_ids": [1], "is_active": True,
        }
        with patch.object(TestRepository, "create_admin_test", side_effect=self._create_test):
            active = TestService.create_admin_test(payload)
        rows = self._notifications("TEST", active.id)
        self.assertEqual([row.user_id for row in rows], [1])
        self.assertEqual(rows[0].title, "नवीन चाचणी उपलब्ध")
        self.assertEqual(rows[0].message, "नवीन चाचणी उपलब्ध आहे: History practice")
        self.assertEqual(rows[0].related_entity_type, "TEST")

        inactive_payload = {**payload, "title": "Draft", "is_active": False}
        with patch.object(TestRepository, "create_admin_test", side_effect=self._create_test):
            inactive = TestService.create_admin_test(inactive_payload)
        self.assertEqual(self._notifications("TEST", inactive.id), [])
        TestService.update_admin_test_status(inactive.id, True)
        TestService.update_admin_test_status(inactive.id, True)
        self.assertEqual(len(self._notifications("TEST", inactive.id)), 1)

    def test_test_notification_error_does_not_fail_successful_creation(self):
        payload = {
            "title": "History practice", "test_type": "SUBJECT", "subject_id": 1,
            "duration_minutes": 30, "question_ids": [1], "is_active": True,
        }
        with patch.object(TestRepository, "create_admin_test", side_effect=self._create_test), \
                patch.object(NotificationService, "notify_students_about_test",
                             side_effect=RuntimeError("notification database unavailable")):
            test = TestService.create_admin_test(payload)
        self.assertEqual(test.title, "History practice")
        self.assertIsNotNone(db.session.get(Test, test.id))
        self.assertEqual(Notification.query.count(), 0)

    def test_study_material_and_video_notify_once_on_activation(self):
        material = StudyMaterial(
            id=10, subject_id=1, topic_id=1, title="Grammar PDF",
            storage_key="material.pdf", original_filename="material.pdf",
            mime_type="application/pdf", file_size_bytes=10, is_active=False,
        )
        video = Video(
            id=20, subject_id=1, topic_id=1, title="History video",
            video_url="https://example.test/video", is_active=False,
        )
        db.session.add_all([material, video])
        db.session.commit()
        self.assertEqual(self._notifications("STUDY_MATERIAL", material.id), [])
        self.assertEqual(self._notifications("VIDEO", video.id), [])

        StudyMaterialService.update_status(material.id, True)
        StudyMaterialService.update_status(material.id, True)
        VideoService.update_status(video.id, True)
        VideoService.update_status(video.id, True)
        self.assertEqual([row.user_id for row in self._notifications("STUDY_MATERIAL", material.id)], [1])
        self.assertEqual([row.user_id for row in self._notifications("VIDEO", video.id)], [1])
        self.assertEqual(self._notifications("STUDY_MATERIAL", material.id)[0].title,
                         "नवीन अभ्यास साहित्य उपलब्ध")
        self.assertEqual(self._notifications("VIDEO", video.id)[0].message,
                         "नवीन अभ्यास व्हिडिओ उपलब्ध आहे: History video")

        # An unrelated edit to an already visible video does not resend.
        VideoService.update(video.id, {"title": "Renamed video"})
        self.assertEqual(len(self._notifications("VIDEO", video.id)), 1)

        stored = SimpleNamespace(
            storage_key="created.pdf", original_filename="created.pdf",
            mime_type="application/pdf", file_size_bytes=10,
        )

        def create_material(data):
            created = StudyMaterial(id=11, **data)
            db.session.add(created)
            db.session.commit()
            return created

        with patch("app.services.study_material_service.save_study_material_pdf",
                   return_value=stored), \
                patch("app.repositories.study_material_repository.StudyMaterialRepository.create",
                      side_effect=create_material):
            created_material = StudyMaterialService.create(
                {"subject_id": 1, "topic_id": 1, "title": "Created PDF"}, None
            )
        self.assertEqual(len(self._notifications("STUDY_MATERIAL", created_material.id)), 1)

        def create_video(subject_id, topic_id, data):
            created = Video(id=21, subject_id=subject_id, topic_id=topic_id, **data)
            db.session.add(created)
            db.session.commit()
            return created

        with patch("app.repositories.video_repository.VideoRepository.create",
                   side_effect=create_video):
            created_video = VideoService.create(1, 1, {
                "title": "Created video", "video_url": "https://example.test/created",
            })
        self.assertEqual(len(self._notifications("VIDEO", created_video.id)), 1)

        with patch("app.services.study_material_service.save_study_material_pdf",
                   return_value=stored), \
                patch("app.services.study_material_service.delete_study_material_pdf"), \
                patch("app.repositories.study_material_repository.StudyMaterialRepository.create",
                      side_effect=RuntimeError("database unavailable")):
            with self.assertRaises(RuntimeError):
                StudyMaterialService.create(
                    {"subject_id": 1, "topic_id": 1, "title": "Failed PDF"}, None
                )
        with patch("app.repositories.video_repository.VideoRepository.create",
                   side_effect=RuntimeError("database unavailable")):
            with self.assertRaises(RuntimeError):
                VideoService.create(1, 1, {
                    "title": "Failed video", "video_url": "https://example.test/fail",
                })
        self.assertEqual(Notification.query.count(), 4)

    def test_finalized_attempt_notifies_only_its_student_once(self):
        test = Test(
            id=30, title="Final exam", test_type="subject", subject_id=1,
            duration_minutes=30, total_questions=1, total_marks=1,
            is_active=True,
        )
        db.session.add(test)
        db.session.flush()
        db.session.add(TestQuestion(id=30, test_id=test.id, question_id=1, question_order=1))
        attempt = TestAttempt(
            id=40, test_id=test.id, student_id=1, started_at=datetime.utcnow(),
            status="in_progress",
        )
        db.session.add(attempt)
        db.session.commit()

        def create_answer(**data):
            answer_id = (db.session.query(db.func.max(TestAnswer.id)).scalar() or 0) + 1
            answer = TestAnswer(id=answer_id, **data)
            db.session.add(answer)
            return answer

        with patch.object(TestRepository, "create_answer", side_effect=create_answer):
            TestService._finalize_attempt(attempt)
        TestService.get_attempt_result(attempt.id, student_id=1)
        rows = self._notifications("RESULT", attempt.id)
        self.assertEqual([row.user_id for row in rows], [1])
        self.assertEqual(rows[0].related_entity_type, "RESULT")
        self.assertEqual(rows[0].title, "चाचणी निकाल उपलब्ध")
        self.assertEqual(rows[0].message, "तुमचा चाचणी निकाल उपलब्ध आहे: Final exam")

    def test_repeated_automatic_helper_call_is_idempotent(self):
        first = NotificationService.notify_students_about_video(
            "New video", "A video is ready.", 77,
        )
        second = NotificationService.notify_students_about_video(
            "New video", "A video is ready.", 77,
        )
        self.assertEqual(len(first), 1)
        self.assertEqual(second, [])
        self.assertEqual(len(self._notifications("VIDEO", 77)), 1)

    def test_student_cannot_trigger_admin_publish_or_announcement_events(self):
        token = create_access_token(identity="1")
        headers = {"Authorization": f"Bearer {token}"}
        responses = [
            self.client.post("/api/admin/tests", headers=headers, json={}),
            self.client.patch("/api/admin/tests/1/status", headers=headers,
                              json={"is_active": True}),
            self.client.post("/api/admin/videos", headers=headers, json={}),
            self.client.patch("/api/admin/videos/1/status", headers=headers,
                              json={"is_active": True}),
            self.client.post("/api/admin/notifications", headers=headers,
                             json={"title": "x", "message": "x",
                                   "recipient_type": "ALL_STUDENTS"}),
        ]
        self.assertTrue(all(response.status_code == 403 for response in responses))
        self.assertEqual(Notification.query.count(), 0)


if __name__ == "__main__":
    unittest.main()
