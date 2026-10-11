import logging
import smtplib
import unittest
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import Notification, User
from app.services.email_service import EmailService
from app.services.email_templates import notification_email, safe_application_link
from app.services.notification_service import NotificationService


class FakeSMTP:
    messages = []

    def __init__(self, *args, **kwargs):
        self.args = args
        self.kwargs = kwargs

    def __enter__(self):
        return self

    def __exit__(self, *_args):
        return False

    def ehlo(self):
        return None

    def starttls(self):
        return None

    def login(self, username, password):
        return None

    def send_message(self, message):
        self.messages.append(message)


class EmailNotificationTest(unittest.TestCase):
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
            User(id=1, name="Student One", email="one@example.test",
                 password_hash="hash", role="student", is_active=True),
            User(id=2, name="Admin", email="admin@example.test",
                 password_hash="hash", role="admin", is_active=True),
            User(id=3, name="Inactive Student", email="inactive@example.test",
                 password_hash="hash", role="student", is_active=False),
            User(id=4, name="No Email", email="",
                 password_hash="hash", role="student", is_active=True),
        ])
        db.session.commit()
        FakeSMTP.messages.clear()
        self.app.config.update(
            MAIL_ENABLED=True,
            MAIL_HOST="smtp.example.test",
            MAIL_PORT=587,
            MAIL_USERNAME="mailer@example.test",
            MAIL_PASSWORD="password-secret",
            MAIL_USE_TLS=True,
            MAIL_FROM="notifications@example.test",
            MAIL_TIMEOUT=3,
            APP_NAME="Police Bharti Platform",
            FRONTEND_BASE_URL="https://app.example.test",
        )

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def _headers(self, user_id=1):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    def test_email_disabled_does_not_send(self):
        self.app.config["MAIL_ENABLED"] = False
        with patch("app.services.email_service.smtplib.SMTP") as smtp:
            self.assertFalse(EmailService.send_notification(
                "one@example.test", "TEST", "A test", "Ready"
            ))
        smtp.assert_not_called()

    def test_enabled_email_sends_multipart_message(self):
        with patch("app.services.email_service.smtplib.SMTP", FakeSMTP):
            self.assertTrue(EmailService.send_notification(
                "one@example.test", "TEST", "History test", "A new test is ready.",
                "https://app.example.test/student/tests/4",
            ))
        message = FakeSMTP.messages[-1]
        self.assertEqual(message["To"], "one@example.test")
        self.assertIn("History test", message["Subject"])
        self.assertTrue(message.is_multipart())
        self.assertIn("A new test is ready.", message.get_body(preferencelist=("plain",)).get_content())
        self.assertIn("text/html", message.get_body(preferencelist=("html",)).get_content_type())

    def test_smtp_failure_does_not_fail_or_rollback_notification(self):
        with patch("app.services.email_service.smtplib.SMTP", side_effect=TimeoutError("secret detail")):
            rows = NotificationService.notify_students_about_test(
                "Available", "A test is ready.", 12, student_ids=[1]
            )
        self.assertEqual(len(rows), 1)
        self.assertEqual(Notification.query.count(), 1)

    def test_invalid_recipient_is_handled_safely(self):
        with patch("app.services.email_service.smtplib.SMTP") as smtp:
            self.assertFalse(EmailService.send_notification(
                "javascript:bad@example.test", "SYSTEM", "Title", "Message"
            ))
        smtp.assert_not_called()

    def test_test_notification_email_template(self):
        content = notification_email("TEST", "Test title", "Test message", "/student/tests")
        self.assertEqual(content["subject"], "नवीन चाचणी उपलब्ध - Test title")
        self.assertIn("Test message", content["text"])

    def test_study_material_notification_email_template(self):
        content = notification_email("STUDY_MATERIAL", "PDF title", "PDF ready")
        self.assertEqual(content["subject"], "नवीन अभ्यास साहित्य उपलब्ध - PDF title")
        self.assertIn("PDF ready", content["text"])

    def test_video_notification_email_template(self):
        content = notification_email("VIDEO", "Video title", "Video ready")
        self.assertEqual(content["subject"], "नवीन अभ्यास व्हिडिओ उपलब्ध - Video title")
        self.assertIn("Video ready", content["text"])

    def test_result_notification_email_template_has_no_sensitive_data(self):
        content = notification_email(
            "RESULT", "History test", "Your result is available.",
            "https://app.example.test/student/tests/4/result/9",
        )
        self.assertEqual(content["subject"], "चाचणी निकाल उपलब्ध - History test")
        self.assertIn("Your result is available.", content["text"])
        self.assertNotIn("password", content["text"].lower())
        self.assertNotIn("jwt", content["text"].lower())

    def test_admin_announcement_email_template(self):
        content = notification_email("ANNOUNCEMENT", "Notice", "Read this")
        self.assertEqual(content["subject"], "Notice")
        self.assertIn("Read this", content["text"])

    def test_repeated_result_get_does_not_send_duplicate_email(self):
        with patch("app.services.email_service.smtplib.SMTP", FakeSMTP):
            NotificationService.notify_student_about_result(
                1, "Result", "Your result is ready.", 91
            )
        self.assertEqual(len(FakeSMTP.messages), 1)
        first = self.client.get("/api/student/notifications", headers=self._headers())
        second = self.client.get("/api/student/notifications", headers=self._headers())
        self.assertEqual(first.status_code, 200)
        self.assertEqual(second.status_code, 200)
        self.assertEqual(len(FakeSMTP.messages), 1)

    def test_inactive_students_do_not_receive_email(self):
        with patch("app.services.email_service.smtplib.SMTP", FakeSMTP):
            result = NotificationService.send_admin_announcement(
                "Update", "A platform update.", "ALL_STUDENTS"
            )
        self.assertEqual(result["recipient_count"], 2)
        self.assertEqual({message["To"] for message in FakeSMTP.messages}, {
            "one@example.test"
        })

    def test_missing_email_does_not_break_notification(self):
        with patch("app.services.email_service.smtplib.SMTP", FakeSMTP):
            rows = NotificationService.notify_students_about_test(
                "Available", "Ready", 14, student_ids=[1, 4]
            )
        self.assertEqual(len(rows), 2)
        self.assertEqual(Notification.query.count(), 2)
        self.assertEqual([message["To"] for message in FakeSMTP.messages], [
            "one@example.test"
        ])

    def test_credentials_are_not_exposed_in_failure_logs(self):
        secret = "password-secret"
        with self.assertLogs("app.services.email_service", level=logging.ERROR) as captured:
            with patch(
                "app.services.email_service.smtplib.SMTP",
                side_effect=smtplib.SMTPAuthenticationError(
                    535, secret.encode()
                ),
            ):
                self.assertFalse(EmailService.send_notification(
                    "one@example.test", "SYSTEM", "Title", "Message"
                ))
        self.assertNotIn(secret, "\n".join(captured.output))

    def test_html_values_are_escaped(self):
        content = notification_email(
            "SYSTEM", "<script>alert(1)</script>", '<img src=x onerror="bad()">',
            "https://app.example.test/student/tests",
        )
        self.assertNotIn("<script>", content["html"])
        self.assertNotIn("<img", content["html"])
        self.assertIn("&lt;script&gt;", content["html"])
        self.assertIn("&lt;img", content["html"])

    def test_links_require_known_http_application_origin_and_route(self):
        self.assertIsNone(safe_application_link("javascript:alert(1)", "/student/tests"))
        self.assertIsNone(safe_application_link("https://app.example.test", "//evil.test"))
        self.assertEqual(
            safe_application_link("https://app.example.test/", "/student/tests/7"),
            "https://app.example.test/student/tests/7",
        )

    def test_duplicate_automatic_result_event_sends_once(self):
        with patch("app.services.email_service.smtplib.SMTP", FakeSMTP):
            first = NotificationService.notify_student_about_result(
                1, "Result", "Ready", 92
            )
            second = NotificationService.notify_student_about_result(
                1, "Result", "Ready", 92
            )
        self.assertEqual(len(first), 1)
        self.assertEqual(second, [])
        self.assertEqual(len(FakeSMTP.messages), 1)
        self.assertEqual(Notification.query.count(), 1)

    def test_admin_announcement_sends_only_to_in_app_recipients(self):
        with patch("app.services.email_service.smtplib.SMTP", FakeSMTP):
            response = self.client.post(
                "/api/admin/notifications",
                headers=self._headers(2),
                json={"title": "Notice", "message": "Read this.",
                      "recipient_type": "ALL_STUDENTS"},
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["data"]["recipient_count"], 2)
        self.assertEqual(Notification.query.count(), 2)
        self.assertEqual([message["To"] for message in FakeSMTP.messages], [
            "one@example.test"
        ])

    def test_admin_announcement_succeeds_when_smtp_fails(self):
        with patch(
            "app.services.email_service.smtplib.SMTP",
            side_effect=TimeoutError("provider failure"),
        ):
            response = self.client.post(
                "/api/admin/notifications",
                headers=self._headers(2),
                json={"title": "Notice", "message": "Read this.",
                      "recipient_type": "ALL_STUDENTS"},
            )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Notification.query.count(), 2)

    def test_email_template_rejects_untrusted_link_schemes_and_paths(self):
        content = notification_email(
            "SYSTEM", "Notice", "Read this", "javascript:alert(1)"
        )
        self.assertNotIn("href=", content["html"])
        unknown_route = notification_email(
            "SYSTEM", "Notice", "Read this", "https://evil.test/admin"
        )
        self.assertNotIn("href=", unknown_route["html"])


if __name__ == "__main__":
    unittest.main()
