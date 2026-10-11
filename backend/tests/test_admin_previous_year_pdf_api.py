import unittest
from datetime import datetime, timedelta
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import PreviousYearPDF, User


VALID_PDF = b"%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF"
API = "/api/admin/previous-year-pdfs"


class AdminPreviousYearPDFAPITest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()
        cls.app.config.update(TESTING=True, PREVIOUS_YEAR_PDF_MAX_FILE_SIZE=20 * 1024 * 1024)
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
            User(id=3, name="Inactive Admin", email="inactive@test", password_hash="secret",
                 role="admin", is_active=False),
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

    @staticmethod
    def form(title="Maharashtra Police Bharti 2025", exam_name="Maharashtra Police Bharti",
             exam_year="2025", description="Official paper", pdf=VALID_PDF,
             filename="paper.pdf", content_type="application/pdf"):
        data = {"title": title, "exam_name": exam_name, "exam_year": exam_year,
                "description": description}
        if pdf is not None:
            data["pdf"] = (BytesIO(pdf), filename, content_type)
        return data

    def add_pdf(self, pdf_id, *, title=None, exam_name="Maharashtra Police Bharti",
                exam_year=2025, active=True, filename=None, created_at=None,
                storage_key=None, description="metadata"):
        pdf = PreviousYearPDF(
            id=pdf_id,
            title=title or f"Previous Year {pdf_id}",
            exam_name=exam_name,
            exam_year=exam_year,
            description=description,
            storage_key=storage_key or f"previous_year_pdf_{pdf_id:032x}.pdf",
            original_filename=filename or f"paper_{pdf_id}.pdf",
            mime_type="application/pdf",
            file_size_bytes=len(VALID_PDF),
            is_active=active,
            created_at=created_at or datetime(2026, 1, 1) + timedelta(days=pdf_id),
            updated_at=datetime(2026, 1, 2),
        )
        db.session.add(pdf)
        db.session.commit()
        return pdf

    def _upload(self, form=None, user_id=2):
        headers = self.headers(user_id) if user_id else {}
        return self.client.post(API, data=form or self.form(), headers=headers)

    def test_upload_authorization_anonymous_student_admin_and_inactive_admin(self):
        self.assertEqual(self._upload(user_id=None).status_code, 401)
        self.assertEqual(self._upload(user_id=1).status_code, 403)
        self.assertEqual(self._upload(user_id=3).status_code, 403)

    def test_admin_can_upload_and_response_is_safe(self):
        def create_with_sqlite_id(data):
            pdf = PreviousYearPDF(id=1, **data)
            db.session.add(pdf)
            db.session.commit()
            return pdf

        with patch("app.repositories.previous_year_pdf_repository.PreviousYearPDFRepository.create",
                   side_effect=create_with_sqlite_id):
            response = self._upload()
        self.assertEqual(response.status_code, 201, response.get_json())
        payload = response.get_json()["data"]
        self.assertEqual(payload["title"], "Maharashtra Police Bharti 2025")
        self.assertEqual(payload["exam_year"], 2025)
        self.assertNotIn("storage_key", payload)
        self.assertNotIn(str(self.storage_dir), str(response.get_json()))
        self.assertEqual(len(list(self.storage_dir.glob("*.pdf"))), 1)

    def test_upload_trims_required_text_and_allows_optional_description(self):
        def create_with_sqlite_id(data):
            pdf = PreviousYearPDF(id=1, **data)
            db.session.add(pdf)
            db.session.commit()
            return pdf

        with patch("app.repositories.previous_year_pdf_repository.PreviousYearPDFRepository.create",
                   side_effect=create_with_sqlite_id):
            response = self._upload(self.form(title="  2024 Paper ", exam_name=" Police ", description=""))
        self.assertEqual(response.status_code, 201, response.get_json())
        self.assertEqual(response.get_json()["data"]["title"], "2024 Paper")
        self.assertEqual(response.get_json()["data"]["exam_name"], "Police")

    def test_upload_rejects_missing_pdf_invalid_pdf_and_invalid_mime(self):
        self.assertEqual(self._upload(self.form(pdf=None)).status_code, 400)
        self.assertEqual(self._upload(self.form(pdf=b"not a pdf")).status_code, 400)
        self.assertEqual(self._upload(self.form(content_type="text/plain")).status_code, 400)
        self.assertFalse(self.storage_dir.exists())

    def test_upload_rejects_missing_or_blank_title_and_exam_name(self):
        for form in (
            self.form(title=""), self.form(title="   "),
            self.form(exam_name=""), self.form(exam_name="  "),
        ):
            with self.subTest(form=form):
                response = self._upload(form)
                self.assertEqual(response.status_code, 422, response.get_json())
        self.assertEqual(self._upload({"exam_name": "Police", "exam_year": "2025",
                                       "pdf": (BytesIO(VALID_PDF), "a.pdf", "application/pdf")}).status_code, 422)

    def test_upload_rejects_invalid_exam_year(self):
        self.assertEqual(self._upload(self.form(exam_year="twenty-five")).status_code, 422)

    def test_database_failure_rolls_back_and_cleans_uploaded_file(self):
        with patch("app.repositories.previous_year_pdf_repository.PreviousYearPDFRepository.create",
                   side_effect=RuntimeError("database unavailable")):
            response = self._upload()
        self.assertEqual(response.status_code, 500)
        self.assertEqual(list(self.storage_dir.iterdir()), [])
        self.assertEqual(PreviousYearPDF.query.count(), 0)

    def test_list_authorization_and_admin_response_shape(self):
        self.add_pdf(1)
        self.assertEqual(self.client.get(API).status_code, 401)
        self.assertEqual(self.client.get(API, headers=self.headers(1)).status_code, 403)
        self.assertEqual(self.client.get(API, headers=self.headers(3)).status_code, 403)
        response = self.client.get(API, headers=self.headers(2))
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["pagination"], {"page": 1, "per_page": 20, "total": 1, "pages": 1})
        self.assertEqual(set(body["data"]["previous_year_pdfs"][0]), {
            "id", "title", "exam_name", "exam_year", "description", "original_filename",
            "mime_type", "file_size_bytes", "is_active", "created_at", "updated_at",
        })
        self.assertNotIn("storage_key", str(body))
        self.assertNotIn(str(self.storage_dir), str(body))
        self.assertNotIn("backend\\uploads", str(body))

    def test_list_paginates_in_database_and_caps_page_size(self):
        for pdf_id in range(1, 6):
            self.add_pdf(pdf_id)
        page = self.client.get(API + "?page=2&per_page=2", headers=self.headers(2)).get_json()["data"]
        self.assertEqual([row["id"] for row in page["previous_year_pdfs"]], [3, 2])
        self.assertEqual(page["pagination"], {"page": 2, "per_page": 2, "total": 5, "pages": 3})
        self.assertEqual(self.client.get(API + "?per_page=101", headers=self.headers(2)).status_code, 400)

    def test_list_searches_title_exam_name_and_original_filename(self):
        self.add_pdf(1, title="Maharashtra Recruitment", exam_name="Police Constable", filename="official_scan.pdf")
        self.add_pdf(2, title="Other", exam_name="Railway", filename="railway.pdf")
        for term, expected_id in (("recruitment", 1), ("constable", 1), ("official_scan", 1)):
            response = self.client.get(API, query_string={"search": term}, headers=self.headers(2))
            self.assertEqual([row["id"] for row in response.get_json()["data"]["previous_year_pdfs"]],
                             [expected_id])

    def test_list_exam_name_year_and_active_filters(self):
        self.add_pdf(1, exam_name="Police", exam_year=2025, active=True)
        self.add_pdf(2, exam_name="Police", exam_year=2024, active=False)
        self.add_pdf(3, exam_name="Railway", exam_year=2025, active=False)
        expected = [({"exam_name": "Police"}, [2, 1]), ({"exam_year": "2025"}, [3, 1]),
                    ({"is_active": "true"}, [1]), ({"is_active": "false"}, [3, 2]),
                    ({"exam_name": "Police", "exam_year": "2025", "is_active": "true"}, [1])]
        for query, ids in expected:
            with self.subTest(query=query):
                result = self.client.get(API, query_string=query, headers=self.headers(2)).get_json()
                self.assertEqual([row["id"] for row in result["data"]["previous_year_pdfs"]], ids)

    def test_list_orders_newest_first_with_id_tiebreaker_and_validates_filters(self):
        same_time = datetime(2026, 5, 1)
        self.add_pdf(1, created_at=same_time)
        self.add_pdf(3, created_at=same_time)
        self.add_pdf(2, created_at=same_time - timedelta(days=1))
        body = self.client.get(API, headers=self.headers(2)).get_json()
        self.assertEqual([row["id"] for row in body["data"]["previous_year_pdfs"]], [3, 1, 2])
        for query in ({"page": "0"}, {"per_page": "abc"}, {"exam_year": "x"}, {"is_active": "yes"}):
            self.assertEqual(self.client.get(API, query_string=query, headers=self.headers(2)).status_code, 400)

    def test_status_authorization_and_unknown_id(self):
        path = API + "/1/status"
        self.add_pdf(1)
        self.assertEqual(self.client.patch(path, json={"is_active": False}).status_code, 401)
        self.assertEqual(self.client.patch(path, json={"is_active": False}, headers=self.headers(1)).status_code, 403)
        self.assertEqual(self.client.patch(path, json={"is_active": False}, headers=self.headers(3)).status_code, 403)
        self.assertEqual(self.client.patch(API + "/999/status", json={"is_active": False},
                                           headers=self.headers(2)).status_code, 404)

    def test_status_can_deactivate_and_activate_without_changing_metadata_or_file(self):
        pdf = self.add_pdf(1)
        file_path = self.storage_dir / pdf.storage_key
        self.storage_dir.mkdir(parents=True)
        file_path.write_bytes(VALID_PDF)
        initial = {key: getattr(pdf, key) for key in (
            "title", "exam_name", "exam_year", "description", "storage_key",
            "original_filename", "mime_type", "file_size_bytes", "created_at",
        )}
        for is_active in (False, True):
            response = self.client.patch(API + "/1/status", json={"is_active": is_active},
                                         headers=self.headers(2))
            self.assertEqual(response.status_code, 200)
            db.session.refresh(pdf)
            self.assertEqual(pdf.is_active, is_active)
            self.assertTrue(file_path.exists())
            self.assertEqual({key: getattr(pdf, key) for key in initial}, initial)
        self.assertEqual(self.client.patch(API + "/1/status", json={}, headers=self.headers(2)).status_code, 422)

    def test_delete_authorization_unknown_id_and_record_file_removal(self):
        self.assertEqual(self.client.delete(API + "/1").status_code, 401)
        self.assertEqual(self.client.delete(API + "/1", headers=self.headers(1)).status_code, 403)
        self.assertEqual(self.client.delete(API + "/1", headers=self.headers(3)).status_code, 403)
        self.assertEqual(self.client.delete(API + "/999", headers=self.headers(2)).status_code, 404)
        pdf = self.add_pdf(1)
        self.storage_dir.mkdir(parents=True)
        file_path = self.storage_dir / pdf.storage_key
        file_path.write_bytes(VALID_PDF)
        response = self.client.delete(API + "/1", headers=self.headers(2))
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(db.session.get(PreviousYearPDF, 1))
        self.assertFalse(file_path.exists())

    def test_delete_succeeds_when_physical_file_is_missing(self):
        self.add_pdf(1)
        response = self.client.delete(API + "/1", headers=self.headers(2))
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(db.session.get(PreviousYearPDF, 1))

    def test_unsafe_storage_key_cannot_delete_file_outside_directory(self):
        outside = Path(self.temp_dir.name) / "outside.pdf"
        outside.write_bytes(b"keep me")
        self.add_pdf(1, storage_key="../outside.pdf")
        response = self.client.delete(API + "/1", headers=self.headers(2))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(outside.read_bytes(), b"keep me")

    def test_database_delete_failure_does_not_remove_physical_file(self):
        pdf = self.add_pdf(1)
        self.storage_dir.mkdir(parents=True)
        file_path = self.storage_dir / pdf.storage_key
        file_path.write_bytes(VALID_PDF)
        with patch("app.repositories.previous_year_pdf_repository.PreviousYearPDFRepository.delete",
                   side_effect=RuntimeError("database unavailable")):
            response = self.client.delete(API + "/1", headers=self.headers(2))
        self.assertEqual(response.status_code, 500)
        self.assertTrue(file_path.exists())
        self.assertIsNotNone(db.session.get(PreviousYearPDF, 1))


if __name__ == "__main__":
    unittest.main()
