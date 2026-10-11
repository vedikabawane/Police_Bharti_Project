import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Barrier
from unittest.mock import patch

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import ContactRateLimit
from app.services.contact_rate_limit_service import ContactRateLimitService


class ContactRateLimitTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.temp_dir = tempfile.TemporaryDirectory()
        cls.database_path = Path(cls.temp_dir.name) / "contact-rate-limit.sqlite"
        database_url = f"sqlite:///{cls.database_path.as_posix()}"
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", database_url):
            cls.app_one = create_app()
            cls.app_two = create_app()
        for app in (cls.app_one, cls.app_two):
            app.config.update(
                TESTING=True,
                JWT_SECRET_KEY="isolated-contact-rate-limit-test-key",
            )
        with cls.app_one.app_context():
            db.create_all()

    @classmethod
    def tearDownClass(cls):
        with cls.app_one.app_context():
            db.session.remove()
            db.drop_all()
            db.engine.dispose()
        with cls.app_two.app_context():
            db.session.remove()
            db.engine.dispose()
        cls.temp_dir.cleanup()

    def setUp(self):
        with self.app_one.app_context():
            db.session.query(ContactRateLimit).delete()
            db.session.commit()

    def record(self, app, ip, now=None):
        with app.app_context():
            return ContactRateLimitService.record_attempt(ip, now=now)

    def test_five_attempts_are_allowed_and_the_sixth_is_limited(self):
        results = [self.record(self.app_one, "198.51.100.4") for _ in range(6)]
        self.assertEqual(results, [True, True, True, True, True, False])

    def test_attempts_expire_after_the_sixty_second_window(self):
        start = 1_800_000_000.0
        for _ in range(5):
            self.assertTrue(self.record(self.app_one, "198.51.100.5", start))
        self.assertFalse(self.record(self.app_one, "198.51.100.5", start + 59.9))
        self.assertTrue(self.record(self.app_one, "198.51.100.5", start + 60.1))
        with self.app_one.app_context():
            row = ContactRateLimit.query.one()
            self.assertEqual(len(row.attempts), 1)

    def test_different_client_ips_have_independent_limits(self):
        for _ in range(5):
            self.assertTrue(self.record(self.app_one, "198.51.100.6"))
        self.assertFalse(self.record(self.app_one, "198.51.100.6"))
        self.assertTrue(self.record(self.app_one, "198.51.100.7"))

    def test_multiple_application_instances_share_the_same_limit(self):
        for _ in range(3):
            self.assertTrue(self.record(self.app_one, "198.51.100.8"))
        self.assertTrue(self.record(self.app_two, "198.51.100.8"))
        self.assertTrue(self.record(self.app_two, "198.51.100.8"))
        self.assertFalse(self.record(self.app_one, "198.51.100.8"))

    def test_concurrent_requests_across_instances_cannot_exceed_the_limit(self):
        request_count = 12
        barrier = Barrier(request_count)

        def request(index):
            app = self.app_one if index % 2 == 0 else self.app_two
            with app.app_context():
                barrier.wait(timeout=10)
                return ContactRateLimitService.record_attempt("198.51.100.9")

        with ThreadPoolExecutor(max_workers=request_count) as executor:
            results = list(executor.map(request, range(request_count)))
        self.assertEqual(sum(results), 5)

    def test_forwarded_headers_do_not_change_the_trusted_peer_ip(self):
        client = self.app_one.test_client()
        statuses = []
        for index in range(6):
            response = client.post(
                "/api/public/contact",
                json={"name": "Student", "email": "student@example.test", "subject": "Help", "message": "Question"},
                environ_overrides={"REMOTE_ADDR": "198.51.100.10"},
                headers={"X-Forwarded-For": f"203.0.113.{index + 1}"},
            )
            statuses.append(response.status_code)
        self.assertEqual(statuses, [201, 201, 201, 201, 201, 429])

    def test_storage_failure_fails_closed_with_service_unavailable(self):
        with patch.object(
            ContactRateLimitService,
            "record_attempt",
            side_effect=RuntimeError("test storage failure"),
        ):
            response = self.app_one.test_client().post(
                "/api/public/contact",
                json={"name": "Student", "email": "student@example.test", "subject": "Help", "message": "Question"},
            )
        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.get_json(),
            {"success": False, "message": "Contact form is temporarily unavailable."},
        )

    def test_expired_state_cleanup_removes_all_stale_rows_using_expiry_index(self):
        old_time = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(minutes=10)
        with self.app_one.app_context():
            db.session.bulk_save_objects([
                ContactRateLimit(
                    client_key=f"{index:064x}",
                    attempts=[],
                    last_seen_at=old_time,
                )
                for index in range(550)
            ])
            db.session.commit()

            deleted = ContactRateLimitService.cleanup_expired_state()
            self.assertEqual(deleted, 550)
            self.assertEqual(ContactRateLimit.query.count(), 0)

    def test_database_contains_hashed_ip_and_attempt_times_only(self):
        client_ip = "198.51.100.11"
        self.assertTrue(self.record(self.app_one, client_ip))
        with self.app_one.app_context():
            row = ContactRateLimit.query.one()
            self.assertEqual(len(row.client_key), 64)
            self.assertNotEqual(row.client_key, client_ip)
            self.assertEqual(len(row.attempts), 1)
            self.assertIsInstance(row.attempts[0], float)

    def test_development_contact_form_hashing_does_not_require_jwt_configuration(self):
        previous_secret = self.app_one.config.get("JWT_SECRET_KEY")
        previous_environment = self.app_one.config.get("APP_ENV")
        self.app_one.config.update(JWT_SECRET_KEY=None, APP_ENV="development")
        try:
            self.assertTrue(self.record(self.app_one, "198.51.100.12"))
        finally:
            self.app_one.config.update(
                JWT_SECRET_KEY=previous_secret,
                APP_ENV=previous_environment,
            )


if __name__ == "__main__":
    unittest.main()
