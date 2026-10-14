import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import User
from app.services.admin_password_reset_service import (
    AdminPasswordResetError,
    reset_existing_admin_password,
    validate_admin_password_reset_target,
)
from app.utils.password import check_password, hash_password


class AdminPasswordResetTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.database_uri = (
            f"sqlite:///{(Path(cls.temp_dir.name) / 'admin-reset.sqlite').as_posix()}"
        )
        with (
            patch.object(Config, "SQLALCHEMY_DATABASE_URI", cls.database_uri),
            patch.object(Config, "ADMIN_BOOTSTRAP_ENABLED", False),
        ):
            cls.app = create_app()
        cls.app.config.update(
            TESTING=True,
            APP_ENV="development",
            SQLALCHEMY_DATABASE_URI=cls.database_uri,
        )
        with cls.app.app_context():
            db.create_all()

    @classmethod
    def tearDownClass(cls):
        with cls.app.app_context():
            db.session.remove()
            db.drop_all()
            for engine in db.engines.values():
                engine.dispose()
        cls.temp_dir.cleanup()

    def setUp(self):
        self.context = self.app.app_context()
        self.context.push()
        db.session.remove()
        db.drop_all()
        db.create_all()
        self.original_password = "original-local-admin-password"
        self.admin = User(
            name="Existing Admin",
            email="admin@example.test",
            mobile="9876543210",
            password_hash=hash_password(self.original_password),
            role="admin",
            is_active=True,
        )
        db.session.add(self.admin)
        db.session.commit()
        self.original_hash = self.admin.password_hash

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def test_reset_hashes_password_and_existing_login_succeeds(self):
        new_password = "new-unique-local-admin-password"
        original_fields = (
            self.admin.id,
            self.admin.name,
            self.admin.email,
            self.admin.mobile,
            self.admin.role,
            self.admin.is_active,
        )

        reset_existing_admin_password("  ADMIN@EXAMPLE.TEST ", new_password)

        db.session.remove()
        updated_admin = User.query.filter_by(email=self.admin.email).one()
        self.assertNotEqual(updated_admin.password_hash, self.original_hash)
        self.assertTrue(check_password(new_password, updated_admin.password_hash))
        self.assertEqual(
            (
                updated_admin.id,
                updated_admin.name,
                updated_admin.email,
                updated_admin.mobile,
                updated_admin.role,
                updated_admin.is_active,
            ),
            original_fields,
        )
        response = self.app.test_client().post(
            "/api/auth/login",
            json={"email": self.admin.email, "password": new_password},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["user"]["role"], "admin")

    def test_invalid_email_does_not_change_any_account(self):
        with self.assertRaisesRegex(AdminPasswordResetError, "valid Admin email"):
            reset_existing_admin_password("not-an-email", "new-local-password-123")
        self.assertEqual(self.admin.password_hash, self.original_hash)

    def test_non_admin_account_is_rejected_without_modification(self):
        self.admin.role = "student"
        db.session.commit()

        with self.assertRaisesRegex(AdminPasswordResetError, "not an Admin"):
            reset_existing_admin_password(
                self.admin.email,
                "new-unique-local-admin-password",
            )
        self.assertEqual(self.admin.password_hash, self.original_hash)
        self.assertEqual(self.admin.role, "student")

    def test_inactive_admin_is_not_eligible_for_password_reset(self):
        self.admin.is_active = False
        db.session.commit()

        with self.assertRaisesRegex(AdminPasswordResetError, "inactive"):
            reset_existing_admin_password(
                self.admin.email,
                "new-unique-local-admin-password",
            )
        self.assertEqual(self.admin.password_hash, self.original_hash)

    def test_production_or_ambiguous_database_is_rejected(self):
        for config in (
            {
                "APP_ENV": "production",
                "SQLALCHEMY_DATABASE_URI": self.database_uri,
            },
            {
                "APP_ENV": "development",
                "SQLALCHEMY_DATABASE_URI": (
                    "mysql+pymysql://user:password@remote.example/production"
                ),
            },
            {
                "APP_ENV": "development",
                "SQLALCHEMY_DATABASE_URI": None,
            },
        ):
            with self.subTest(environment=config["APP_ENV"]):
                with self.assertRaises(AdminPasswordResetError):
                    validate_admin_password_reset_target(
                        config,
                        testing=False,
                    )

    def test_database_failure_rolls_back_password_hash(self):
        with patch.object(
            Session,
            "flush",
            side_effect=SQLAlchemyError("simulated write failure"),
        ):
            with self.assertRaisesRegex(
                AdminPasswordResetError,
                "existing password was not changed",
            ):
                reset_existing_admin_password(
                    self.admin.email,
                    "new-unique-local-admin-password",
                )

        db.session.expire_all()
        self.assertEqual(self.admin.password_hash, self.original_hash)
        self.assertTrue(check_password(
            self.original_password,
            self.admin.password_hash,
        ))

    def test_interactive_cli_hides_password_and_resets_only_existing_admin(self):
        runner = self.app.test_cli_runner()
        new_password = "interactive-local-password"
        result = runner.invoke(
            args=["reset-admin-password"],
            input=(
                f"{self.admin.email}\n"
                f"{new_password}\n"
                f"{new_password}\n"
                "y\n"
            ),
        )

        self.assertEqual(result.exit_code, 0, result.output)
        self.assertIn("Admin password reset successfully.", result.output)
        self.assertNotIn(new_password, result.output)
        db.session.remove()
        updated_admin = User.query.filter_by(email=self.admin.email).one()
        self.assertTrue(check_password(new_password, updated_admin.password_hash))
        self.assertEqual(User.query.count(), 1)


if __name__ == "__main__":
    unittest.main()
