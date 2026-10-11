from pathlib import Path
from uuid import uuid4

from flask import current_app
from werkzeug.utils import secure_filename

from app.utils.storage_paths import get_upload_root


_ALLOWED_FORMATS = {
    ".jpg": ("jpeg", "image/jpeg"),
    ".jpeg": ("jpeg", "image/jpeg"),
    ".png": ("png", "image/png"),
    ".webp": ("webp", "image/webp"),
}


def get_team_member_photo_directory():
    return get_upload_root() / "team_members"


def _matches_image_format(contents, image_format):
    if image_format == "jpeg":
        return contents.startswith(b"\xff\xd8\xff")
    if image_format == "png":
        return contents.startswith(b"\x89PNG\r\n\x1a\n")
    return len(contents) >= 12 and contents[:4] == b"RIFF" and contents[8:12] == b"WEBP"


def save_team_member_photo(uploaded_file):
    extension = Path(secure_filename(uploaded_file.filename or "")).suffix.lower()
    format_info = _ALLOWED_FORMATS.get(extension)
    if not format_info:
        raise ValueError("Only JPG, JPEG, PNG, and WEBP photos are allowed.")
    image_format, expected_mimetype = format_info
    if uploaded_file.mimetype != expected_mimetype:
        raise ValueError("The uploaded file type does not match its image extension.")

    max_size = int(current_app.config.get("TEAM_MEMBER_PHOTO_MAX_FILE_SIZE", 5 * 1024 * 1024))
    contents = uploaded_file.stream.read(max_size + 1)
    if not contents:
        raise ValueError("The uploaded photo is empty.")
    if len(contents) > max_size:
        raise ValueError(f"Photos must be {max_size // (1024 * 1024)} MB or smaller.")
    if not _matches_image_format(contents, image_format):
        raise ValueError("The uploaded file is not a valid supported image.")

    storage_key = f"{uuid4().hex}{extension}"
    directory = get_team_member_photo_directory().resolve()
    directory.mkdir(parents=True, exist_ok=True)
    destination = (directory / storage_key).resolve()
    if destination.parent != directory:
        raise ValueError("Invalid photo destination.")
    destination.write_bytes(contents)
    return storage_key, secure_filename(uploaded_file.filename or "photo"), expected_mimetype, len(contents)


def delete_team_member_photo(storage_key):
    if not storage_key or Path(storage_key).name != storage_key:
        return
    directory = get_team_member_photo_directory().resolve()
    photo_path = (directory / storage_key).resolve()
    if photo_path.parent == directory:
        photo_path.unlink(missing_ok=True)
