import logging
import re
import time
from datetime import datetime, timezone

from flask import current_app
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models import SmsDelivery, User
from app.services.sms_provider import (
    MockSmsProvider,
    SmsPermanentError,
    SmsTransientError,
)


logger = logging.getLogger(__name__)
MOBILE_RE = re.compile(r"^[6-9][0-9]{9}$")
SMS_NOTIFICATION_TYPES = {"ANNOUNCEMENT", "TEST", "RESULT"}


class SmsService:
    @staticmethod
    def _message(notification):
        prefixes = {
            "ANNOUNCEMENT": "Police Bharti update",
            "TEST": "Police Bharti: New test",
            "RESULT": "Police Bharti: Test result available",
        }
        prefix = prefixes.get(notification.notification_type)
        if not prefix:
            return None
        title = re.sub(r"\s+", " ", str(notification.title or "")).strip()
        title = re.sub(r"[\r\n\x00-\x1f\x7f]", " ", title)[:75].strip()
        return f"{prefix}: {title}" if title else f"{prefix}."

    @staticmethod
    def _provider():
        provider_name = current_app.config.get("SMS_PROVIDER", "")
        if provider_name == "mock" and current_app.config.get("APP_ENV") != "production":
            return MockSmsProvider()
        raise RuntimeError("No SMS provider adapter is configured.")

    @classmethod
    def dispatch_notifications(cls, notifications, event_key=None):
        if not current_app.config.get("SMS_ENABLED", False) or not notifications:
            return 0
        provider = cls._provider()
        user_ids = {row.user_id for row in notifications}
        recipients = {
            user.id: user.mobile
            for user in User.query.filter(
                User.id.in_(user_ids),
                User.role == "student",
                User.is_active.is_(True),
                User.sms_notifications_enabled.is_(True),
            ).all()
            if isinstance(user.mobile, str) and MOBILE_RE.fullmatch(user.mobile)
        }
        db.session.commit()
        accepted = 0
        for notification in notifications:
            if notification.notification_type not in SMS_NOTIFICATION_TYPES:
                continue
            recipient = recipients.get(notification.user_id)
            message = cls._message(notification)
            if not recipient or not message:
                continue
            notification_event_key = (
                f"{event_key}:{notification.user_id}"
                if event_key
                else f"notification:{notification.id}"
            )
            if cls._dispatch_one(
                notification.user_id,
                recipient,
                message,
                notification_event_key,
                notification.notification_type,
                provider,
            ):
                accepted += 1
        return accepted

    @classmethod
    def _dispatch_one(cls, user_id, recipient, message, event_key,
                      notification_type, provider):
        delivery = SmsDelivery.query.filter_by(
            user_id=user_id,
            event_key=event_key,
        ).with_for_update().first()
        if delivery:
            db.session.commit()
            return delivery.status == "ACCEPTED"

        delivery = SmsDelivery(
            user_id=user_id,
            event_key=event_key,
            status="PROCESSING",
            attempt_count=0,
        )
        db.session.add(delivery)
        try:
            db.session.commit()
        except IntegrityError:
            db.session.rollback()
            return False

        max_attempts = current_app.config.get("SMS_MAX_ATTEMPTS", 3)
        timeout = current_app.config.get("SMS_REQUEST_TIMEOUT", 5)
        for attempt in range(1, max_attempts + 1):
            delivery = SmsDelivery.query.filter_by(
                user_id=user_id,
                event_key=event_key,
            ).with_for_update().first()
            delivery.attempt_count = attempt
            db.session.commit()
            try:
                accepted = provider.send_sms(
                    recipient=recipient,
                    message=message,
                    idempotency_key=event_key,
                    timeout=timeout,
                )
                if accepted is not True:
                    raise SmsPermanentError(code="provider_rejected")
            except SmsTransientError as error:
                delivery.status = "FAILED" if attempt == max_attempts else "PROCESSING"
                delivery.last_error_code = cls._safe_error_code(error)
                db.session.commit()
                if attempt < max_attempts:
                    time.sleep(min(0.1 * (2 ** (attempt - 1)), 0.5))
                    continue
                logger.warning(
                    "SMS request failed after bounded retries; delivery_id=%s type=%s category=%s",
                    delivery.id,
                    notification_type,
                    delivery.last_error_code,
                )
                return False
            except SmsPermanentError as error:
                delivery.status = "FAILED"
                delivery.last_error_code = cls._safe_error_code(error)
                db.session.commit()
                logger.warning(
                    "SMS request rejected; delivery_id=%s type=%s category=%s",
                    delivery.id,
                    notification_type,
                    delivery.last_error_code,
                )
                return False
            except Exception:
                delivery.status = "FAILED"
                delivery.last_error_code = "provider_error"
                db.session.commit()
                logger.warning(
                    "SMS provider adapter failed; delivery_id=%s type=%s",
                    delivery.id,
                    notification_type,
                )
                return False

            delivery.status = "ACCEPTED"
            delivery.last_error_code = None
            delivery.accepted_at = datetime.now(timezone.utc).replace(tzinfo=None)
            db.session.commit()
            return True
        return False

    @staticmethod
    def _safe_error_code(error):
        code = getattr(error, "code", None)
        if isinstance(code, str) and re.fullmatch(r"[a-zA-Z0-9_-]{1,40}", code):
            return code.lower()
        return "transient_error"
