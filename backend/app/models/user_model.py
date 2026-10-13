from datetime import datetime

from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.BigInteger().with_variant(db.Integer, "sqlite"), primary_key=True, autoincrement=True)

    name = db.Column(db.String(100), nullable=False)

    email = db.Column(
        db.String(255),
        nullable=False,
        unique=True,
        index=True
    )

    mobile = db.Column(
        db.String(15),
        nullable=True,
        unique=True,
        index=True
    )

    password_hash = db.Column(
        db.String(255),
        nullable=False
    )

    role = db.Column(
        db.String(20),
        nullable=False,
        default="student"
    )

    is_active = db.Column(
        db.Boolean,
        nullable=False,
        default=True
    )

    email_verified = db.Column(
        db.Boolean,
        nullable=False,
        default=False
    )

    mobile_verified = db.Column(db.Boolean, nullable=False, default=False, server_default=db.false())
    mobile_verified_at = db.Column(db.DateTime, nullable=True)

    sms_notifications_enabled = db.Column(
        db.Boolean,
        nullable=False,
        default=False,
        server_default=db.false(),
    )

    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    def __repr__(self):
        return f"<User {self.email}>"
