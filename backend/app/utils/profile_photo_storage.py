from pathlib import Path
from uuid import uuid4

from werkzeug.datastructures import FileStorage

from app.utils.storage_paths import get_upload_root


MAX_PROFILE_PHOTO_SIZE = 5 * 1024 * 1024
_ALLOWED_FORMATS = {
    ".jpg": ("jpeg", "image/jpeg"),
    ".jpeg": ("jpeg", "image/jpeg"),
    ".png": ("png", "image/png"),
    ".webp": ("webp", "image/webp"),
}


def get_profile_photo_directory() -> Path:
    return get_upload_root() / "profile_photos"


def _matches_image_format(contents: bytes, image_format: str) -> bool:
    if image_format == "jpeg":
        return contents.startswith(b"\xff\xd8\xff")
    if image_format == "png":
        return contents.startswith(b"\x89PNG\r\n\x1a\n")
    if image_format == "webp":
        return (
            len(contents) >= 12
            and contents[:4] == b"RIFF"
            and contents[8:12] == b"WEBP"
        )
    return False


def save_profile_photo(uploaded_file: FileStorage, user_id: int) -> str:
    extension = Path(uploaded_file.filename or "").suffix.lower()
    file_format = _ALLOWED_FORMATS.get(extension)
    if not file_format:
        raise ValueError("Only JPG, PNG, and WEBP profile photos are allowed.")

    image_format, expected_mimetype = file_format
    if uploaded_file.mimetype != expected_mimetype:
        raise ValueError("The uploaded file type does not match its image extension.")

    contents = uploaded_file.stream.read(MAX_PROFILE_PHOTO_SIZE + 1)
    if not contents:
        raise ValueError("The uploaded photo is empty.")
    if len(contents) > MAX_PROFILE_PHOTO_SIZE:
        raise ValueError("Profile photos must be 5 MB or smaller.")
    if not _matches_image_format(contents, image_format):
        raise ValueError("The uploaded file is not a valid supported image.")

    directory = get_profile_photo_directory()
    directory.mkdir(parents=True, exist_ok=True)

    filename = f"student_{user_id}_{uuid4().hex}{extension}"
    destination = directory / filename
    destination.write_bytes(contents)

    return f"/uploads/profile_photos/{filename}"


def delete_profile_photo(photo_path: str) -> None:
    filename = Path(photo_path).name
    if filename != photo_path.rsplit("/", 1)[-1]:
        raise ValueError("Invalid stored profile photo path.")

    photo_file = get_profile_photo_directory() / filename
    photo_file.unlink(missing_ok=True)
