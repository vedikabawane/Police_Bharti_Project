import logging
import runpy
import unittest
from pathlib import Path
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config, validate_sms_config
from app.extensions import db
from app.models import Notification, SmsDelivery, User
from app.services.notification_service import NotificationService
from app.services.sms_provider import MockSmsProvider, SmsPermanentError, SmsTransientError
from app.services.sms_service import SmsService


class SmsNotificationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()
        cls.app.config.update(
            TESTING=True,
            JWT_SECRET_KEY="sms-notification-test-secret",
            SMS_ENABLED=False,
            SMS_PROVIDER="",
        )
        cls.client = cls.app.test_client()
        with cls.app.app_context():
            db.create_all()

    def setUp(self):
        self.context = self.app.app_context()
        self.context.push()
        db.drop_all()
        db.create_all()
        db.session.add_all([
            User(id=1, name="Opted in", email="one@test", mobile="9876543210",
                 password_hash="x", role="student", is_active=True,
                 sms_notifications_enabled=True),
            User(id=2, name="Not opted in", email="two@test", mobile="9876543211",
                 password_hash="x", role="student", is_active=True),
            User(id=3, name="Inactive", email="three@test", mobile="9876543212",
                 password_hash="x", role="student", is_active=False,
                 sms_notifications_enabled=True),
            User(id=4, name="Invalid number", email="four@test", mobile="1234567890",
                 password_hash="x", role="student", is_active=True,
                 sms_notifications_enabled=True),
            User(id=5, name="Admin", email="admin@test", mobile="9876543213",
                 password_hash="x", role="admin", is_active=True,
                 sms_notifications_enabled=True),
        ])
        db.session.commit()
        self.app.config.update(SMS_ENABLED=False, SMS_PROVIDER="", SMS_MAX_ATTEMPTS=3)
        MockSmsProvider.messages.clear()
        MockSmsProvider._accepted_keys.clear()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    @staticmethod
    def headers(user_id):
        return {"Authorization": f"Bearer {create_access_token(identity=str(user_id))}"}

    def enable_mock(self):
        self.app.config.update(SMS_ENABLED=True, SMS_PROVIDER="mock", APP_ENV="testing")

    def test_sms_is_disabled_by_default_and_valid_mock_config_is_accepted(self):
        self.assertFalse(Config.SMS_ENABLED)
        validate_sms_config({"SMS_ENABLED": False})
        validate_sms_config({
            "SMS_ENABLED": True,
            "SMS_PROVIDER": "mock",
            "SMS_REQUEST_TIMEOUT": 5,
            "SMS_MAX_ATTEMPTS": 3,
            "APP_ENV": "testing",
        })
        NotificationService.notify_students_about_test("Test", "Ready", 10)
        self.assertEqual(MockSmsProvider.messages, [])
        self.assertEqual(SmsDelivery.query.count(), 0)

    def test_invalid_enabled_provider_fails_safely(self):
        secret = "provider-credential-secret"
        with self.assertRaisesRegex(ValueError, "no installed provider adapter") as raised:
            validate_sms_config({
                "SMS_ENABLED": True,
                "SMS_PROVIDER": "unknown-" + secret,
                "SMS_REQUEST_TIMEOUT": 5,
                "SMS_MAX_ATTEMPTS": 3,
                "APP_ENV": "development",
            })
        self.assertNotIn(secret, str(raised.exception))
        with self.assertRaisesRegex(ValueError, "SMS_PROVIDER is required"):
            validate_sms_config({
                "SMS_ENABLED": True,
                "SMS_PROVIDER": "",
                "SMS_REQUEST_TIMEOUT": 5,
                "SMS_MAX_ATTEMPTS": 3,
                "APP_ENV": "development",
            })

    def test_sms_migration_follows_contact_rate_limit_revision(self):
        migration_path = (
            Path(__file__).resolve().parents[1]
            / "migrations"
            / "versions"
            / "e70c8a4d2f19_add_sms_preferences_and_delivery_log.py"
        )
        migration = runpy.run_path(str(migration_path))
        self.assertEqual(migration["revision"], "e70c8a4d2f19")
        self.assertEqual(migration["down_revision"], "c5a7e2149d63")

    def test_student_can_change_only_own_opt_in_preference(self):
        response = self.client.get(
            "/api/student/notifications/preferences/sms", headers=self.headers(2)
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.get_json()["data"]["sms_enabled"])
        updated = self.client.patch(
            "/api/student/notifications/preferences/sms",
            headers=self.headers(2),
            json={"sms_enabled": True},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertTrue(db.session.get(User, 2).sms_notifications_enabled)
        self.assertTrue(db.session.get(User, 1).sms_notifications_enabled)
        forbidden_field = self.client.patch(
            "/api/student/notifications/preferences/sms",
            headers=self.headers(2),
            json={"sms_enabled": False, "user_id": 1},
        )
        self.assertEqual(forbidden_field.status_code, 422)
        self.assertTrue(db.session.get(User, 1).sms_notifications_enabled)
        self.assertEqual(self.client.get(
            "/api/student/notifications/preferences/sms", headers=self.headers(5)
        ).status_code, 403)

    def test_only_opted_in_active_student_with_valid_mobile_gets_sms(self):
        self.enable_mock()
        rows = NotificationService.notify_students_about_test(
            "History practice", "Sensitive body must not be sent", 10
        )
        self.assertEqual(len(rows), 3)
        self.assertEqual(len(MockSmsProvider.messages), 1)
        message = MockSmsProvider.messages[0]
        self.assertEqual(message["recipient"], "9876543210")
        self.assertIn("History practice", message["message"])
        self.assertNotIn("Sensitive body", message["message"])
        self.assertEqual(SmsDelivery.query.count(), 1)

    def test_duplicate_test_or_result_event_does_not_send_twice(self):
        self.enable_mock()
        first = NotificationService.notify_students_about_test("Test", "Ready", 41)
        second = NotificationService.notify_students_about_test("Test", "Ready", 41)
        result_first = NotificationService.notify_student_about_result(1, "Exam", "Score details", 52)
        result_second = NotificationService.notify_student_about_result(1, "Exam", "Score details", 52)
        self.assertEqual(len(first), 3)
        self.assertEqual(second, [])
        self.assertEqual(len(result_first), 1)
        self.assertEqual(result_second, [])
        self.assertEqual(len(MockSmsProvider.messages), 2)

    def test_admin_sms_is_explicit_and_idempotent_key_prevents_duplicate_sends(self):
        self.enable_mock()
        no_sms = self.client.post(
            "/api/admin/notifications", headers=self.headers(5),
            json={"title": "Routine", "message": "Routine", "recipient_type": "ALL_STUDENTS"},
        )
        self.assertEqual(no_sms.status_code, 201)
        self.assertEqual(MockSmsProvider.messages, [])
        key = "announcement-request-0001"
        headers = {**self.headers(5), "Idempotency-Key": key}
        payload = {
            "title": "Urgent closure", "message": "Private message body",
            "recipient_type": "ALL_STUDENTS", "send_sms": True,
        }
        first = self.client.post("/api/admin/notifications", headers=headers, json=payload)
        second = self.client.post("/api/admin/notifications", headers=headers, json=payload)
        self.assertEqual(first.status_code, 201)
        self.assertEqual(second.status_code, 201)
        self.assertEqual(len(MockSmsProvider.messages), 1)
        self.assertEqual(Notification.query.filter_by(notification_type="ANNOUNCEMENT").count(), 9)

    def test_sms_selection_requires_idempotency_key_and_admin_authorization(self):
        payload = {"title": "Important", "message": "Info", "recipient_type": "ALL_STUDENTS", "send_sms": True}
        self.assertEqual(self.client.post(
            "/api/admin/notifications", headers=self.headers(5), json=payload
        ).status_code, 422)
        self.assertEqual(self.client.post(
            "/api/admin/notifications",
            headers={**self.headers(1), "Idempotency-Key": "announcement-request-0001"},
            json=payload,
        ).status_code, 403)
        self.assertEqual(MockSmsProvider.messages, [])

    def test_transient_errors_retry_with_a_bounded_attempt_count(self):
        self.enable_mock()
        provider = MockSmsProvider()
        with patch.object(
            provider,
            "send_sms",
            side_effect=[SmsTransientError("secret provider detail", code="timeout"),
                         SmsTransientError("secret provider detail", code="timeout"), True],
        ) as send_sms, patch("app.services.sms_service.time.sleep"):
            with patch.object(SmsService, "_provider", return_value=provider):
                NotificationService.notify_students_about_test("Test", "Ready", 80)
        self.assertEqual(send_sms.call_count, 3)
        delivery = SmsDelivery.query.one()
        self.assertEqual(delivery.status, "ACCEPTED")
        self.assertEqual(delivery.attempt_count, 3)

    def test_transient_errors_stop_after_the_configured_maximum(self):
        self.enable_mock()
        provider = MockSmsProvider()
        self.app.config["SMS_MAX_ATTEMPTS"] = 2
        with patch.object(
            provider,
            "send_sms",
            side_effect=SmsTransientError("temporary"),
        ) as send_sms, patch("app.services.sms_service.time.sleep"):
            with patch.object(SmsService, "_provider", return_value=provider):
                rows = NotificationService.notify_students_about_test("Test", "Ready", 82)
        self.assertEqual(len(rows), 3)
        self.assertEqual(send_sms.call_count, 2)
        self.assertEqual(SmsDelivery.query.one().status, "FAILED")
        self.assertEqual(SmsDelivery.query.one().attempt_count, 2)

    def test_permanent_errors_are_not_retried_and_do_not_break_notification(self):
        self.enable_mock()
        provider = MockSmsProvider()
        with patch.object(provider, "send_sms", side_effect=SmsPermanentError("credential-secret")) as send_sms:
            with patch.object(SmsService, "_provider", return_value=provider):
                with self.assertLogs("app.services.sms_service", level=logging.WARNING) as logs:
                    rows = NotificationService.notify_students_about_test("Test", "Ready", 81)
        self.assertEqual(len(rows), 3)
        self.assertEqual(Notification.query.count(), 3)
        self.assertEqual(send_sms.call_count, 1)
        self.assertEqual(SmsDelivery.query.one().status, "FAILED")
        self.assertNotIn("credential-secret", "\n".join(logs.output))

    def test_provider_failure_does_not_change_in_app_result_or_leak_details(self):
        self.enable_mock()
        provider = MockSmsProvider()
        with patch.object(provider, "send_sms", side_effect=RuntimeError("api-key-secret")):
            with patch.object(SmsService, "_provider", return_value=provider):
                with self.assertLogs("app.services.sms_service", level=logging.WARNING) as logs:
                    response = self.client.post(
                        "/api/admin/notifications",
                        headers={**self.headers(5), "Idempotency-Key": "announcement-request-0099"},
                        json={"title": "Notice", "message": "Body", "recipient_type": "ALL_STUDENTS", "send_sms": True},
                    )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Notification.query.count(), 3)
        self.assertNotIn("api-key-secret", "\n".join(logs.output))
        self.assertNotIn("api-key-secret", response.get_data(as_text=True))

    def test_production_cannot_enable_the_mock_provider(self):
        with self.assertRaisesRegex(ValueError, "cannot be enabled in production"):
            validate_sms_config({
                "SMS_ENABLED": True,
                "SMS_PROVIDER": "mock",
                "SMS_REQUEST_TIMEOUT": 5,
                "SMS_MAX_ATTEMPTS": 3,
                "APP_ENV": "production",
            })


if __name__ == "__main__":
    unittest.main()
