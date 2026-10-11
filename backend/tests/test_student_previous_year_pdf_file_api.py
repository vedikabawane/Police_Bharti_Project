import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import PreviousYearPDF, User


VALID_PDF = b"%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF"
API = "/api/student/previous-year-pdfs"


class StudentPreviousYearPDFFileAPITest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()
        cls.app.config.update(TESTING=True)
        cls.client = cls.app.test_client()
        with cls.app.app_context():
            db.create_all()

    def setUp(self):
        self.temp_dir = TemporaryDirectory()
        self.storage_dir = Path(self.temp_dir.name) / "previous_year_pdfs"
        self.storage_patch = patch(
            "app.utils.previous_year_pdf_storage.get_previous_year_pdf_directory",
            return_value=self.storage_dir,
        )
        self.storage_patch.start()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.drop_all()
        db.create_all()
        db.session.add_all([
            User(id=1, name="Student", email="student@test", password_hash="secret",
                 role="student", is_active=True),
            User(id=2, name="Admin", email="admin@test", password_hash="secret",
                 role="admin", is_active=True),
        ])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()
        self.storage_patch.stop()
        self.temp_dir.cleanup()

    @staticmethod
    def headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    def add_pdf(self, pdf_id, *, active=True, storage_key=None, filename="Police Bharti 2025.pdf"):
        pdf = PreviousYearPDF(
            id=pdf_id,
            title=f"Police Bharti {pdf_id}",
            exam_name="Maharashtra Police Bharti",
            exam_year=2025,
            description="Previous year question paper",
            storage_key=storage_key or f"previous_year_pdf_{pdf_id:032x}.pdf",
            original_filename=filename,
            mime_type="application/pdf",
            file_size_bytes=len(VALID_PDF),
            is_active=active,
        )
        db.session.add(pdf)
        db.session.commit()
        return pdf

    def write_file(self, storage_key, contents=VALID_PDF):
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        path = self.storage_dir / storage_key
        path.write_bytes(contents)
        return path

    def test_anonymous_cannot_view_or_download_and_student_can(self):
        pdf = self.add_pdf(1)
        self.write_file(pdf.storage_key)
        for endpoint in ("file", "download"):
            with self.subTest(endpoint=endpoint):
                self.assertEqual(self.client.get(f"{API}/1/{endpoint}").status_code, 401)
                self.assertEqual(self.client.get(
                    f"{API}/1/{endpoint}", headers=self.headers(2)
                ).status_code, 403)
                response = self.client.get(
                    f"{API}/1/{endpoint}", headers=self.headers(1)
                )
                self.assertEqual(response.status_code, 200)
                response.close()

    def test_view_returns_pdf_inline_without_exposing_storage_details(self):
        pdf = self.add_pdf(1)
        self.write_file(pdf.storage_key)
        response = self.client.get(f"{API}/1/file", headers=self.headers(1))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "application/pdf")
        self.assertIn("inline", response.headers.get("Content-Disposition", ""))
        self.assertEqual(response.data, VALID_PDF)
        exposed = f"{response.headers}\n{response.data}"
        self.assertNotIn(pdf.storage_key, exposed)
        self.assertNotIn(str(self.storage_dir), exposed)
        self.assertNotIn("uploads\\previous_year_pdfs", exposed)
        response.close()

    def test_download_returns_attachment_with_original_filename(self):
        pdf = self.add_pdf(1, filename="Maharashtra Police Bharti 2025.pdf")
        self.write_file(pdf.storage_key)
        response = self.client.get(f"{API}/1/download", headers=self.headers(1))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "application/pdf")
        disposition = response.headers.get("Content-Disposition", "")
        self.assertIn("attachment", disposition)
        self.assertIn("Maharashtra Police Bharti 2025.pdf", disposition)
        self.assertEqual(response.data, VALID_PDF)
        self.assertNotIn(str(self.storage_dir), str(response.headers))
        response.close()

    def test_inactive_and_unknown_pdfs_return_404_for_view_and_download(self):
        inactive = self.add_pdf(1, active=False)
        self.write_file(inactive.storage_key)
        for pdf_id in (1, 999):
            for endpoint in ("file", "download"):
                with self.subTest(pdf_id=pdf_id, endpoint=endpoint):
                    response = self.client.get(f"{API}/{pdf_id}/{endpoint}", headers=self.headers(1))
                    self.assertEqual(response.status_code, 404)

    def test_missing_physical_file_returns_404_for_view_and_download(self):
        self.add_pdf(1)
        for endpoint in ("file", "download"):
            with self.subTest(endpoint=endpoint):
                response = self.client.get(f"{API}/1/{endpoint}", headers=self.headers(1))
                self.assertEqual(response.status_code, 404)
                self.assertNotIn(str(self.storage_dir), response.get_data(as_text=True))

    def test_unsafe_storage_key_cannot_access_file_outside_storage_directory(self):
        outside_file = Path(self.temp_dir.name) / "unrelated.pdf"
        outside_file.write_bytes(b"private data")
        self.add_pdf(1, storage_key="../unrelated.pdf")
        for endpoint in ("file", "download"):
            with self.subTest(endpoint=endpoint):
                response = self.client.get(f"{API}/1/{endpoint}", headers=self.headers(1))
                self.assertEqual(response.status_code, 404)
                self.assertNotIn(str(outside_file), response.get_data(as_text=True))
        self.assertEqual(outside_file.read_bytes(), b"private data")


if __name__ == "__main__":
    unittest.main()
