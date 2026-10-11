import unittest
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from flask import Flask
from werkzeug.datastructures import FileStorage

from app.models.previous_year_pdf_model import PreviousYearPDF
from app.utils.previous_year_pdf_storage import (
    delete_previous_year_pdf,
    resolve_previous_year_pdf_path,
    save_previous_year_pdf,
)


VALID_PDF = b"%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF"


class PreviousYearPDFStorageTest(unittest.TestCase):
    def setUp(self):
        self.temporary_directory = TemporaryDirectory()
        self.storage_directory = Path(self.temporary_directory.name) / "previous_year_pdfs"
        self.app = Flask(__name__)
        self.app.config["PREVIOUS_YEAR_PDF_MAX_FILE_SIZE"] = 20 * 1024 * 1024
        self.app_context = self.app.app_context()
        self.app_context.push()
        self.storage_patch = patch(
            "app.utils.previous_year_pdf_storage.get_previous_year_pdf_directory",
            return_value=self.storage_directory,
        )
        self.storage_patch.start()

    def tearDown(self):
        self.storage_patch.stop()
        self.app_context.pop()
        self.temporary_directory.cleanup()

    @staticmethod
    def _file(contents=VALID_PDF, filename="exam.pdf", content_type="application/pdf"):
        return FileStorage(stream=BytesIO(contents), filename=filename, content_type=content_type)

    def test_valid_pdf_is_accepted(self):
        stored = save_previous_year_pdf(self._file())
        self.assertEqual((self.storage_directory / stored.storage_key).read_bytes(), VALID_PDF)
        self.assertEqual(stored.mime_type, "application/pdf")
        self.assertEqual(stored.file_size_bytes, len(VALID_PDF))

    def test_invalid_extension_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "extension"):
            save_previous_year_pdf(self._file(filename="exam.txt"))

    def test_invalid_mime_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "MIME type"):
            save_previous_year_pdf(self._file(content_type="application/octet-stream"))

    def test_invalid_signature_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "signature"):
            save_previous_year_pdf(self._file(b"not a PDF"))

    def test_empty_file_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "empty"):
            save_previous_year_pdf(self._file(b""))

    def test_oversized_file_is_rejected(self):
        self.app.config["PREVIOUS_YEAR_PDF_MAX_FILE_SIZE"] = 20
        with self.assertRaisesRegex(ValueError, "20 bytes"):
            save_previous_year_pdf(self._file(b"%PDF-" + b"x" * 16))

    def test_generated_storage_filenames_are_unique(self):
        first = save_previous_year_pdf(self._file())
        second = save_previous_year_pdf(self._file())
        self.assertNotEqual(first.storage_key, second.storage_key)
        self.assertRegex(first.storage_key, r"^previous_year_pdf_[0-9a-f]{32}\.pdf$")

    def test_path_traversal_is_rejected(self):
        outside = Path(self.temporary_directory.name) / "outside.pdf"
        outside.write_bytes(VALID_PDF)
        for key in ("../outside.pdf", "..\\outside.pdf", str(outside)):
            with self.subTest(key=key), self.assertRaisesRegex(ValueError, "storage key"):
                resolve_previous_year_pdf_path(key)
        self.assertTrue(outside.exists())

    def test_delete_is_safe_and_missing_file_returns_false(self):
        stored = save_previous_year_pdf(self._file())
        self.assertTrue(delete_previous_year_pdf(stored.storage_key))
        self.assertFalse((self.storage_directory / stored.storage_key).exists())
        self.assertFalse(delete_previous_year_pdf(stored.storage_key))
        with self.assertRaisesRegex(ValueError, "storage key"):
            delete_previous_year_pdf("../outside.pdf")

    def test_failed_upload_cleans_up_partial_file(self):
        with patch(
            "app.utils.previous_year_pdf_storage.os.fdopen",
            side_effect=OSError("simulated write failure"),
        ), self.assertRaisesRegex(OSError, "Unable to save"):
            save_previous_year_pdf(self._file())
        self.assertEqual(list(self.storage_directory.iterdir()), [])

    def test_model_is_separate_table_with_required_indexes(self):
        self.assertEqual(PreviousYearPDF.__tablename__, "previous_year_pdfs")
        indexes = {index.name for index in PreviousYearPDF.__table__.indexes}
        self.assertTrue(
            {"ix_previous_year_pdfs_exam_year", "ix_previous_year_pdfs_exam_name",
             "ix_previous_year_pdfs_is_active"}.issubset(indexes)
        )


if __name__ == "__main__":
    unittest.main()
