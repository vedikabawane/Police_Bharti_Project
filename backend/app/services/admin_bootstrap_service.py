import re

from flask import current_app
from marshmallow import ValidationError, validate
from sqlalchemy.exc import SQLAlchemyError

from app.extensions import db
from app.models import User
from app.utils.password import hash_password


class AdminBootstrapError(ValueError):
    """Raised when enabled initial Admin setup cannot safely complete."""


def _validated_bootstrap_values(config):
    name = config.get("ADMIN_NAME", "").strip()
    email = config.get("ADMIN_EMAIL", "").strip().lower()
    password = config.get("ADMIN_PASSWORD", "")
    mobile = config.get("ADMIN_MOBILE", "").strip() or None

    if not 2 <= len(name) <= 100:
        raise AdminBootstrapError("ADMIN_NAME must contain 2 to 100 characters.")
    if not email or len(email) > 255:
        raise AdminBootstrapError("ADMIN_EMAIL must be a valid email address.")
    try:
        validate.Email()(email)
    except ValidationError:
        raise AdminBootstrapError("ADMIN_EMAIL must be a valid email address.") from None
    if (
        not isinstance(password, str)
        or len(password) < 12
        or len(password.encode("utf-8")) > 72
        or password.isspace()
        or password == "CHANGE_TO_A_STRONG_UNIQUE_PASSWORD"
    ):
        raise AdminBootstrapError(
            "ADMIN_PASSWORD must be 12 or more characters and no more than "
            "72 UTF-8 bytes; replace the example placeholder."
        )
    if mobile and not re.fullmatch(r"[6-9][0-9]{9}", mobile):
        raise AdminBootstrapError(
            "ADMIN_MOBILE must be blank or a valid 10-digit mobile number."
        )

    return name, email, password, mobile


def bootstrap_initial_admin():
    """Create one initial Admin without modifying existing accounts."""
    config = current_app.config
    if not config.get("ADMIN_BOOTSTRAP_ENABLED", False):
        return False
    if config.get("APP_ENV") != "development":
        raise AdminBootstrapError(
            "Initial Admin bootstrap is permitted only in development."
        )

    name, email, password, mobile = _validated_bootstrap_values(config)

    try:
        with db.session.begin():
            configured_user = User.query.filter_by(email=email).first()
            if configured_user is not None:
                if configured_user.role != "admin":
                    raise AdminBootstrapError(
                        "ADMIN_EMAIL is already assigned to a non-Admin account."
                    )
                return False

            existing_admin = User.query.filter_by(role="admin").first()
            if existing_admin is not None:
                return False

            if mobile and User.query.filter_by(mobile=mobile).first() is not None:
                raise AdminBootstrapError(
                    "ADMIN_MOBILE is already assigned to another account."
                )

            db.session.add(
                User(
                    name=name,
                    email=email,
                    mobile=mobile,
                    password_hash=hash_password(password),
                    role="admin",
                    is_active=True,
                    email_verified=False,
                    mobile_verified=False,
                )
            )
    except AdminBootstrapError:
        db.session.rollback()
        raise
    except SQLAlchemyError:
        db.session.rollback()
        raise AdminBootstrapError(
            "Initial Admin bootstrap failed; no account was created."
        ) from None

    current_app.logger.info("Initial Admin account created successfully.")
    return True
