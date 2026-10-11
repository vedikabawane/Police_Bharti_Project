import hashlib
import hmac
import time
from datetime import datetime, timedelta, timezone
from threading import Lock

from flask import current_app
from sqlalchemy import select
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from app.extensions import db
from app.models import ContactRateLimit


CONTACT_LIMIT = 5
CONTACT_WINDOW_SECONDS = 60
CLEANUP_INTERVAL_SECONDS = 300

_cleanup_lock = Lock()
_last_cleanup_check = 0.0


class ContactRateLimitService:
    @staticmethod
    def _client_key(client_ip):
        secret = current_app.config.get("JWT_SECRET_KEY")
        if not secret and current_app.config.get("APP_ENV") != "production":
            secret = "development-only-contact-rate-limit-key"
        if not isinstance(secret, str) or not secret:
            raise RuntimeError("Contact rate-limit hashing is not configured.")
        return hmac.new(
            secret.encode("utf-8"),
            (client_ip or "unknown").encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

    @classmethod
    def record_attempt(cls, client_ip, now=None):
        timestamp = time.time() if now is None else float(now)
        current_time = datetime.fromtimestamp(timestamp, timezone.utc).replace(tzinfo=None)
        key = cls._client_key(client_ip)
        dialect = db.session.get_bind().dialect.name

        try:
            values = {
                "client_key": key,
                "attempts": [],
                "last_seen_at": current_time,
            }
            if dialect == "mysql":
                statement = mysql_insert(ContactRateLimit).values(**values)
                statement = statement.on_duplicate_key_update(
                    client_key=statement.inserted.client_key
                )
            elif dialect == "sqlite":
                statement = sqlite_insert(ContactRateLimit).values(**values)
                statement = statement.on_conflict_do_nothing(
                    index_elements=[ContactRateLimit.client_key]
                )
            else:
                raise RuntimeError("Unsupported shared contact rate-limit database.")

            db.session.execute(statement)
            row = db.session.execute(
                select(ContactRateLimit)
                .where(ContactRateLimit.client_key == key)
                .with_for_update()
            ).scalar_one()

            cutoff = timestamp - CONTACT_WINDOW_SECONDS
            recent_attempts = [
                float(attempt)
                for attempt in (row.attempts or [])
                if float(attempt) >= cutoff
            ]
            allowed = len(recent_attempts) < CONTACT_LIMIT
            if allowed:
                recent_attempts.append(timestamp)

            row.attempts = recent_attempts
            row.last_seen_at = current_time
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        cls._cleanup_if_due()
        return allowed

    @staticmethod
    def cleanup_expired_state(now=None):
        current_time = now or datetime.now(timezone.utc).replace(tzinfo=None)
        cutoff = current_time - timedelta(seconds=CONTACT_WINDOW_SECONDS)
        deleted = ContactRateLimit.query.filter(
            ContactRateLimit.last_seen_at < cutoff
        ).delete(synchronize_session=False)
        db.session.commit()
        return deleted

    @classmethod
    def _cleanup_if_due(cls):
        global _last_cleanup_check

        monotonic_now = time.monotonic()
        with _cleanup_lock:
            if monotonic_now - _last_cleanup_check < CLEANUP_INTERVAL_SECONDS:
                return
            _last_cleanup_check = monotonic_now

        try:
            cls.cleanup_expired_state()
        except Exception:
            db.session.rollback()
            current_app.logger.warning("Contact rate-limit cleanup failed.")
