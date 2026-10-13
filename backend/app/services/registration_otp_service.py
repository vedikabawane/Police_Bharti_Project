import hashlib
import hmac
import json
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from flask import current_app
from sqlalchemy import select
from sqlalchemy.dialects.mysql import insert as mysql_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert

from app.extensions import db
from app.models import RegistrationOtpChallenge, RegistrationOtpRateLimit, User
from app.services.sms_provider import MockSmsProvider, SmsPermanentError, SmsTransientError
from app.services.sms_service import MOBILE_RE


OTP_TTL_SECONDS = 300
OTP_RESEND_SECONDS = 60
OTP_MAX_ATTEMPTS = 5
TICKET_TTL_SECONDS = 300
RATE_WINDOW_SECONDS = 3600
SEND_RATE_LIMIT = 5
IP_VERIFY_RATE_LIMIT = 20
GENERIC_MESSAGE = "If the details are eligible, an OTP may arrive shortly."
INVALID_MESSAGE = "The OTP or registration verification is invalid or expired."


class RegistrationOtpError(Exception):
    def __init__(self, message, status_code=400, retry_after=None):
        super().__init__(message)
        self.status_code = status_code
        self.retry_after = retry_after


class RegistrationOtpService:
    @staticmethod
    def _now():
        return datetime.now(timezone.utc).replace(tzinfo=None)

    @staticmethod
    def _key(label):
        secret = current_app.config.get("JWT_SECRET_KEY")
        if not isinstance(secret, str) or len(secret.encode("utf-8")) < 16:
            raise RuntimeError("Registration verification is not configured.")
        return hmac.new(secret.encode("utf-8"), label.encode("utf-8"), hashlib.sha256).digest()

    @classmethod
    def _digest(cls, label, value):
        return hmac.new(cls._key(label), value.encode("utf-8"), hashlib.sha256).hexdigest()

    @classmethod
    def _mobile_key(cls, mobile):
        return cls._digest("registration-otp-mobile-v1", mobile)

    @classmethod
    def _commitment(cls, data):
        normalized = {
            "name": data["name"].strip(),
            "email": data["email"].strip().lower(),
            "mobile": data["mobile"].strip(),
            "password": data["password"],
        }
        canonical = json.dumps(normalized, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
        return cls._digest("registration-otp-fields-v1", canonical)

    @classmethod
    def _otp_verifier(cls, challenge_id, mobile_key, code):
        return cls._digest("registration-otp-code-v1", f"{challenge_id}\0{mobile_key}\0{code}")

    @classmethod
    def _ticket_verifier(cls, ticket):
        return cls._digest("registration-otp-ticket-v1", ticket)

    @classmethod
    def _allow_limits(cls, identifiers, now, commit=True):
        """Consume shared fixed-window limits under database row locks."""
        dialect = db.session.get_bind().dialect.name
        model = RegistrationOtpRateLimit
        limits = {cls._digest("registration-otp-rate-v1", item): limit
                  for item, limit in identifiers.items()}
        keys = sorted(limits)
        for key in keys:
            values = {"key_hash": key, "window_started_at": now, "attempts": 0}
            if dialect == "sqlite":
                statement = sqlite_insert(model).values(**values).on_conflict_do_nothing(
                    index_elements=[model.key_hash]
                )
            elif dialect == "mysql":
                statement = mysql_insert(model).values(**values).on_duplicate_key_update(key_hash=key)
            else:
                raise RuntimeError("Unsupported registration rate-limit database.")
            db.session.execute(statement)

        rows = db.session.execute(
            select(model).where(model.key_hash.in_(keys)).order_by(model.key_hash).with_for_update()
        ).scalars().all()
        if len(rows) != len(keys):
            db.session.rollback()
            raise RuntimeError("Registration rate limiting is unavailable.")
        cutoff = now - timedelta(seconds=RATE_WINDOW_SECONDS)
        if any(row.window_started_at > cutoff and row.attempts >= limits[row.key_hash]
               for row in rows):
            db.session.rollback()
            raise RegistrationOtpError("Please wait before trying again.", 429, 60)
        for row in rows:
            if row.window_started_at <= cutoff:
                row.window_started_at = now
                row.attempts = 1
            else:
                row.attempts += 1
        if commit:
            db.session.commit()

    @classmethod
    def _allow_send(cls, mobile, client_ip, now, commit=True):
        cls._allow_limits({
            "send-mobile:" + mobile: SEND_RATE_LIMIT,
            "send-ip:" + (client_ip or "unknown"): 20,
        }, now, commit=commit)

    @classmethod
    def _allow_verify(cls, client_ip, now):
        cls._allow_limits({"verify-ip:" + (client_ip or "unknown"): IP_VERIFY_RATE_LIMIT}, now)

    @staticmethod
    def _provider():
        if not current_app.config.get("REGISTRATION_OTP_ENABLED", False):
            raise RuntimeError("Registration OTP is disabled.")
        if (current_app.config.get("SMS_PROVIDER") == "mock"
                and current_app.config.get("APP_ENV") != "production"):
            return MockSmsProvider()
        # A real provider adapter has not been selected or installed.
        raise RuntimeError("No registration OTP provider is configured.")

    @classmethod
    def _cleanup_old_rows(cls, now):
        # Run occasionally and in bounded batches, never as a full-table request scan.
        if secrets.randbelow(100) != 0:
            return
        challenge_cutoff = now - timedelta(days=1)
        ids = [row[0] for row in db.session.query(RegistrationOtpChallenge.id)
               .filter(RegistrationOtpChallenge.expires_at < challenge_cutoff)
               .limit(200).all()]
        if ids:
            RegistrationOtpChallenge.query.filter(RegistrationOtpChallenge.id.in_(ids)).delete(
                synchronize_session=False
            )
        rate_cutoff = now - timedelta(days=2)
        hashes = [row[0] for row in db.session.query(RegistrationOtpRateLimit.key_hash)
                  .filter(RegistrationOtpRateLimit.window_started_at < rate_cutoff)
                  .limit(200).all()]
        if hashes:
            RegistrationOtpRateLimit.query.filter(RegistrationOtpRateLimit.key_hash.in_(hashes)).delete(
                synchronize_session=False
            )
        db.session.commit()

    @classmethod
    def request_otp(cls, data, client_ip):
        mobile = data["mobile"].strip()
        if not MOBILE_RE.fullmatch(mobile):
            raise RegistrationOtpError("Enter a valid 10-digit mobile number.", 422)
        now = cls._now()
        cls._cleanup_old_rows(now)
        # Keep the limiter rows locked until the active challenge is inspected/created.
        # This serializes simultaneous sends for the same mobile across workers.
        cls._allow_send(mobile, client_ip, now, commit=False)

        # Return a neutral result when delivery is not configured, without falling back to registration.
        try:
            provider = cls._provider()
        except Exception:
            current_app.logger.exception("Registration OTP provider configuration failed.")
            db.session.commit()
            raise RegistrationOtpError("Registration verification is temporarily unavailable.", 503) from None

        mobile_key = cls._mobile_key(mobile)
        active = RegistrationOtpChallenge.query.filter_by(mobile_key=mobile_key).filter(
            RegistrationOtpChallenge.verified_at.is_(None),
            RegistrationOtpChallenge.consumed_at.is_(None),
            RegistrationOtpChallenge.expires_at > now,
            RegistrationOtpChallenge.otp_verifier.isnot(None),
        ).order_by(RegistrationOtpChallenge.created_at.desc()).with_for_update().first()
        if active and active.resend_after > now:
            db.session.commit()
            return {
                "challenge_id": active.id,
                "expires_in": max(0, int((active.expires_at - now).total_seconds())),
                "resend_after": max(0, int((active.resend_after - now).total_seconds())),
                "message": GENERIC_MESSAGE,
            }

        email = data["email"].strip().lower()
        if User.query.filter_by(mobile=mobile).first() or User.query.filter_by(email=email).first():
            db.session.commit()
            return {"challenge_id": str(uuid.uuid4()), "expires_in": OTP_TTL_SECONDS,
                    "resend_after": OTP_RESEND_SECONDS, "message": GENERIC_MESSAGE}

        if active:
            active.otp_verifier = None
            active.ticket_verifier = None
        challenge_id = str(uuid.uuid4())
        code = f"{secrets.randbelow(1_000_000):06d}"
        challenge = RegistrationOtpChallenge(
            id=challenge_id,
            mobile_key=mobile_key,
            otp_verifier=cls._otp_verifier(challenge_id, mobile_key, code),
            registration_commitment=cls._commitment(data),
            created_at=now,
            expires_at=now + timedelta(seconds=OTP_TTL_SECONDS),
            resend_after=now + timedelta(seconds=OTP_RESEND_SECONDS),
            failed_attempts=0,
        )
        db.session.add(challenge)
        db.session.commit()
        try:
            accepted = provider.send_sms(
                recipient=mobile,
                message=f"Your Police Bharti registration OTP is {code}. It expires in 5 minutes.",
                idempotency_key=f"registration-otp:{challenge_id}",
                timeout=current_app.config.get("SMS_REQUEST_TIMEOUT", 5),
            )
            if accepted is not True:
                raise SmsPermanentError(code="provider_rejected")
        except (SmsPermanentError, SmsTransientError) as error:
            challenge.otp_verifier = None
            db.session.commit()
            current_app.logger.warning(
                "Registration OTP delivery failed (error_type=%s).",
                type(error).__name__,
            )
            raise RegistrationOtpError("Registration verification is temporarily unavailable.", 503) from None
        except Exception:
            challenge.otp_verifier = None
            db.session.commit()
            current_app.logger.warning("Registration OTP provider failed.")
            raise RegistrationOtpError("Registration verification is temporarily unavailable.", 503) from None

        return {"challenge_id": challenge_id, "expires_in": OTP_TTL_SECONDS,
                "resend_after": OTP_RESEND_SECONDS, "message": GENERIC_MESSAGE}

    @classmethod
    def verify_otp(cls, challenge_id, code, client_ip):
        now = cls._now()
        cls._allow_verify(client_ip, now)
        challenge = db.session.execute(
            select(RegistrationOtpChallenge).where(RegistrationOtpChallenge.id == challenge_id)
            .with_for_update()
        ).scalar_one_or_none()
        if (not challenge or not isinstance(code, str) or len(code) != 6 or not code.isascii()
                or not code.isdigit() or not challenge.otp_verifier
                or challenge.verified_at is not None or challenge.consumed_at is not None
                or challenge.expires_at <= now or challenge.failed_attempts >= OTP_MAX_ATTEMPTS):
            if challenge and challenge.expires_at <= now:
                challenge.otp_verifier = None
                db.session.commit()
            else:
                db.session.rollback()
            raise RegistrationOtpError(INVALID_MESSAGE)

        expected = cls._otp_verifier(challenge.id, challenge.mobile_key, code)
        if not hmac.compare_digest(challenge.otp_verifier, expected):
            challenge.failed_attempts += 1
            if challenge.failed_attempts >= OTP_MAX_ATTEMPTS:
                challenge.otp_verifier = None
            db.session.commit()
            raise RegistrationOtpError(INVALID_MESSAGE)

        ticket = secrets.token_urlsafe(32)
        challenge.otp_verifier = None
        challenge.verified_at = now
        challenge.ticket_verifier = cls._ticket_verifier(ticket)
        challenge.ticket_expires_at = now + timedelta(seconds=TICKET_TTL_SECONDS)
        db.session.commit()
        return {"verified": True, "registration_ticket": ticket,
                "expires_in": TICKET_TTL_SECONDS}

    @classmethod
    def consume_ticket(cls, data, ticket):
        if not isinstance(ticket, str) or len(ticket) < 32 or len(ticket) > 128:
            raise RegistrationOtpError(INVALID_MESSAGE)
        verifier = cls._ticket_verifier(ticket)
        challenge = db.session.execute(
            select(RegistrationOtpChallenge).where(
                RegistrationOtpChallenge.ticket_verifier == verifier
            ).with_for_update()
        ).scalar_one_or_none()
        now = cls._now()
        commitment = cls._commitment(data)
        if (not challenge or challenge.verified_at is None or challenge.consumed_at is not None
                or challenge.ticket_expires_at is None or challenge.ticket_expires_at <= now
                or not hmac.compare_digest(challenge.registration_commitment, commitment)
                or not hmac.compare_digest(challenge.mobile_key, cls._mobile_key(data["mobile"].strip()))):
            db.session.rollback()
            raise RegistrationOtpError(INVALID_MESSAGE)
        challenge.consumed_at = now
        return challenge
