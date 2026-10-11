"""Shared persistent upload root for all locally stored media."""
from pathlib import Path

from flask import current_app, has_app_context


def get_upload_root() -> Path:
    if has_app_context():
        configured_root = current_app.config.get("UPLOAD_ROOT")
        if configured_root:
            return Path(configured_root).expanduser().resolve()
    return Path(__file__).resolve().parents[2] / "uploads"
