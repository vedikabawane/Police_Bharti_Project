import unittest
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from flask import Flask
from werkzeug.datastructures import FileStorage

from app.utils.study_material_storage import (
    delete_study_material_pdf,
    save_study_material_pdf,
)


VALID_PDF = b"%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF"


class StudyMaterialStorageTest(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = TemporaryDirectory()
        self.storage_directory = Path(self.temporary_directory.name) / "study_materials"
        self.app = Flask(__name__)
        self.app.config["STUDY_MATERIAL_MAX_FILE_SIZE"] = 20 * 1024 * 1024
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.storage_patch = patch(
            "app.utils.study_material_storage.get_study_material_directory",
            return_value=self.storage_directory,
        )
        self.storage_patch.start()

    def tearDown(self):
        self.storage_patch.stop()
        self.app_context.pop()
        self.temporary_directory.cleanup()

    @staticmethod
    def _file(contents=VALID_PDF, filename="lesson.pdf", content_type="application/pdf"):
        return FileStorage(
            stream=BytesIO(contents),
            filename=filename,
            content_type=content_type,
        )

    def test_valid_pdf_is_accepted_and_stored(self):
        stored = save_study_material_pdf(self._file())
        self.assertEqual((self.storage_directory / stored.storage_key).read_bytes(), VALID_PDF)
        self.assertEqual(stored.file_size_bytes, len(VALID_PDF))
        self.assertEqual(stored.mime_type, "application/pdf")

    def test_text_renamed_to_pdf_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "signature"):
            save_study_material_pdf(self._file(b"plain text", "renamed.pdf"))

    def test_wrong_mime_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "MIME type"):
            save_study_material_pdf(self._file(content_type="application/octet-stream"))

    def test_wrong_extension_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "extension"):
            save_study_material_pdf(self._file(filename="lesson.txt"))

    def test_empty_file_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "empty"):
            save_study_material_pdf(self._file(b""))

    def test_invalid_pdf_signature_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "signature"):
            save_study_material_pdf(self._file(b"not a PDF document"))

    def test_file_larger_than_configured_limit_is_rejected(self):
        self.app.config["STUDY_MATERIAL_MAX_FILE_SIZE"] = 20
        with self.assertRaisesRegex(ValueError, "20 bytes"):
            save_study_material_pdf(self._file(b"%PDF-" + b"x" * 16))

    def test_generated_filename_is_unique(self):
        first = save_study_material_pdf(self._file())
        second = save_study_material_pdf(self._file())
        self.assertNotEqual(first.storage_key, second.storage_key)

    def test_file_is_stored_in_dedicated_study_materials_directory(self):
        stored = save_study_material_pdf(self._file())
        self.assertTrue(self.storage_directory.is_dir())
        self.assertTrue((self.storage_directory / stored.storage_key).is_file())

    def test_storage_key_is_relative_and_safe(self):
        stored = save_study_material_pdf(self._file())
        key_path = Path(stored.storage_key)
        self.assertFalse(key_path.is_absolute())
        self.assertEqual(key_path.name, stored.storage_key)
        self.assertRegex(stored.storage_key, r"^study_material_[0-9a-f]{32}\.pdf$")

    def test_delete_removes_stored_file_and_missing_file_is_safe(self):
        stored = save_study_material_pdf(self._file())
        self.assertTrue(delete_study_material_pdf(stored.storage_key))
        self.assertFalse((self.storage_directory / stored.storage_key).exists())
        self.assertFalse(delete_study_material_pdf(stored.storage_key))

    def test_path_traversal_storage_key_is_rejected(self):
        outside_file = Path(self.temporary_directory.name) / "outside.pdf"
        outside_file.write_bytes(VALID_PDF)
        for storage_key in ("../outside.pdf", "..\\outside.pdf", str(outside_file)):
            with self.subTest(storage_key=storage_key):
                with self.assertRaisesRegex(ValueError, "storage key"):
                    delete_study_material_pdf(storage_key)
        self.assertTrue(outside_file.exists())

    def test_failed_validation_creates_no_directory_or_file(self):
        with self.assertRaises(ValueError):
            save_study_material_pdf(self._file(b"invalid", "bad.pdf"))
        self.assertFalse(self.storage_directory.exists())

    def test_failed_save_removes_partial_file(self):
        with patch(
            "app.utils.study_material_storage.os.fdopen",
            side_effect=OSError("simulated write failure"),
        ):
            with self.assertRaisesRegex(OSError, "Unable to save"):
                save_study_material_pdf(self._file())
        self.assertEqual(list(self.storage_directory.iterdir()), [])

    def test_missing_file_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "required"):
            save_study_material_pdf(None)


if __name__ == "__main__":
    unittest.main()
