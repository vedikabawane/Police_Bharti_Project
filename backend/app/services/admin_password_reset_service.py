from flask import current_app
from marshmallow import ValidationError, validate
from sqlalchemy import func, select
from sqlalchemy.engine import make_url
from sqlalchemy.exc import ArgumentError, SQLAlchemyError
from sqlalchemy.orm import Session

from app.extensions import db
from app.models import User
from app.utils.password import hash_password


class AdminPasswordResetError(ValueError):
    """Raised when an Admin password reset cannot safely proceed."""


def validate_admin_password_reset_target(config, testing=False):
    if config.get("APP_ENV") != "development":
        raise AdminPasswordResetError(
            "Admin password reset is available only in development."
        )

    database_uri = config.get("SQLALCHEMY_DATABASE_URI")
    if not isinstance(database_uri, str) or not database_uri.strip():
        raise AdminPasswordResetError(
            "DATABASE_URL must explicitly identify the local development database."
        )

    try:
        parsed = make_url(database_uri)
    except (ArgumentError, TypeError, ValueError):
        raise AdminPasswordResetError(
            "DATABASE_URL must explicitly identify the local development database."
        ) from None

    if testing and parsed.drivername.startswith("sqlite"):
        return

    if (
        parsed.drivername != "mysql+pymysql"
        or parsed.host not in {"localhost", "127.0.0.1", "::1"}
        or parsed.database != "police_bharti_db"
    ):
        raise AdminPasswordResetError(
            "Admin password reset requires the configured local "
            "police_bharti_db MySQL database."
        )


def reset_existing_admin_password(email, new_password):
    validate_admin_password_reset_target(
        current_app.config,
        testing=current_app.testing,
    )
    normalized_email = email.strip().lower() if isinstance(email, str) else ""
    try:
        validate.Email()(normalized_email)
    except ValidationError:
        raise AdminPasswordResetError("Enter a valid Admin email address.") from None

    if (
        not isinstance(new_password, str)
        or len(new_password) < 12
        or len(new_password.encode("utf-8")) > 72
        or new_password.isspace()
    ):
        raise AdminPasswordResetError(
            "The new password must be at least 12 characters and no more than "
            "72 UTF-8 bytes."
        )

    try:
        with Session(db.engine) as session, session.begin():
            admin = session.scalar(
                select(User)
                .where(func.lower(User.email) == normalized_email)
                .with_for_update()
            )
            if admin is None:
                raise AdminPasswordResetError(
                    "No account exists for that email address."
                )
            if admin.role != "admin":
                raise AdminPasswordResetError(
                    "The selected account is not an Admin."
                )
            if not admin.is_active:
                raise AdminPasswordResetError(
                    "The selected Admin account is inactive."
                )

            admin.password_hash = hash_password(new_password)
            session.flush()
    except AdminPasswordResetError:
        raise
    except SQLAlchemyError:
        raise AdminPasswordResetError(
            "Admin password reset failed; the existing password was not changed."
        ) from None
