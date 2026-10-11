"""Validated storage for Current Affairs images."""
import os
import re
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from flask import current_app
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename

from app.utils.storage_paths import get_upload_root


_FORMATS = {
    ".jpg": ("image/jpeg", b"jpeg"),
    ".jpeg": ("image/jpeg", b"jpeg"),
    ".png": ("image/png", b"png"),
    ".webp": ("image/webp", b"webp"),
}
_KEY = re.compile(r"current_affair_image_[0-9a-f]{32}\.(?:jpg|jpeg|png|webp)\Z")


@dataclass(frozen=True)
class StoredCurrentAffairImage:
    storage_key: str
    original_filename: str
    mime_type: str
    file_size_bytes: int


def get_current_affair_image_directory():
    return get_upload_root() / "current_affairs" / "images"


def _valid_signature(data, image_format):
    if image_format == b"jpeg":
        return data.startswith(b"\xff\xd8\xff")
    if image_format == b"png":
        return data.startswith(b"\x89PNG\r\n\x1a\n")
    return len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP"


def save_current_affair_image(uploaded_file: FileStorage):
    if uploaded_file is None or not uploaded_file.filename:
        raise ValueError("An image file is required.")
    safe_name = secure_filename(uploaded_file.filename)
    extension = Path(safe_name).suffix.lower()
    expected = _FORMATS.get(extension)
    if expected is None:
        raise ValueError("Only JPG, JPEG, PNG, and WEBP images are allowed.")
    mime_type, image_format = expected
    actual_mime = (uploaded_file.mimetype or "").split(";", 1)[0].strip().lower()
    if actual_mime != mime_type:
        raise ValueError("The uploaded file type does not match its image extension.")
    max_size = int(current_app.config.get("CURRENT_AFFAIR_IMAGE_MAX_FILE_SIZE", 5 * 1024 * 1024))
    if max_size < 1:
        raise ValueError("The configured image upload size limit must be positive.")
    uploaded_file.stream.seek(0)
    contents = uploaded_file.stream.read(max_size + 1)
    if not contents:
        raise ValueError("The uploaded image is empty.")
    if len(contents) > max_size:
        raise ValueError(f"Images must be {max_size} bytes or smaller.")
    if not _valid_signature(contents, image_format):
        raise ValueError("The uploaded file is not a valid supported image.")

    directory = get_current_affair_image_directory().resolve()
    directory.mkdir(parents=True, exist_ok=True)
    for _ in range(3):
        key = f"current_affair_image_{uuid4().hex}{extension}"
        destination = directory / key
        descriptor = None
        try:
            descriptor = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(descriptor, "wb") as output:
                descriptor = None
                output.write(contents)
            return StoredCurrentAffairImage(key, safe_name[:255], mime_type, len(contents))
        except FileExistsError:
            continue
        except OSError as error:
            if descriptor is not None:
                os.close(descriptor)
            destination.unlink(missing_ok=True)
            raise OSError("Unable to save the Current Affairs image.") from error
    raise OSError("Unable to generate a unique Current Affairs image filename.")


def resolve_current_affair_image_path(storage_key):
    if not isinstance(storage_key, str) or not _KEY.fullmatch(storage_key):
        raise ValueError("Invalid Current Affairs image storage key.")
    directory = get_current_affair_image_directory().resolve()
    path = directory / storage_key
    if path.is_symlink():
        raise ValueError("Invalid Current Affairs image storage key.")
    try:
        path.resolve(strict=False).relative_to(directory)
    except ValueError as error:
        raise ValueError("Invalid Current Affairs image storage key.") from error
    return path


def delete_current_affair_image(storage_key):
    path = resolve_current_affair_image_path(storage_key)
    if path.exists():
        path.unlink()
        return True
    return False
