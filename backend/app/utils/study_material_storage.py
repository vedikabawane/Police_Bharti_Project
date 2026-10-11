import os
import re
from dataclasses import dataclass
from pathlib import Path
from uuid import uuid4

from flask import current_app
from werkzeug.datastructures import FileStorage

from app.utils.storage_paths import get_upload_root


_PDF_MIME_TYPE = "application/pdf"
_PDF_SIGNATURE = b"%PDF-"
_STORAGE_KEY_PATTERN = re.compile(r"study_material_[0-9a-f]{32}\.pdf\Z")


@dataclass(frozen=True)
class StoredStudyMaterialFile:
    storage_key: str
    original_filename: str
    mime_type: str
    file_size_bytes: int


def get_study_material_directory() -> Path:
    return get_upload_root() / "study_materials"


def _read_validated_pdf(uploaded_file: FileStorage) -> bytes:
    if uploaded_file is None or not uploaded_file.filename:
        raise ValueError("A PDF file is required.")

    original_filename = uploaded_file.filename
    if Path(original_filename).suffix.lower() != ".pdf":
        raise ValueError("Only files with a .pdf extension are allowed.")

    mime_type = (uploaded_file.mimetype or "").split(";", 1)[0].strip().lower()
    if mime_type != _PDF_MIME_TYPE:
        raise ValueError("The uploaded file must have MIME type application/pdf.")

    max_file_size = current_app.config.get("STUDY_MATERIAL_MAX_FILE_SIZE", 20 * 1024 * 1024)
    try:
        max_file_size = int(max_file_size)
    except (TypeError, ValueError) as error:
        raise ValueError("The configured PDF upload size limit is invalid.") from error
    if max_file_size < 1:
        raise ValueError("The configured PDF upload size limit must be positive.")

    stream = uploaded_file.stream
    if hasattr(stream, "seek"):
        stream.seek(0)
    contents = stream.read(max_file_size + 1)

    if not contents:
        raise ValueError("The uploaded PDF is empty.")
    if not contents.startswith(_PDF_SIGNATURE):
        raise ValueError("The uploaded file does not have a valid PDF signature.")
    if len(contents) > max_file_size:
        raise ValueError(f"PDF files must be {max_file_size} bytes or smaller.")

    return contents


def save_study_material_pdf(uploaded_file: FileStorage) -> StoredStudyMaterialFile:
    contents = _read_validated_pdf(uploaded_file)
    directory = get_study_material_directory()
    directory.mkdir(parents=True, exist_ok=True)

    for _ in range(3):
        storage_key = f"study_material_{uuid4().hex}.pdf"
        destination = directory / storage_key
        descriptor = None
        created = False
        try:
            descriptor = os.open(
                destination,
                os.O_WRONLY | os.O_CREAT | os.O_EXCL,
                0o600,
            )
            created = True
            with os.fdopen(descriptor, "wb") as stored_file:
                descriptor = None
                stored_file.write(contents)
            return StoredStudyMaterialFile(
                storage_key=storage_key,
                original_filename=uploaded_file.filename,
                mime_type=_PDF_MIME_TYPE,
                file_size_bytes=len(contents),
            )
        except FileExistsError:
            continue
        except OSError as error:
            if descriptor is not None:
                os.close(descriptor)
            if created:
                destination.unlink(missing_ok=True)
            raise OSError("Unable to save the study material PDF.") from error

    raise OSError("Unable to generate a unique study material filename.")


def delete_study_material_pdf(storage_key: str) -> bool:
    destination = resolve_study_material_path(storage_key)

    if not destination.exists():
        return False

    destination.unlink()
    return True


def resolve_study_material_path(storage_key: str) -> Path:
    """Resolve a generated storage key to a contained, non-symlink PDF path."""
    if not isinstance(storage_key, str) or not _STORAGE_KEY_PATTERN.fullmatch(storage_key):
        raise ValueError("Invalid study material storage key.")

    directory = get_study_material_directory().resolve()
    destination = directory / storage_key
    if destination.is_symlink():
        raise ValueError("Invalid study material storage key.")

    try:
        destination.resolve(strict=False).relative_to(directory)
    except ValueError as error:
        raise ValueError("Invalid study material storage key.") from error

    return destination
