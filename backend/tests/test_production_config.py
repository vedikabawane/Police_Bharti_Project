import logging
import unittest
from io import StringIO
from unittest.mock import patch

from app import create_app
from app.config.config import Config, validate_production_config
from app.extensions import db


class ProductionConfigValidationTest(unittest.TestCase):
    VALID_DATABASE_URL = "mysql+pymysql://app_user:test_password@db.internal:3306/police_bharti"
    VALID_JWT_SECRET = "4f8d2a6c1b9e7d3f0a5c8b2e6d1f4a9c7b3e0d5a8f2c6e1b9d4a7f0c3e6b2a5d"

    def config(self, **overrides):
        values = {
            "APP_ENV": "production",
            "SQLALCHEMY_DATABASE_URI": self.VALID_DATABASE_URL,
            "JWT_SECRET_KEY": self.VALID_JWT_SECRET,
        }
        values.update(overrides)
        return values

    def test_missing_blank_and_malformed_database_urls_are_rejected(self):
        for value in (None, "", "  ", "not a database url", "mysql+pymysql://user@host:bad-port/db"):
            with self.subTest(value=value):
                with self.assertRaisesRegex(ValueError, "DATABASE_URL"):
                    validate_production_config(self.config(SQLALCHEMY_DATABASE_URI=value))

    def test_valid_mysql_url_is_accepted_without_opening_a_connection(self):
        with patch("sqlalchemy.engine.create.create_engine", side_effect=AssertionError("connection attempted")):
            validate_production_config(self.config())

    def test_production_rejects_sqlite_and_placeholder_database_urls(self):
        for value in (
            "sqlite:///production.db",
            "mysql+pymysql://user:pass@DB_HOST:3306/DB_NAME",
            "mysql+pymysql://user:pass@example.com/app_db",
            "mysql+pymysql://app_user:PASSWORD@db.internal/app_db",
            "mysql+pymysql:///app_db",
            "mysql+pymysql://user@db.internal/",
        ):
            with self.subTest(value=value):
                with self.assertNoLogs():
                    with self.assertRaisesRegex(ValueError, "DATABASE_URL") as raised:
                        validate_production_config(self.config(SQLALCHEMY_DATABASE_URI=value))
                self.assertNotIn(value, str(raised.exception))

    def test_missing_blank_short_and_known_weak_jwt_secrets_are_rejected_without_disclosure(self):
        secret_values = (
            None,
            "",
            "   ",
            "short-secret",
            "change-me",
            "your-secret-key",
            "example-secret-" + ("x" * 32),
            "<replace-with-secret>" + ("x" * 32),
        )
        for secret in secret_values:
            with self.subTest(secret=secret):
                stream = StringIO()
                handler = logging.StreamHandler(stream)
                root_logger = logging.getLogger()
                root_logger.addHandler(handler)
                try:
                    with self.assertNoLogs():
                        with self.assertRaisesRegex(ValueError, "JWT_SECRET_KEY") as raised:
                            validate_production_config(self.config(JWT_SECRET_KEY=secret))
                finally:
                    root_logger.removeHandler(handler)
                message = str(raised.exception)
                if secret:
                    self.assertNotIn(secret, message)
                    self.assertNotIn(secret, stream.getvalue())

    def test_jwt_minimum_uses_utf8_byte_length(self):
        validate_production_config(self.config(JWT_SECRET_KEY="é" * 16))
        with self.assertRaisesRegex(ValueError, "JWT_SECRET_KEY"):
            validate_production_config(self.config(JWT_SECRET_KEY="é" * 15))

    def test_non_production_configuration_keeps_existing_database_behavior(self):
        for environment in ("development", "testing"):
            with self.subTest(environment=environment):
                validate_production_config({"APP_ENV": environment})
        validate_production_config({
            "APP_ENV": "testing",
            "SQLALCHEMY_DATABASE_URI": "sqlite://",
            "JWT_SECRET_KEY": "test-secret",
        })

    def test_app_factory_rejects_invalid_production_settings_before_database_init(self):
        with (
            patch.object(Config, "APP_ENV", "production"),
            patch.object(Config, "SQLALCHEMY_DATABASE_URI", None),
            patch.object(Config, "JWT_SECRET_KEY", None),
            patch.object(db, "init_app") as initialize_database,
        ):
            with self.assertRaisesRegex(ValueError, "DATABASE_URL"):
                create_app()
            initialize_database.assert_not_called()


if __name__ == "__main__":
    unittest.main()
