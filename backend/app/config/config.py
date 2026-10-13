import os
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import load_dotenv
from sqlalchemy.exc import ArgumentError
from sqlalchemy.engine import make_url


load_dotenv()


def _parse_bool(name, default=False):
    value = os.getenv(name)
    if value is None or not value.strip():
        return default
    normalized = value.strip().lower()
    if normalized in {"1", "true", "yes", "on"}:
        return True
    if normalized in {"0", "false", "no", "off"}:
        return False
    raise ValueError(f"{name} must be a boolean value.")


def _parse_cors_origins(value, app_env):
    if value is None:
        origins = [] if app_env == "production" else [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
    else:
        origins = [origin.strip() for origin in value.split(",") if origin.strip()]

    normalized = []
    for origin in origins:
        parsed = urlsplit(origin)
        try:
            parsed.port
        except ValueError:
            raise ValueError(
                "CORS_ORIGINS must contain valid HTTP(S) origins."
            ) from None
        if (
            "*" in parsed.netloc
            or parsed.scheme not in {"http", "https"}
            or not parsed.netloc
            or parsed.hostname is None
            or parsed.username is not None
            or parsed.password is not None
            or parsed.path not in {"", "/"}
            or parsed.query
            or parsed.fragment
        ):
            raise ValueError(
                "CORS_ORIGINS must contain comma-separated HTTP(S) origins "
                "without paths, credentials, wildcards, queries, or fragments."
            )
        if app_env == "production" and (
            parsed.scheme != "https"
            or parsed.hostname.lower() in {"localhost", "127.0.0.1", "::1", "0.0.0.0"}
        ):
            raise ValueError(
                "Production CORS_ORIGINS must use HTTPS and a public frontend host."
            )
        normalized.append(f"{parsed.scheme.lower()}://{parsed.netloc.lower()}")

    if app_env == "production" and not normalized:
        raise ValueError(
            "CORS_ORIGINS must explicitly list the production frontend origin(s)."
        )
    return list(dict.fromkeys(normalized))


def production_safe_log_level(level_name, app_env):
    """Apply the production logging restriction to a configured level."""
    normalized = str(level_name).upper()
    if app_env == "production" and normalized == "DEBUG":
        return "INFO"
    return normalized


_INSECURE_JWT_SECRETS = {
    "change-me",
    "changeme",
    "development-secret",
    "dev-secret",
    "example-secret",
    "jwt-secret",
    "password",
    "replace-me",
    "secret",
    "secret-key",
    "test-secret",
    "your-secret",
    "your-secret-key",
    "your-jwt-secret",
}


def validate_production_config(config):
    """Fail fast on unsafe production database and JWT configuration."""
    if config.get("APP_ENV") != "production":
        return

    database_url = config.get("SQLALCHEMY_DATABASE_URI")
    if not isinstance(database_url, str) or not database_url.strip():
        raise ValueError("DATABASE_URL is required in production.")

    try:
        parsed_url = make_url(database_url.strip())
    except (ArgumentError, TypeError, ValueError):
        raise ValueError("DATABASE_URL must be a valid MySQL/MariaDB URL.") from None

    if (
        parsed_url.drivername != "mysql+pymysql"
        or not parsed_url.host
        or not parsed_url.database
        or parsed_url.host.lower() in {"db_host", "database_host", "host"}
        or parsed_url.database.lower() in {"db_name", "database_name", "name"}
        or (parsed_url.username or "").lower() in {"user", "username"}
        or (parsed_url.password or "").lower()
        in {"password", "your_password", "change-me", "changeme", "secret"}
        or any(
            marker in value.lower()
            for value in (parsed_url.host, parsed_url.database, parsed_url.username or "")
            for marker in ("example", "placeholder", "your_", "your-", "<", ">")
        )
    ):
        raise ValueError(
            "DATABASE_URL must identify a configured MySQL/MariaDB host and database."
        )

    jwt_secret = config.get("JWT_SECRET_KEY")
    if (
        not isinstance(jwt_secret, str)
        or not jwt_secret.strip()
        or len(jwt_secret.encode("utf-8")) < 32
        or jwt_secret.strip().lower() in _INSECURE_JWT_SECRETS
        or any(marker in jwt_secret.lower() for marker in ("<", ">", "example", "placeholder"))
    ):
        raise ValueError(
            "JWT_SECRET_KEY must be a securely generated production secret of at least 32 UTF-8 bytes."
        )


class Config:
    APP_ENV = os.getenv("APP_ENV", "development").strip().lower()
    if APP_ENV not in {"development", "testing", "production"}:
        raise ValueError("APP_ENV must be development, testing, or production.")

    # Keep the interactive API console out of production unless explicitly enabled.
    SWAGGER_ENABLED = _parse_bool("SWAGGER_ENABLED", APP_ENV != "production")

    LOG_LEVEL = os.getenv(
        "LOG_LEVEL", "DEBUG" if APP_ENV == "development" else "INFO"
    ).strip().upper()
    if LOG_LEVEL not in {"DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"}:
        raise ValueError("LOG_LEVEL must be DEBUG, INFO, WARNING, ERROR, or CRITICAL.")
    LOG_LEVEL = production_safe_log_level(LOG_LEVEL, APP_ENV)

    # Debug is opt-in and always disabled in production.
    DEBUG = APP_ENV != "production" and _parse_bool("APP_DEBUG", False)
    CORS_ORIGINS = _parse_cors_origins(os.getenv("CORS_ORIGINS"), APP_ENV)

    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    SQLALCHEMY_ENGINE_OPTIONS = {"hide_parameters": True}
    TRUSTED_PROXY_HOPS = int(os.getenv("TRUSTED_PROXY_HOPS", "0"))

    MAIL_ENABLED = os.getenv("MAIL_ENABLED", "false").strip().lower() in {
        "1", "true", "yes", "on"
    }
    MAIL_HOST = os.getenv("MAIL_HOST", "").strip()
    MAIL_PORT = int(os.getenv("MAIL_PORT", "587"))
    MAIL_USERNAME = os.getenv("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.getenv("MAIL_PASSWORD", "")
    MAIL_USE_TLS = os.getenv("MAIL_USE_TLS", "true").strip().lower() in {
        "1", "true", "yes", "on"
    }
    MAIL_FROM = os.getenv("MAIL_FROM", "").strip()
    MAIL_TIMEOUT = int(os.getenv("MAIL_TIMEOUT", "10"))
    SMS_ENABLED = _parse_bool("SMS_ENABLED", False)
    SMS_PROVIDER = os.getenv("SMS_PROVIDER", "").strip().lower()
    SMS_REQUEST_TIMEOUT = float(os.getenv("SMS_REQUEST_TIMEOUT", "5"))
    SMS_MAX_ATTEMPTS = int(os.getenv("SMS_MAX_ATTEMPTS", "3"))
    APP_NAME = os.getenv("APP_NAME", "Police Bharti Platform").strip()
    FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "").strip()

    STUDY_MATERIAL_MAX_FILE_SIZE = int(
        os.getenv("STUDY_MATERIAL_MAX_FILE_SIZE", str(20 * 1024 * 1024))
    )
    PREVIOUS_YEAR_PDF_MAX_FILE_SIZE = int(
        os.getenv("PREVIOUS_YEAR_PDF_MAX_FILE_SIZE", str(20 * 1024 * 1024))
    )
    CURRENT_AFFAIR_IMAGE_MAX_FILE_SIZE = int(
        os.getenv("CURRENT_AFFAIR_IMAGE_MAX_FILE_SIZE", str(5 * 1024 * 1024))
    )
    MAX_VIDEO_SIZE_MB = int(os.getenv("MAX_VIDEO_SIZE_MB", "200"))
    TEAM_MEMBER_PHOTO_MAX_FILE_SIZE = int(
        os.getenv("TEAM_MEMBER_PHOTO_MAX_FILE_SIZE", str(5 * 1024 * 1024))
    )
    DEFAULT_UPLOAD_ROOT = str(Path(__file__).resolve().parents[2] / "uploads")
    UPLOAD_ROOT = os.getenv("UPLOAD_ROOT", DEFAULT_UPLOAD_ROOT).strip() or DEFAULT_UPLOAD_ROOT
    VIDEO_UPLOAD_DIRECTORY = os.getenv("VIDEO_UPLOAD_DIRECTORY", "").strip()

    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

    JSON_SORT_KEYS = False

    PERFORMANCE_STRONG_ACCURACY_THRESHOLD = float(
        os.getenv("PERFORMANCE_STRONG_ACCURACY_THRESHOLD", "75")
    )
    PERFORMANCE_MIN_TOPIC_QUESTIONS = int(
        os.getenv("PERFORMANCE_MIN_TOPIC_QUESTIONS", "5")
    )


def validate_sms_config(config):
    """Validate SMS settings without including configured values in errors."""
    if not config.get("SMS_ENABLED", False):
        return

    timeout = config.get("SMS_REQUEST_TIMEOUT")
    if not isinstance(timeout, (int, float)) or not 0 < timeout <= 60:
        raise ValueError("SMS_REQUEST_TIMEOUT must be greater than 0 and at most 60 seconds.")

    attempts = config.get("SMS_MAX_ATTEMPTS")
    if not isinstance(attempts, int) or not 1 <= attempts <= 5:
        raise ValueError("SMS_MAX_ATTEMPTS must be between 1 and 5.")

    provider = config.get("SMS_PROVIDER", "")
    if provider == "mock" and config.get("APP_ENV") != "production":
        return
    if not provider:
        raise ValueError("SMS_PROVIDER is required when SMS_ENABLED is true.")
    if provider == "mock":
        raise ValueError("The mock SMS provider cannot be enabled in production.")
    raise ValueError("SMS_PROVIDER has no installed provider adapter.")


