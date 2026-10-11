import os
import re
from dataclasses import dataclass
from pathlib import Path, PureWindowsPath
from uuid import uuid4

from flask import current_app
from werkzeug.datastructures import FileStorage

from app.utils.storage_paths import get_upload_root


_VIDEO_TYPES = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
}
_STORAGE_KEY_PATTERN = re.compile(r"video_[0-9a-f]{32}\.(mp4|webm|mov)\Z")


class VideoFileValidationError(ValueError):
    pass


@dataclass(frozen=True)
class StoredVideoFile:
    storage_key: str
    original_filename: str
    mime_type: str
    file_size_bytes: int


def get_video_directory() -> Path:
    configured_directory = current_app.config.get("VIDEO_UPLOAD_DIRECTORY")
    if configured_directory:
        return Path(configured_directory).expanduser().resolve()
    return get_upload_root() / "videos"


def get_video_max_size_bytes() -> int:
    try:
        size_mb = int(current_app.config.get("MAX_VIDEO_SIZE_MB", 200))
    except (TypeError, ValueError) as error:
        raise VideoFileValidationError("The configured video upload size limit is invalid.") from error
    if size_mb < 1:
        raise VideoFileValidationError("The configured video upload size limit must be positive.")
    return size_mb * 1024 * 1024


def _safe_original_filename(filename: str) -> str:
    normalized = str(filename).replace("\\", "/")
    return PureWindowsPath(normalized).name[:255]


def _validate_video(uploaded_file: FileStorage):
    if uploaded_file is None or not uploaded_file.filename:
        raise VideoFileValidationError("A video file is required.")

    original_filename = _safe_original_filename(uploaded_file.filename)
    extension = Path(original_filename).suffix.lower()
    expected_mime = _VIDEO_TYPES.get(extension)
    if not expected_mime:
        raise VideoFileValidationError("Only MP4, WebM, or MOV video files are allowed.")

    submitted_mime = (uploaded_file.mimetype or "").split(";", 1)[0].strip().lower()
    if submitted_mime != expected_mime:
        raise VideoFileValidationError("The uploaded video MIME type does not match its file extension.")

    max_size = get_video_max_size_bytes()
    stream = uploaded_file.stream
    if hasattr(stream, "seek"):
        stream.seek(0)
    contents = stream.read(max_size + 1)
    if not contents:
        raise VideoFileValidationError("The uploaded video is empty.")
    if len(contents) > max_size:
        limit_mb = current_app.config.get("MAX_VIDEO_SIZE_MB", 200)
        raise VideoFileValidationError(f"Video files must be {limit_mb} MB or smaller.")

    if extension == ".mp4" and not (
        len(contents) >= 12 and contents[4:8] == b"ftyp"
    ):
        raise VideoFileValidationError("The uploaded file does not have a valid MP4 signature.")
    if extension == ".webm" and not (
        contents.startswith(b"\x1a\x45\xdf\xa3")
        and b"webm" in contents[:4096].lower()
    ):
        raise VideoFileValidationError("The uploaded file does not have a valid WebM signature.")
    if extension == ".mov" and not (
        len(contents) >= 12
        and contents[4:8] == b"ftyp"
        and b"qt  " in contents[8:32]
    ):
        raise VideoFileValidationError("The uploaded file does not have a valid MOV signature.")

    return contents, original_filename, expected_mime, extension


def save_video_file(uploaded_file: FileStorage) -> StoredVideoFile:
    contents, original_filename, mime_type, extension = _validate_video(uploaded_file)
    directory = get_video_directory()
    directory.mkdir(parents=True, exist_ok=True)

    for _ in range(3):
        storage_key = f"video_{uuid4().hex}{extension}"
        destination = directory / storage_key
        descriptor = None
        created = False
        try:
            descriptor = os.open(destination, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            created = True
            with os.fdopen(descriptor, "wb") as stored_file:
                descriptor = None
                stored_file.write(contents)
            return StoredVideoFile(
                storage_key=storage_key,
                original_filename=original_filename,
                mime_type=mime_type,
                file_size_bytes=len(contents),
            )
        except FileExistsError:
            continue
        except OSError as error:
            if descriptor is not None:
                os.close(descriptor)
            if created:
                destination.unlink(missing_ok=True)
            raise OSError("Unable to save the uploaded video.") from error
    raise OSError("Unable to generate a unique video filename.")


def resolve_video_path(storage_key: str) -> Path:
    if not isinstance(storage_key, str) or not _STORAGE_KEY_PATTERN.fullmatch(storage_key):
        raise ValueError("Invalid video storage key.")
    directory = get_video_directory().resolve()
    destination = directory / storage_key
    if destination.is_symlink():
        raise ValueError("Invalid video storage key.")
    try:
        destination.resolve(strict=False).relative_to(directory)
    except ValueError as error:
        raise ValueError("Invalid video storage key.") from error
    return destination


def delete_video_file(storage_key: str) -> bool:
    destination = resolve_video_path(storage_key)
    if not destination.exists():
        return False
    destination.unlink()
    return True
