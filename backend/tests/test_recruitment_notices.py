import unittest
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import RecruitmentNotice, User


VALID_PDF = b"%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF"


class RecruitmentNoticesApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()
        cls.app.config.update(
            TESTING=True,
            PREVIOUS_YEAR_PDF_MAX_FILE_SIZE=1024 * 1024,
        )
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
        self.context = self.app.app_context()
        self.context.push()
        db.drop_all()
        db.create_all()
        db.session.add_all([
            User(id=1, name="Student", email="student@notice.test", password_hash="x",
                 role="student", is_active=True),
            User(id=2, name="Admin", email="admin@notice.test", password_hash="x",
                 role="admin", is_active=True),
            User(id=3, name="Inactive admin", email="inactive@notice.test", password_hash="x",
                 role="admin", is_active=False),
            User(id=4, name="Inactive student", email="inactive-student@notice.test", password_hash="x",
                 role="student", is_active=False),
        ])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()
        self.storage_patch.stop()
        self.temp_dir.cleanup()

    @staticmethod
    def headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    @staticmethod
    def payload(**overrides):
        payload = {
            "title": "Police Constable Recruitment Advertisement",
            "summary": "Application dates and vacancy details.",
            "content": "Read the official recruitment advertisement carefully.",
            "notice_type": "ADVERTISEMENT",
            "recruitment_year": "2026",
            "department": "Maharashtra Police",
            "post_name": "Police Constable",
            "vacancies": "1200",
            "application_start_date": "2026-10-10",
            "application_end_date": "2026-11-10",
            "exam_date": "2026-12-12",
            "published_date": "2026-10-07",
            "official_source_name": "Maharashtra Police",
            "official_source_url": "https://example.test/official-notice",
        }
        payload.update(overrides)
        return payload

    def create_notice(self, user_id=2, **overrides):
        return self.client.post(
            "/api/admin/recruitment-notices",
            json=self.payload(**overrides),
            headers=self.headers(user_id),
        )

    def create_pdf_notice(self, *, user_id=2, pdf_bytes=VALID_PDF, filename="notice.pdf", **overrides):
        data = self.payload(official_source_url="", **overrides)
        data["pdf"] = (BytesIO(pdf_bytes), filename, "application/pdf")
        return self.client.post(
            "/api/admin/recruitment-notices",
            data=data,
            headers=self.headers(user_id),
        )

    def test_admin_can_create_notice_with_source_url_or_pdf(self):
        response = self.create_notice()
        self.assertEqual(response.status_code, 201, response.get_json())
        notice = response.get_json()["data"]
        self.assertEqual(notice["notice_type"], "ADVERTISEMENT")
        self.assertEqual(notice["recruitment_year"], 2026)
        self.assertEqual(notice["published_date"], "2026-10-07")
        self.assertFalse(notice["pdf_available"])

        pdf_response = self.create_pdf_notice(title="Notice with PDF")
        self.assertEqual(pdf_response.status_code, 201, pdf_response.get_json())
        self.assertTrue(pdf_response.get_json()["data"]["pdf_available"])

    def test_non_admin_and_inactive_admin_cannot_create(self):
        payload = self.payload()
        self.assertEqual(self.create_notice(user_id=1).status_code, 403)
        self.assertEqual(self.create_notice(user_id=3).status_code, 403)
        self.assertEqual(self.client.post(
            "/api/admin/recruitment-notices", json=payload
        ).status_code, 401)
        self.assertEqual(RecruitmentNotice.query.count(), 0)

    def test_admin_list_search_type_year_department_status_and_date_filters(self):
        first = self.create_notice().get_json()["data"]
        second = self.create_notice(
            title="Physical test schedule", summary="District ground schedule",
            content="Physical test details for police constable candidates.",
            notice_type="PHYSICAL_TEST", recruitment_year="2025",
            department="Pune Police", post_name="Constable", vacancies="50",
            published_date="2026-10-06",
        ).get_json()["data"]
        self.client.patch(
            f"/api/admin/recruitment-notices/{second['id']}/status",
            headers=self.headers(2), json={"is_active": False},
        )

        filtered = self.client.get(
            "/api/admin/recruitment-notices?search=ground&notice_type=PHYSICAL_TEST&recruitment_year=2025&department=Pune%20Police&is_active=false&published_date=2026-10-06",
            headers=self.headers(2),
        ).get_json()["data"]["recruitment_notices"]
        self.assertEqual([item["id"] for item in filtered], [second["id"]])
        active = self.client.get(
            "/api/admin/recruitment-notices?is_active=true",
            headers=self.headers(2),
        ).get_json()["data"]["recruitment_notices"]
        self.assertEqual([item["id"] for item in active], [first["id"]])

    def test_admin_can_update_and_status_is_separate(self):
        notice = self.create_notice().get_json()["data"]
        updated = self.client.patch(
            f"/api/admin/recruitment-notices/{notice['id']}",
            headers=self.headers(2),
            json={"title": "Updated advertisement", "vacancies": 950},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.get_json()["data"]["title"], "Updated advertisement")
        self.assertEqual(updated.get_json()["data"]["vacancies"], 950)
        deactivated = self.client.patch(
            f"/api/admin/recruitment-notices/{notice['id']}/status",
            headers=self.headers(2), json={"is_active": False},
        )
        self.assertEqual(deactivated.status_code, 200)
        self.assertFalse(deactivated.get_json()["data"]["is_active"])
        reactivated = self.client.patch(
            f"/api/admin/recruitment-notices/{notice['id']}/status",
            headers=self.headers(2), json={"is_active": True},
        )
        self.assertTrue(reactivated.get_json()["data"]["is_active"])

    def test_student_list_only_returns_active_and_detail_hides_private_fields(self):
        active = self.create_notice().get_json()["data"]
        inactive = self.create_notice(title="Inactive notice").get_json()["data"]
        self.client.patch(
            f"/api/admin/recruitment-notices/{inactive['id']}/status",
            headers=self.headers(2), json={"is_active": False},
        )

        response = self.client.get(
            "/api/student/recruitment-notices", headers=self.headers(1)
        )
        self.assertEqual(response.status_code, 200)
        items = response.get_json()["data"]["recruitment_notices"]
        self.assertEqual([item["id"] for item in items], [active["id"]])
        self.assertNotIn("is_active", items[0])
        self.assertNotIn("created_at", items[0])
        self.assertNotIn("pdf_storage_key", items[0])
        self.assertNotIn("storage_key", str(items[0]))

        detail = self.client.get(
            f"/api/student/recruitment-notices/{active['id']}", headers=self.headers(1)
        )
        self.assertEqual(detail.status_code, 200)
        self.assertEqual(set(detail.get_json()["data"]), {
            "id", "title", "summary", "content", "notice_type", "recruitment_year",
            "department", "post_name", "vacancies", "application_start_date",
            "application_end_date", "exam_date", "published_date",
            "official_source_name", "official_source_url", "pdf_available",
            "pdf_original_filename", "pdf_file_size_bytes",
        })
        hidden = self.client.get(
            f"/api/student/recruitment-notices/{inactive['id']}", headers=self.headers(1)
        )
        self.assertEqual(hidden.status_code, 404)

    def test_student_filters_and_pagination(self):
        self.create_notice(title="Advertisement 2026", recruitment_year="2026")
        self.create_notice(
            title="Physical update 2025", notice_type="PHYSICAL_TEST",
            recruitment_year="2025", department="Pune Police",
        )
        filtered = self.client.get(
            "/api/student/recruitment-notices?search=Pune&notice_type=PHYSICAL_TEST&recruitment_year=2025&department=Pune%20Police",
            headers=self.headers(1),
        ).get_json()["data"]["recruitment_notices"]
        self.assertEqual([item["title"] for item in filtered], ["Physical update 2025"])
        page = self.client.get(
            "/api/student/recruitment-notices?page=2&per_page=1",
            headers=self.headers(1),
        ).get_json()["data"]
        self.assertEqual(page["pagination"], {
            "page": 2, "per_page": 1, "total": 2, "pages": 2,
        })

    def test_validation_rejects_unsafe_url_invalid_date_range_and_vacancies(self):
        for url in ("javascript:alert(1)", "data:text/html,test", "file:///tmp/file.pdf", "ftp://example.test/a"):
            self.assertEqual(self.create_notice(official_source_url=url).status_code, 422)
        self.assertEqual(self.create_notice(
            application_start_date="2026-11-12", application_end_date="2026-11-11",
        ).status_code, 422)
        self.assertEqual(self.create_notice(vacancies="-1").status_code, 422)
        self.assertEqual(self.create_notice(vacancies=2.5).status_code, 422)
        self.assertEqual(self.create_notice(published_date="invalid-date").status_code, 422)
        no_source = self.create_notice(official_source_url=None)
        self.assertEqual(no_source.status_code, 400)
        self.assertEqual(RecruitmentNotice.query.count(), 0)

    def test_invalid_pdf_is_rejected_and_valid_pdf_is_authenticated(self):
        invalid = self.create_pdf_notice(pdf_bytes=b"not a pdf")
        self.assertEqual(invalid.status_code, 400)
        invalid_extension = self.create_pdf_notice(filename="notice.txt")
        self.assertEqual(invalid_extension.status_code, 400)
        invalid_mime_data = self.payload(official_source_url="")
        invalid_mime_data["pdf"] = (BytesIO(VALID_PDF), "notice.pdf", "text/plain")
        invalid_mime = self.client.post(
            "/api/admin/recruitment-notices",
            data=invalid_mime_data,
            headers=self.headers(2),
        )
        self.assertEqual(invalid_mime.status_code, 400)
        response = self.create_pdf_notice()
        self.assertEqual(response.status_code, 201, response.get_json())
        notice = response.get_json()["data"]

        self.assertEqual(self.client.get(
            f"/api/student/recruitment-notices/{notice['id']}/file"
        ).status_code, 401)

        view = self.client.get(
            f"/api/student/recruitment-notices/{notice['id']}/file",
            headers=self.headers(1),
        )
        self.assertEqual(view.status_code, 200)
        self.assertEqual(view.mimetype, "application/pdf")
        view.close()
        download = self.client.get(
            f"/api/student/recruitment-notices/{notice['id']}/download",
            headers=self.headers(1),
        )
        self.assertEqual(download.status_code, 200)
        self.assertIn("attachment", download.headers["Content-Disposition"])
        download.close()

        self.client.patch(
            f"/api/admin/recruitment-notices/{notice['id']}/status",
            headers=self.headers(2), json={"is_active": False},
        )
        hidden_file = self.client.get(
            f"/api/student/recruitment-notices/{notice['id']}/file",
            headers=self.headers(1),
        )
        self.assertEqual(hidden_file.status_code, 404)
        hidden_download = self.client.get(
            f"/api/student/recruitment-notices/{notice['id']}/download",
            headers=self.headers(1),
        )
        self.assertEqual(hidden_download.status_code, 404)

    def test_pdf_replacement_and_delete_remove_stored_file(self):
        created = self.create_pdf_notice().get_json()["data"]
        notice = db.session.get(RecruitmentNotice, created["id"])
        old_key = notice.pdf_storage_key
        old_path = self.storage_dir / old_key
        self.assertTrue(old_path.is_file())

        update_data = self.payload(title="Replacement notice", official_source_url="")
        update_data["pdf"] = (BytesIO(VALID_PDF), "replacement.pdf", "application/pdf")
        replaced = self.client.patch(
            f"/api/admin/recruitment-notices/{notice.id}",
            data=update_data, headers=self.headers(2),
        )
        self.assertEqual(replaced.status_code, 200, replaced.get_json())
        new_key = db.session.get(RecruitmentNotice, notice.id).pdf_storage_key
        self.assertNotEqual(new_key, old_key)
        self.assertFalse(old_path.exists())
        self.assertTrue((self.storage_dir / new_key).is_file())

        deleted = self.client.delete(
            f"/api/admin/recruitment-notices/{notice.id}", headers=self.headers(2)
        )
        self.assertEqual(deleted.status_code, 200)
        self.assertFalse((self.storage_dir / new_key).exists())

    def test_remove_pdf_requires_an_official_source_to_remain(self):
        created = self.create_pdf_notice().get_json()["data"]
        response = self.client.patch(
            f"/api/admin/recruitment-notices/{created['id']}",
            data={"remove_pdf": "true"}, headers=self.headers(2),
        )
        self.assertEqual(response.status_code, 400)
        self.assertTrue(db.session.get(RecruitmentNotice, created["id"]).pdf_storage_key)

    def test_unknown_notice_and_student_authorization(self):
        self.assertEqual(self.client.get(
            "/api/admin/recruitment-notices/999", headers=self.headers(2)
        ).status_code, 404)
        self.assertEqual(self.client.patch(
            "/api/admin/recruitment-notices/999", headers=self.headers(2),
            json={"title": "Missing"},
        ).status_code, 404)
        self.assertEqual(self.client.get(
            "/api/student/recruitment-notices", headers=self.headers(4)
        ).status_code, 403)
        self.assertEqual(self.client.get("/api/student/recruitment-notices").status_code, 401)

    def test_traversal_storage_key_is_rejected(self):
        created = self.create_notice().get_json()["data"]
        notice = db.session.get(RecruitmentNotice, created["id"])
        notice.pdf_storage_key = "../../secret.pdf"
        db.session.commit()
        response = self.client.get(
            f"/api/student/recruitment-notices/{notice.id}/file",
            headers=self.headers(1),
        )
        self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
