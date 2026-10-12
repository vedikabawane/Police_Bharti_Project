from datetime import datetime

from app.extensions import db


class RegistrationOtpChallenge(db.Model):
    __tablename__ = "registration_otp_challenges"

    id = db.Column(db.String(36), primary_key=True)
    mobile_key = db.Column(db.String(64), nullable=False, index=True)
    otp_verifier = db.Column(db.String(64), nullable=True)
    registration_commitment = db.Column(db.String(64), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)
    resend_after = db.Column(db.DateTime, nullable=False)
    failed_attempts = db.Column(db.Integer, nullable=False, default=0)
    verified_at = db.Column(db.DateTime, nullable=True)
    ticket_verifier = db.Column(db.String(64), nullable=True, unique=True)
    ticket_expires_at = db.Column(db.DateTime, nullable=True)
    consumed_at = db.Column(db.DateTime, nullable=True)


class RegistrationOtpRateLimit(db.Model):
    __tablename__ = "registration_otp_rate_limits"

    key_hash = db.Column(db.String(64), primary_key=True)
    window_started_at = db.Column(db.DateTime, nullable=False)
    attempts = db.Column(db.Integer, nullable=False, default=0)
