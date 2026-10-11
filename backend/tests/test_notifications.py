import unittest
from datetime import datetime, timedelta
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import Notification, User
from app.services.notification_service import NotificationService


class NotificationApiTest(unittest.TestCase):
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
            User(id=1, name="Student One", email="one@test", password_hash="secret-one",
                 role="student", is_active=True),
            User(id=2, name="Admin One", email="admin@test", password_hash="secret-admin",
                 role="admin", is_active=True),
            User(id=3, name="Inactive Admin", email="inactive-admin@test",
                 password_hash="secret-inactive", role="admin", is_active=False),
            User(id=4, name="Student Two", email="two@test", password_hash="secret-two",
                 role="student", is_active=True),
            User(id=5, name="Inactive Student", email="inactive-student@test",
                 password_hash="secret-student", role="student", is_active=False),
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
    def _add_notification(user_id, title, is_read=False, related_id=None):
        notification = Notification(
            user_id=user_id,
            title=title,
            message=f"Message for {title}",
            notification_type="ANNOUNCEMENT",
            related_entity_type="TEST" if related_id else None,
            related_entity_id=related_id,
            is_read=is_read,
            read_at=datetime.utcnow() if is_read else None,
        )
        db.session.add(notification)
        db.session.commit()
        return notification

    def test_student_can_list_only_own_notifications_and_private_data_is_omitted(self):
        own = self._add_notification(1, "Own notification", related_id=42)
        self._add_notification(4, "Other student's notification")
        response = self.client.get(
            "/api/student/notifications", headers=self._headers(1)
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual([item["id"] for item in data["notifications"]], [own.id])
        self.assertEqual(set(data["notifications"][0]), {
            "id", "title", "message", "notification_type", "related_entity_type",
            "related_entity_id", "is_read", "created_at", "read_at",
        })
        self.assertNotIn("email", str(data))
        self.assertNotIn("password", str(data))
        self.assertNotIn("Other student's notification", str(data))

    def test_student_cannot_read_or_mark_another_students_notification(self):
        other = self._add_notification(4, "Private notification")
        response = self.client.patch(
            f"/api/student/notifications/{other.id}/read", headers=self._headers(1)
        )
        self.assertEqual(response.status_code, 404)
        self.assertFalse(db.session.get(Notification, other.id).is_read)

    def test_unread_count_and_mark_one_read_sets_read_at(self):
        notification = self._add_notification(1, "Unread")
        self._add_notification(1, "Already read", is_read=True)
        count = self.client.get(
            "/api/student/notifications/unread-count", headers=self._headers(1)
        )
        self.assertEqual(count.status_code, 200)
        self.assertEqual(count.get_json()["data"]["unread_count"], 1)
        marked = self.client.patch(
            f"/api/student/notifications/{notification.id}/read",
            headers=self._headers(1),
        )
        self.assertEqual(marked.status_code, 200)
        self.assertTrue(marked.get_json()["data"]["notification"]["is_read"])
        self.assertIsNotNone(db.session.get(Notification, notification.id).read_at)
        self.assertEqual(marked.get_json()["data"]["unread_count"], 0)

    def test_mark_all_read_is_limited_to_current_student(self):
        own = self._add_notification(1, "Own unread")
        other = self._add_notification(4, "Other unread")
        response = self.client.patch(
            "/api/student/notifications/read-all", headers=self._headers(1)
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["updated_count"], 1)
        self.assertTrue(db.session.get(Notification, own.id).is_read)
        self.assertFalse(db.session.get(Notification, other.id).is_read)

    def test_pagination_and_unread_only_filter(self):
        first = self._add_notification(1, "First")
        second = self._add_notification(1, "Second")
        third = self._add_notification(1, "Third", is_read=True)
        first.created_at = datetime.utcnow() - timedelta(minutes=3)
        second.created_at = datetime.utcnow() - timedelta(minutes=2)
        third.created_at = datetime.utcnow() - timedelta(minutes=1)
        db.session.commit()

        page = self.client.get(
            "/api/student/notifications?page=1&per_page=1",
            headers=self._headers(1),
        ).get_json()["data"]
        self.assertEqual([row["id"] for row in page["notifications"]], [third.id])
        self.assertEqual(page["pagination"], {
            "page": 1, "per_page": 1, "total": 3, "pages": 3,
        })
        unread = self.client.get(
            "/api/student/notifications?unread_only=true",
            headers=self._headers(1),
        ).get_json()["data"]
        self.assertEqual({row["id"] for row in unread["notifications"]}, {first.id, second.id})
        self.assertTrue(all(not row["is_read"] for row in unread["notifications"]))

    def test_admin_can_send_one_announcement_per_active_student(self):
        response = self.client.post(
            "/api/admin/notifications",
            headers=self._headers(2),
            json={
                "title": "Exam update",
                "message": "New test information is available.",
                "recipient_type": "ALL_STUDENTS",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["data"]["recipient_count"], 2)
        self.assertEqual(Notification.query.count(), 2)
        self.assertEqual(
            {row.user_id for row in Notification.query.all()}, {1, 4}
        )
        self.assertEqual(
            {row.notification_type for row in Notification.query.all()},
            {"ANNOUNCEMENT"},
        )

    def test_inactive_admin_and_non_admin_cannot_send(self):
        path = "/api/admin/notifications"
        payload = {"title": "Title", "message": "Message", "recipient_type": "ALL_STUDENTS"}
        self.assertEqual(self.client.post(path, json=payload).status_code, 401)
        self.assertEqual(self.client.post(path, headers=self._headers(1), json=payload).status_code, 403)
        self.assertEqual(self.client.post(path, headers=self._headers(3), json=payload).status_code, 403)

    def test_invalid_recipient_and_invalid_content_are_rejected(self):
        path = "/api/admin/notifications"
        headers = self._headers(2)
        invalid_recipient = self.client.post(path, headers=headers, json={
            "title": "Title", "message": "Message", "recipient_type": "ADMINS",
        })
        self.assertEqual(invalid_recipient.status_code, 422)
        unsupported_recipients = self.client.post(path, headers=headers, json={
            "title": "Title", "message": "Message", "recipient_type": "ALL_STUDENTS",
            "student_ids": [999],
        })
        self.assertEqual(unsupported_recipients.status_code, 422)
        invalid_title = self.client.post(path, headers=headers, json={
            "title": "  ", "message": "Message", "recipient_type": "ALL_STUDENTS",
        })
        self.assertEqual(invalid_title.status_code, 422)
        too_long = self.client.post(path, headers=headers, json={
            "title": "T" * 201, "message": "Message", "recipient_type": "ALL_STUDENTS",
        })
        self.assertEqual(too_long.status_code, 422)
        self.assertEqual(Notification.query.count(), 0)

    def test_helper_stores_related_entity_and_deduplicates_recipients(self):
        rows = NotificationService.notify_students_about_test(
            "Test available", "A new practice test is ready.", 73,
            student_ids=[1, 1, 4],
        )
        self.assertEqual(len(rows), 2)
        self.assertEqual(Notification.query.count(), 2)
        self.assertEqual({row.user_id for row in rows}, {1, 4})
        self.assertTrue(all(row.notification_type == "TEST" for row in rows))
        self.assertTrue(all(row.related_entity_type == "TEST" for row in rows))
        self.assertTrue(all(row.related_entity_id == 73 for row in rows))
        with self.assertRaises(ValueError):
            NotificationService.notify_students_about_test(
                "Invalid target", "Do not send to an admin.", 73,
                student_ids=[2],
            )
        self.assertEqual(Notification.query.count(), 2)


if __name__ == "__main__":
    unittest.main()
