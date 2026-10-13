import logging
import unittest
from io import StringIO
from unittest.mock import patch

from app import create_app
from app.config.config import Config
from app.logging_config import RequestContextFilter, configure_logging


class ApplicationLoggingTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with (
            patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"),
            patch.object(Config, "APP_ENV", "testing"),
            patch.object(Config, "LOG_LEVEL", "INFO"),
        ):
            cls.app = create_app()
        cls.app.config.update(TESTING=True, APP_ENV="testing")

        @cls.app.get("/__logging_test/unexpected")
        def unexpected_failure():
            raise RuntimeError(
                "password=private-pass otp=123456 ticket=private-ticket "
                "jwt=private-jwt provider=private-credential"
            )

    def capture_application_logs(self):
        root_logger = logging.getLogger()
        handler = next(
            handler
            for handler in root_logger.handlers
            if isinstance(handler, logging.StreamHandler)
            and any(isinstance(item, RequestContextFilter) for item in handler.filters)
        )
        previous_stream = handler.stream
        stream = StringIO()
        handler.stream = stream
        return handler, previous_stream, stream

    @staticmethod
    def restore_application_logs(handler, previous_stream):
        handler.flush()
        handler.stream = previous_stream

    def test_logging_configuration_is_idempotent(self):
        root_logger = logging.getLogger()
        before = len(root_logger.handlers)
        with (
            patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"),
            patch.object(Config, "APP_ENV", "testing"),
            patch.object(Config, "LOG_LEVEL", "INFO"),
        ):
            create_app()
        self.assertEqual(len(root_logger.handlers), before)

    def test_production_does_not_enable_debug_level(self):
        app = self.app
        previous_environment = app.config["APP_ENV"]
        previous_level = app.config["LOG_LEVEL"]
        previous_root_level = logging.getLogger().level
        try:
            app.config.update(APP_ENV="production", LOG_LEVEL="DEBUG")
            configure_logging(app)
            self.assertEqual(app.config["LOG_LEVEL"], "INFO")
            self.assertEqual(logging.getLogger().level, logging.INFO)
        finally:
            app.config.update(APP_ENV=previous_environment, LOG_LEVEL=previous_level)
            logging.getLogger().setLevel(previous_root_level)

    def test_unexpected_exception_is_logged_safely_with_request_id(self):
        handler, previous_stream, stream = self.capture_application_logs()
        try:
            response = self.app.test_client().get(
                "/__logging_test/unexpected",
                headers={"X-Request-ID": "attacker-supplied-id"},
            )
        finally:
            self.restore_application_logs(handler, previous_stream)

        request_id = response.headers["X-Request-ID"]
        self.assertRegex(request_id, r"^[0-9a-f]{32}$")
        self.assertNotEqual(request_id, "attacker-supplied-id")
        self.assertEqual(response.status_code, 500)
        self.assertEqual(
            response.get_json(),
            {"success": False, "message": "An unexpected server error occurred."},
        )
        output = stream.getvalue()
        self.assertIn(request_id, output)
        self.assertIn("RuntimeError", output)
        self.assertNotIn("private-pass", output)
        self.assertNotIn("123456", output)
        self.assertNotIn("private-ticket", output)
        self.assertNotIn("private-jwt", output)
        self.assertNotIn("private-credential", output)

    def test_expected_validation_failure_keeps_response_and_is_not_error_logged(self):
        handler, previous_stream, stream = self.capture_application_logs()
        try:
            response = self.app.test_client().post(
                "/api/auth/login",
                json={"email": "not-an-email", "password": ""},
            )
        finally:
            self.restore_application_logs(handler, previous_stream)

        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.get_json()["message"], "Validation failed.")
        self.assertEqual(stream.getvalue(), "")
        self.assertRegex(response.headers["X-Request-ID"], r"^[0-9a-f]{32}$")

    def test_missing_jwt_keeps_default_response_and_logs_no_credential(self):
        handler, previous_stream, stream = self.capture_application_logs()
        try:
            response = self.app.test_client().get("/api/admin/dashboard")
        finally:
            self.restore_application_logs(handler, previous_stream)

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json(), {"msg": "Missing Authorization Header"})
        self.assertIn(response.headers["X-Request-ID"], stream.getvalue())
        self.assertIn("JWT authorization rejected", stream.getvalue())
        self.assertNotIn("Authorization:", stream.getvalue())

    def test_invalid_login_logs_generic_event_without_login_values(self):
        handler, previous_stream, stream = self.capture_application_logs()
        try:
            with patch(
                "app.controllers.auth_controller.AuthService.login",
                side_effect=ValueError("Invalid email or password."),
            ):
                response = self.app.test_client().post(
                    "/api/auth/login",
                    json={
                        "email": "private-user@example.test",
                        "password": "private-password",
                    },
                )
        finally:
            self.restore_application_logs(handler, previous_stream)

        self.assertEqual(response.status_code, 401)
        self.assertEqual(response.get_json()["message"], "Invalid email or password.")
        output = stream.getvalue()
        self.assertIn("Login attempt rejected", output)
        self.assertNotIn("private-user@example.test", output)
        self.assertNotIn("private-password", output)

    def test_contact_storage_failure_logs_category_without_message_body(self):
        handler, previous_stream, stream = self.capture_application_logs()
        try:
            with patch(
                "app.controllers.site_content_controller.ContactRateLimitService.record_attempt",
                side_effect=RuntimeError("private-contact-message"),
            ):
                response = self.app.test_client().post(
                    "/api/public/contact",
                    json={"message": "private-contact-message"},
                )
        finally:
            self.restore_application_logs(handler, previous_stream)

        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.get_json()["message"],
            "Contact form is temporarily unavailable.",
        )
        self.assertIn("Contact form rate-limit storage failed", stream.getvalue())
        self.assertNotIn("private-contact-message", stream.getvalue())

if __name__ == "__main__":
    unittest.main()
