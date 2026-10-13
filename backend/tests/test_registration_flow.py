import unittest
from pathlib import Path
from unittest.mock import patch

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import User
from app.utils.password import check_password


class RegistrationFlowTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()
        cls.app.config.update(TESTING=True, APP_ENV="development", SMS_ENABLED=False)
        with cls.app.app_context():
            db.create_all()

    def setUp(self):
        self.app.config["APP_ENV"] = "development"
        self.context = self.app.app_context()
        self.context.push()
        db.drop_all()
        db.create_all()
        self.client = self.app.test_client()
        self.data = {
            "name": "Test Student",
            "email": "student@example.test",
            "mobile": "9876543210",
            "password": "correct-horse-battery",
        }

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def test_original_registration_payload_creates_user_without_sms_or_otp(self):
        with patch("app.services.sms_provider.MockSmsProvider.send_sms") as send_sms:
            response = self.client.post("/api/auth/register", json=self.data)

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["message"], "Student registered successfully.")
        self.assertEqual(
            set(response.get_json()["data"]),
            {"id", "name", "email", "mobile", "role"},
        )
        self.assertNotIn(self.data["password"], response.get_data(as_text=True))
        user = User.query.filter_by(email=self.data["email"]).one()
        self.assertEqual(user.name, self.data["name"])
        self.assertEqual(user.mobile, self.data["mobile"])
        self.assertFalse(user.mobile_verified)
        self.assertIsNone(user.mobile_verified_at)
        self.assertTrue(check_password(self.data["password"], user.password_hash))
        send_sms.assert_not_called()

    def test_duplicate_email_and_mobile_are_rejected(self):
        first = self.client.post("/api/auth/register", json=self.data)
        self.assertEqual(first.status_code, 201)

        duplicate_email = self.client.post("/api/auth/register", json={
            **self.data, "mobile": "9876543211",
        })
        self.assertEqual(duplicate_email.status_code, 409)
        self.assertEqual(duplicate_email.get_json()["message"], "Email is already registered.")

        duplicate_mobile = self.client.post("/api/auth/register", json={
            **self.data, "email": "another@example.test",
        })
        self.assertEqual(duplicate_mobile.status_code, 409)
        self.assertEqual(duplicate_mobile.get_json()["message"], "Mobile number is already registered.")
        self.assertEqual(User.query.count(), 1)

    def test_registration_validation_is_preserved(self):
        response = self.client.post("/api/auth/register", json={
            **self.data, "mobile": "123",
        })
        self.assertEqual(response.status_code, 422)
        self.assertEqual(response.get_json()["message"], "Validation failed.")
        self.assertFalse(User.query.first())

        missing = self.client.post("/api/auth/register", json={
            key: value for key, value in self.data.items() if key != "password"
        })
        self.assertEqual(missing.status_code, 422)
        self.assertFalse(User.query.first())

    def test_production_registration_fails_closed_without_verification(self):
        self.app.config["APP_ENV"] = "production"
        response = self.client.post("/api/auth/register", json=self.data)
        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.get_json()["message"],
            "Registration verification is temporarily unavailable.",
        )
        self.assertEqual(User.query.count(), 0)

    def test_registration_otp_and_options_routes_are_not_registered(self):
        self.assertEqual(self.client.get("/api/auth/registration-options").status_code, 404)
        self.assertEqual(self.client.post("/api/auth/register/otp", json=self.data).status_code, 404)
        self.assertEqual(
            self.client.post("/api/auth/register/otp/verify", json={}).status_code,
            404,
        )

    def test_frontend_posts_only_the_original_registration_payload(self):
        frontend = (
            Path(__file__).resolve().parents[2]
            / "frontend" / "src" / "pages" / "auth" / "Register.jsx"
        ).read_text(encoding="utf-8")
        auth_service = (
            Path(__file__).resolve().parents[2]
            / "frontend" / "src" / "services" / "authService.js"
        ).read_text(encoding="utf-8")

        self.assertIn("onSubmit={handleSubmit}", frontend)
        self.assertIn("await register(registrationData)", frontend)
        self.assertNotIn("registration-options", frontend + auth_service)
        self.assertNotIn("register/otp", frontend + auth_service)
        self.assertNotIn("requestRegistrationOtp", frontend + auth_service)
        self.assertNotIn("verifyRegistrationOtp", frontend + auth_service)
        self.assertNotIn("challenge_id", frontend + auth_service)
        self.assertNotIn("registration_ticket", frontend + auth_service)

    def test_login_and_jwt_behavior_remain_available_after_registration(self):
        created = self.client.post("/api/auth/register", json=self.data)
        self.assertEqual(created.status_code, 201)

        login = self.client.post("/api/auth/login", json={
            "email": self.data["email"], "password": self.data["password"],
        })
        self.assertEqual(login.status_code, 200)
        token = login.get_json()["data"]["access_token"]
        self.assertTrue(token)

        identity = self.client.get("/api/auth/me", headers={
            "Authorization": f"Bearer {token}",
        })
        self.assertEqual(identity.status_code, 200)


if __name__ == "__main__":
    unittest.main()
