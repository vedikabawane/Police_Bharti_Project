import io
import tempfile
import unittest
from datetime import date
from pathlib import Path
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import CurrentAffair, User
from app.utils.current_affair_image_storage import resolve_current_affair_image_path


class CurrentAffairMediaApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()
        cls.app.config.update(
            TESTING=True,
            CURRENT_AFFAIR_IMAGE_MAX_FILE_SIZE=1024,
            PREVIOUS_YEAR_PDF_MAX_FILE_SIZE=1024,
        )
        cls.client = cls.app.test_client()

    def setUp(self):
        self.context = self.app.app_context()
        self.context.push()
        db.drop_all()
        db.create_all()
        self.temporary_directory = tempfile.TemporaryDirectory()
        root = Path(self.temporary_directory.name)
        self.image_directory = root / "images"
        self.pdf_directory = root / "pdfs"
        self.storage_patches = [
            patch("app.utils.current_affair_image_storage.get_current_affair_image_directory", return_value=self.image_directory),
            patch("app.utils.previous_year_pdf_storage.get_previous_year_pdf_directory", return_value=self.pdf_directory),
        ]
        for storage_patch in self.storage_patches:
            storage_patch.start()
        db.session.add_all([
            User(id=1, name="Student", email="student@media.test", password_hash="secret", role="student", is_active=True),
            User(id=2, name="Admin", email="admin@media.test", password_hash="secret", role="admin", is_active=True),
            User(id=3, name="Inactive admin", email="inactive@media.test", password_hash="secret", role="admin", is_active=False),
            User(id=4, name="Other", email="other@media.test", password_hash="secret", role="student", is_active=True),
        ])
        db.session.commit()

    def tearDown(self):
        for storage_patch in self.storage_patches:
            storage_patch.stop()
        self.temporary_directory.cleanup()
        db.session.remove()
        db.drop_all()
        self.context.pop()

    @staticmethod
    def headers(user_id):
        return {"Authorization": f"Bearer {create_access_token(identity=str(user_id))}"}

    def upload(self, user_id, content_type, name, payload, mime, request_id=None):
        headers = self.headers(user_id)
        if request_id:
            headers["X-Upload-Request-ID"] = request_id
        return self.client.post(
            "/api/admin/current-affairs/media",
            data={"content_type": content_type, "file": (io.BytesIO(payload), name, mime)},
            headers=headers,
            content_type="multipart/form-data",
        )

    def test_quick_upload_creates_metadata_and_is_idempotent(self):
        image = b"\xff\xd8\xff" + b"image bytes"
        response = self.upload(2, "IMAGE", "maharashtra-police-bharti-update.jpg", image, "image/jpeg", "4d9b8850-ff46-4a4e-8fa2-4f705cb76656")
        self.assertEqual(response.status_code, 201, response.get_json())
        data = response.get_json()["data"]
        record = db.session.get(CurrentAffair, data["id"])
        self.assertEqual(record.content_type, "IMAGE")
        self.assertEqual(record.title, "Maharashtra Police Bharti Update")
        self.assertEqual(record.published_date, date.today())
        self.assertTrue(record.is_active)
        self.assertIsNone(record.summary)
        self.assertIsNone(record.content)
        self.assertNotIn("media_storage_key", data)
        self.assertNotIn(str(self.image_directory), str(data))
        duplicate = self.upload(2, "IMAGE", "maharashtra-police-bharti-update.jpg", image, "image/jpeg", "4d9b8850-ff46-4a4e-8fa2-4f705cb76656")
        self.assertEqual(duplicate.status_code, 201)
        self.assertEqual(CurrentAffair.query.count(), 1)

    def test_media_upload_preflight_allows_local_vite_origins_and_required_headers(self):
        requested_headers = "accept,authorization,content-type,x-upload-request-id"
        for origin in ("http://localhost:5173", "http://127.0.0.1:5173"):
            with self.subTest(origin=origin):
                response = self.client.options(
                    "/api/admin/current-affairs/media",
                    headers={
                        "Origin": origin,
                        "Access-Control-Request-Method": "POST",
                        "Access-Control-Request-Headers": requested_headers,
                    },
                )

                self.assertIn(response.status_code, (200, 204))
                self.assertEqual(
                    response.headers.get("Access-Control-Allow-Origin"), origin
                )
                allowed_headers = {
                    header.strip().lower()
                    for header in response.headers.get(
                        "Access-Control-Allow-Headers", ""
                    ).split(",")
                }
                self.assertTrue(
                    {
                        "accept",
                        "authorization",
                        "content-type",
                        "x-upload-request-id",
                    }.issubset(allowed_headers)
                )
                allowed_methods = {
                    method.strip().upper()
                    for method in response.headers.get(
                        "Access-Control-Allow-Methods", ""
                    ).split(",")
                }
                self.assertIn("POST", allowed_methods)

        denied = self.client.options(
            "/api/admin/current-affairs/media",
            headers={
                "Origin": "https://example.invalid",
                "Access-Control-Request-Method": "POST",
                "Access-Control-Request-Headers": requested_headers,
            },
        )
        self.assertIsNone(denied.headers.get("Access-Control-Allow-Origin"))

    def test_pdf_upload_requires_only_file_and_student_can_view_and_download(self):
        response = self.upload(2, "PDF", "police-bharti-daily-current-affairs-06-oct.pdf", b"%PDF-1.7\nmock pdf", "application/pdf")
        self.assertEqual(response.status_code, 201, response.get_json())
        record_id = response.get_json()["data"]["id"]
        self.assertEqual(response.get_json()["data"]["content_type"], "PDF")
        self.assertEqual(response.get_json()["data"]["title"], "Police Bharti Daily Current Affairs 06 Oct")
        student_list = self.client.get("/api/student/current-affairs", headers=self.headers(1)).get_json()["data"]["current_affairs"]
        self.assertEqual(student_list[0]["content_type"], "PDF")
        viewed = self.client.get(f"/api/student/current-affairs/{record_id}/media", headers=self.headers(1))
        self.assertEqual(viewed.mimetype, "application/pdf")
        self.assertEqual(viewed.data[:5], b"%PDF-")
        downloaded = self.client.get(f"/api/student/current-affairs/{record_id}/download", headers=self.headers(1))
        self.assertIn("attachment", downloaded.headers["Content-Disposition"])

    def test_image_media_is_authenticated_and_inactive_records_are_hidden(self):
        created = self.upload(2, "IMAGE", "poster.png", b"\x89PNG\r\n\x1a\ncontent", "image/png")
        self.assertEqual(created.status_code, 201, created.get_json())
        record_id = created.get_json()["data"]["id"]
        image = self.client.get(f"/api/student/current-affairs/{record_id}/media", headers=self.headers(1))
        self.assertEqual(image.mimetype, "image/png")
        self.assertEqual(self.client.get(f"/api/student/current-affairs/{record_id}/media").status_code, 401)
        self.client.patch(f"/api/admin/current-affairs/{record_id}/status", headers=self.headers(2), json={"is_active": False})
        self.assertEqual(self.client.get("/api/student/current-affairs", headers=self.headers(1)).get_json()["data"]["current_affairs"], [])
        self.assertEqual(self.client.get(f"/api/student/current-affairs/{record_id}/media", headers=self.headers(1)).status_code, 404)

    def test_invalid_types_mimes_signatures_and_size_are_rejected(self):
        attempts = [
            ("IMAGE", "wrong.jpg", b"not an image", "image/jpeg"),
            ("IMAGE", "image.gif", b"GIF89a", "image/gif"),
            ("IMAGE", "image.png", b"\x89PNG\r\n\x1a\n", "image/jpeg"),
            ("PDF", "wrong.pdf", b"not a pdf", "application/pdf"),
            ("PDF", "image.jpg", b"%PDF-1.7", "application/pdf"),
            ("IMAGE", "large.png", b"\x89PNG\r\n\x1a\n" + b"x" * 1024, "image/png"),
            ("PDF", "large.pdf", b"%PDF-1.7" + b"x" * 1024, "application/pdf"),
        ]
        for content_type, filename, payload, mime in attempts:
            with self.subTest(filename=filename, mime=mime):
                response = self.upload(2, content_type, filename, payload, mime)
                self.assertEqual(response.status_code, 400, response.get_json())
        self.assertEqual(CurrentAffair.query.count(), 0)

    def test_admin_access_is_required_and_replacement_and_delete_clean_files(self):
        self.assertEqual(self.upload(1, "IMAGE", "one.png", b"\x89PNG\r\n\x1a\n1", "image/png").status_code, 403)
        self.assertEqual(self.upload(3, "IMAGE", "one.png", b"\x89PNG\r\n\x1a\n1", "image/png").status_code, 403)
        created = self.upload(2, "IMAGE", "one.png", b"\x89PNG\r\n\x1a\n1", "image/png").get_json()["data"]
        record = db.session.get(CurrentAffair, created["id"])
        old_key = record.media_storage_key
        replacement = self.client.put(
            f"/api/admin/current-affairs/{record.id}/media",
            data={"content_type": "IMAGE", "file": (io.BytesIO(b"\x89PNG\r\n\x1a\n2"), "two.png", "image/png")},
            headers=self.headers(2), content_type="multipart/form-data",
        )
        self.assertEqual(replacement.status_code, 200, replacement.get_json())
        self.assertFalse((self.image_directory / old_key).exists())
        new_path = self.image_directory / record.media_storage_key
        self.assertTrue(new_path.exists())
        deleted = self.client.delete(f"/api/admin/current-affairs/{record.id}", headers=self.headers(2))
        self.assertEqual(deleted.status_code, 200)
        self.assertFalse(new_path.exists())

    def test_content_type_filter_and_existing_text_record(self):
        text = self.client.post("/api/admin/current-affairs", json={
            "title": "Text affair", "content": "Existing article body", "published_date": date.today().isoformat(),
        }, headers=self.headers(2))
        self.assertEqual(text.status_code, 201)
        self.upload(2, "PDF", "filter.pdf", b"%PDF-1.7 mock", "application/pdf")
        pdfs = self.client.get("/api/admin/current-affairs?content_type=pdf", headers=self.headers(2)).get_json()["data"]["current_affairs"]
        self.assertEqual(len(pdfs), 1)
        self.assertEqual(pdfs[0]["content_type"], "PDF")
        self.assertEqual(text.get_json()["data"]["content"], "Existing article body")

    def test_unsafe_storage_key_is_rejected(self):
        with self.assertRaises(ValueError):
            resolve_current_affair_image_path("../private.png")


if __name__ == "__main__":
    unittest.main()
