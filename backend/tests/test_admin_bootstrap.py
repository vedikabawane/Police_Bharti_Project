import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from sqlalchemy.exc import SQLAlchemyError

from app import create_app
from app.config.config import Config, validate_admin_bootstrap_config
from app.extensions import db
from app.models import User
from app.services.admin_bootstrap_service import (
    AdminBootstrapError,
    bootstrap_initial_admin,
)
from app.utils.password import check_password


class AdminBootstrapTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.database_path = Path(cls.temp_dir.name) / "admin-bootstrap.sqlite"
        cls.database_uri = f"sqlite:///{cls.database_path.as_posix()}"
        with (
            patch.object(Config, "SQLALCHEMY_DATABASE_URI", cls.database_uri),
            patch.object(Config, "ADMIN_BOOTSTRAP_ENABLED", False),
        ):
            cls.schema_app = create_app()
        with cls.schema_app.app_context():
            db.create_all()
        cls.apps = [cls.schema_app]

    @classmethod
    def tearDownClass(cls):
        with cls.schema_app.app_context():
            db.session.remove()
            db.drop_all()
        for app in cls.apps:
            with app.app_context():
                db.session.remove()
                for engine in db.engines.values():
                    engine.dispose()
        cls.temp_dir.cleanup()

    def setUp(self):
        self.app = self.schema_app
        self.context = self.app.app_context()
        self.context.push()
        db.session.remove()
        db.drop_all()
        db.create_all()
        self.app.config.update(
            APP_ENV="development",
            ADMIN_BOOTSTRAP_ENABLED=True,
            ADMIN_NAME="Police Bharti Admin",
            ADMIN_EMAIL="admin@example.test",
            ADMIN_PASSWORD="a-unique-local-admin-password",
            ADMIN_MOBILE="",
        )

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def test_app_startup_creates_active_admin_in_configured_test_database(self):
        with (
            patch.object(Config, "SQLALCHEMY_DATABASE_URI", self.database_uri),
            patch.object(Config, "ADMIN_BOOTSTRAP_ENABLED", True),
            patch.object(Config, "APP_ENV", "development"),
            patch.object(Config, "ADMIN_NAME", "Police Bharti Admin"),
            patch.object(Config, "ADMIN_EMAIL", "admin@example.test"),
            patch.object(Config, "ADMIN_PASSWORD", "a-unique-local-admin-password"),
            patch.object(Config, "ADMIN_MOBILE", ""),
        ):
            startup_app = create_app()

        with startup_app.app_context():
            self.apps.append(startup_app)
            admin = User.query.filter_by(email="admin@example.test").one()
            self.assertEqual(startup_app.config["SQLALCHEMY_DATABASE_URI"], self.database_uri)
            self.assertEqual(admin.role, "admin")
            self.assertTrue(admin.is_active)
            self.assertFalse(admin.email_verified)
            self.assertFalse(admin.mobile_verified)
            self.assertTrue(check_password(
                "a-unique-local-admin-password", admin.password_hash
            ))
            login = startup_app.test_client().post(
                "/api/auth/login",
                json={
                    "email": "admin@example.test",
                    "password": "a-unique-local-admin-password",
                },
            )
            self.assertEqual(login.status_code, 200)

    def test_disabled_bootstrap_does_not_create_an_account(self):
        self.app.config["ADMIN_BOOTSTRAP_ENABLED"] = False
        self.assertFalse(bootstrap_initial_admin())
        self.assertEqual(User.query.count(), 0)

    def test_disabled_bootstrap_is_not_run_during_app_startup(self):
        with (
            patch.object(Config, "SQLALCHEMY_DATABASE_URI", self.database_uri),
            patch.object(Config, "ADMIN_BOOTSTRAP_ENABLED", False),
        ):
            startup_app = create_app()

        with startup_app.app_context():
            self.apps.append(startup_app)
            self.assertEqual(User.query.count(), 0)

    def test_repeated_bootstrap_does_not_duplicate_or_reset_existing_admin(self):
        self.assertTrue(bootstrap_initial_admin())
        admin = User.query.filter_by(email="admin@example.test").one()
        original_hash = admin.password_hash

        self.app.config["ADMIN_PASSWORD"] = "different-local-admin-password"
        db.session.commit()
        self.assertFalse(bootstrap_initial_admin())
        self.assertEqual(User.query.count(), 1)
        self.assertEqual(admin.password_hash, original_hash)
        self.assertTrue(check_password(
            "a-unique-local-admin-password", admin.password_hash
        ))

    def test_existing_admin_is_left_unchanged_even_when_bootstrap_email_differs(self):
        existing = User(
            name="Existing Admin",
            email="existing-admin@example.test",
            password_hash="existing-hash",
            role="admin",
            is_active=False,
            email_verified=True,
        )
        db.session.add(existing)
        db.session.commit()

        self.assertFalse(bootstrap_initial_admin())
        self.assertEqual(User.query.count(), 1)
        self.assertEqual(existing.name, "Existing Admin")
        self.assertEqual(existing.password_hash, "existing-hash")
        self.assertFalse(existing.is_active)
        self.assertTrue(existing.email_verified)

    def test_existing_non_admin_with_configured_email_is_never_promoted(self):
        student = User(
            name="Existing Student",
            email="admin@example.test",
            password_hash="existing-hash",
            role="student",
        )
        db.session.add(student)
        db.session.commit()

        with self.assertRaisesRegex(AdminBootstrapError, "non-Admin"):
            bootstrap_initial_admin()
        self.assertEqual(User.query.count(), 1)
        self.assertEqual(student.role, "student")
        self.assertEqual(student.password_hash, "existing-hash")

    def test_invalid_or_missing_credentials_fail_without_creating_an_account(self):
        invalid_settings = (
            {"ADMIN_NAME": ""},
            {"ADMIN_EMAIL": "not-an-email"},
            {"ADMIN_PASSWORD": ""},
            {"ADMIN_PASSWORD": "short"},
            {"ADMIN_PASSWORD": "CHANGE_TO_A_STRONG_UNIQUE_PASSWORD"},
            {"ADMIN_MOBILE": "123"},
        )
        for override in invalid_settings:
            with self.subTest(override=tuple(override)):
                settings = {
                    "ADMIN_NAME": "Police Bharti Admin",
                    "ADMIN_EMAIL": "admin@example.test",
                    "ADMIN_PASSWORD": "a-unique-local-admin-password",
                    "ADMIN_MOBILE": "",
                }
                settings.update(override)
                self.app.config.update(settings)
                with self.assertRaises(AdminBootstrapError):
                    bootstrap_initial_admin()
                self.assertEqual(User.query.count(), 0)
                db.session.rollback()

    def test_database_failure_rolls_back_the_new_admin(self):
        add_user = db.session.add

        def add_then_fail(user):
            add_user(user)
            raise SQLAlchemyError("simulated persistence failure")

        with patch.object(db.session, "add", side_effect=add_then_fail):
            with self.assertRaisesRegex(AdminBootstrapError, "no account was created"):
                bootstrap_initial_admin()

        db.session.rollback()
        self.assertEqual(User.query.count(), 0)

    def test_production_bootstrap_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "only when APP_ENV=development"):
            validate_admin_bootstrap_config({
                "APP_ENV": "production",
                "ADMIN_BOOTSTRAP_ENABLED": True,
            })
        self.app.config["APP_ENV"] = "production"
        with self.assertRaisesRegex(AdminBootstrapError, "only in development"):
            bootstrap_initial_admin()
        self.assertEqual(User.query.count(), 0)

        with (
            patch.object(Config, "APP_ENV", "production"),
            patch.object(Config, "ADMIN_BOOTSTRAP_ENABLED", True),
            patch.object(
                Config,
                "SQLALCHEMY_DATABASE_URI",
                "mysql+pymysql://app:local-configured-pass@db.internal/police_bharti_test",
            ),
            patch.object(Config, "JWT_SECRET_KEY", "a" * 40),
            patch.object(db, "init_app") as initialize_database,
        ):
            with self.assertRaisesRegex(ValueError, "only when APP_ENV=development"):
                create_app()
            initialize_database.assert_not_called()

    def test_public_registration_still_creates_only_a_student(self):
        response = self.app.test_client().post(
            "/api/auth/register",
            json={
                "name": "Registered Student",
                "email": "student@example.test",
                "mobile": "9876543210",
                "password": "correct-horse-battery",
                "role": "admin",
            },
        )
        self.assertEqual(response.status_code, 422)
        self.assertEqual(User.query.count(), 0)


if __name__ == "__main__":
    unittest.main()
