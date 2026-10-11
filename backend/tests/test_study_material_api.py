import unittest
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from flask_jwt_extended import create_access_token
from werkzeug.datastructures import FileStorage

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import StudyMaterial, Subject, Topic, User


VALID_PDF = b"%PDF-1.7\n1 0 obj\n<<>>\nendobj\n%%EOF"


class StudyMaterialApiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()
        cls.app.config.update(TESTING=True, STUDY_MATERIAL_MAX_FILE_SIZE=20 * 1024 * 1024)
        cls.client = cls.app.test_client()
        with cls.app.app_context():
            db.create_all()

    def setUp(self):
        self.temp_dir = TemporaryDirectory()
        self.storage_dir = Path(self.temp_dir.name) / "study_materials"
        self.storage_patch = patch(
            "app.utils.study_material_storage.get_study_material_directory",
            return_value=self.storage_dir,
        )
        self.storage_patch.start()
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.drop_all()
        db.create_all()
        db.session.add_all([
            User(id=1, name="Student", email="student@test", password_hash="secret", role="student", is_active=True),
            User(id=2, name="Admin", email="admin@test", password_hash="secret", role="admin", is_active=True),
            User(id=3, name="Inactive Admin", email="inactive@test", password_hash="secret", role="admin", is_active=False),
            User(id=4, name="Second Student", email="student2@test", password_hash="secret", role="student", is_active=True),
        ])
        db.session.add_all([Subject(id=1, name="History"), Subject(id=2, name="Science")])
        db.session.add_all([
            Topic(id=1, subject_id=1, name="Ancient India"),
            Topic(id=2, subject_id=1, name="Modern India"),
            Topic(id=3, subject_id=2, name="Physics"),
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

    def add_material(self, material_id, topic_id=1, subject_id=1, title=None, active=True, storage_key=None):
        material = StudyMaterial(
            id=material_id,
            subject_id=subject_id,
            topic_id=topic_id,
            title=title or f"Lesson {material_id}",
            storage_key=storage_key or f"study_material_{material_id:032x}.pdf",
            original_filename=f"lesson_{material_id}.pdf",
            mime_type="application/pdf",
            file_size_bytes=len(VALID_PDF),
            is_active=active,
        )
        db.session.add(material)
        db.session.commit()
        return material

    @staticmethod
    def upload_form(subject_id="1", topic_id="1", title="Grammar", file_bytes=VALID_PDF,
                    filename="grammar.pdf", content_type="application/pdf"):
        return {
            "subject_id": subject_id,
            "topic_id": topic_id,
            "title": title,
            "file": (BytesIO(file_bytes), filename, content_type),
        }

    def test_admin_upload_requires_authenticated_active_admin(self):
        path = "/api/admin/study-materials"
        self.assertEqual(self.client.post(path, data=self.upload_form()).status_code, 401)
        self.assertEqual(self.client.post(path, data=self.upload_form(), headers=self.headers(1)).status_code, 403)
        self.assertEqual(self.client.post(path, data=self.upload_form(), headers=self.headers(3)).status_code, 403)

    def test_valid_admin_upload_saves_pdf_and_returns_safe_record(self):
        def create_with_sqlite_id(data):
            material = StudyMaterial(id=1, **data)
            db.session.add(material)
            db.session.commit()
            return material

        with patch("app.repositories.study_material_repository.StudyMaterialRepository.create",
                   side_effect=create_with_sqlite_id):
            response = self.client.post("/api/admin/study-materials", data=self.upload_form(),
                                        headers=self.headers(2))
        self.assertEqual(response.status_code, 201, response.get_json())
        payload = response.get_json()["data"]
        self.assertEqual(payload["title"], "Grammar")
        self.assertEqual(payload["subject_name"], "History")
        self.assertEqual(payload["topic_name"], "Ancient India")
        self.assertNotIn("storage_key", payload)
        self.assertEqual(len(list(self.storage_dir.glob("*.pdf"))), 1)

    def test_upload_rejects_missing_fields_file_invalid_pdf_mismatch_and_oversize(self):
        cases = [
            ({"subject_id": "1", "topic_id": "1", "file": (BytesIO(VALID_PDF), "a.pdf", "application/pdf")}, 422),
            ({"topic_id": "1", "title": "A", "file": (BytesIO(VALID_PDF), "a.pdf", "application/pdf")}, 422),
            ({"subject_id": "1", "title": "A", "file": (BytesIO(VALID_PDF), "a.pdf", "application/pdf")}, 422),
            ({"subject_id": "1", "topic_id": "1", "title": "A"}, 400),
            (self.upload_form(file_bytes=b"not pdf"), 400),
            (self.upload_form(subject_id="2", topic_id="1"), 400),
        ]
        for form, expected_status in cases:
            with self.subTest(expected_status=expected_status, keys=tuple(form)):
                response = self.client.post("/api/admin/study-materials", data=form, headers=self.headers(2))
                self.assertEqual(response.status_code, expected_status, response.get_json())
        self.app.config["STUDY_MATERIAL_MAX_FILE_SIZE"] = 10
        response = self.client.post("/api/admin/study-materials", data=self.upload_form(), headers=self.headers(2))
        self.assertEqual(response.status_code, 400)
        self.app.config["STUDY_MATERIAL_MAX_FILE_SIZE"] = 20 * 1024 * 1024
        self.assertFalse(self.storage_dir.exists())
        self.assertEqual(StudyMaterial.query.count(), 0)

    def test_upload_rejects_nonexistent_subject_or_topic(self):
        for form in (self.upload_form(subject_id="999"), self.upload_form(topic_id="999")):
            response = self.client.post("/api/admin/study-materials", data=form, headers=self.headers(2))
            self.assertEqual(response.status_code, 400)
        self.assertFalse(self.storage_dir.exists())

    def test_database_failure_rolls_back_and_cleans_saved_pdf(self):
        with patch("app.repositories.study_material_repository.StudyMaterialRepository.create",
                   side_effect=RuntimeError("database unavailable")):
            response = self.client.post("/api/admin/study-materials", data=self.upload_form(),
                                        headers=self.headers(2))
        self.assertEqual(response.status_code, 500)
        self.assertEqual(list(self.storage_dir.iterdir()), [])
        self.assertEqual(StudyMaterial.query.count(), 0)

    def test_admin_list_search_filters_and_pagination(self):
        self.add_material(1, title="Ancient empires")
        self.add_material(2, topic_id=2, title="Modern history")
        self.add_material(3, subject_id=2, topic_id=3, title="Physics", active=False)
        path = "/api/admin/study-materials"
        self.assertEqual(self.client.get(path).status_code, 401)
        headers = self.headers(2)
        response = self.client.get(path, headers=headers)
        data = response.get_json()["data"]
        self.assertEqual([row["id"] for row in data["study_materials"]], [3, 2, 1])
        self.assertEqual(set(data["study_materials"][0]), {
            "id", "title", "subject_id", "subject_name", "topic_id", "topic_name",
            "original_filename", "mime_type", "file_size_bytes", "is_active", "created_at", "updated_at",
        })
        self.assertNotIn("storage_key", str(data))
        self.assertEqual(self.client.get(path + "?search=LESSON_2", headers=headers).get_json()
                         ["data"]["study_materials"][0]["id"], 2)
        self.assertEqual([x["id"] for x in self.client.get(path + "?search=ancient", headers=headers).get_json()
                         ["data"]["study_materials"]], [1])
        cases = [({"subject_id": "1"}, [2, 1]), ({"topic_id": "2"}, [2]),
                 ({"is_active": "true"}, [2, 1]), ({"is_active": "false"}, [3])]
        for query, ids in cases:
            result = self.client.get(path, query_string=query, headers=headers).get_json()["data"]["study_materials"]
            self.assertEqual([row["id"] for row in result], ids)
        page = self.client.get(path + "?page=2&per_page=2", headers=headers).get_json()["data"]
        self.assertEqual([row["id"] for row in page["study_materials"]], [1])
        self.assertEqual(page["pagination"], {"page": 2, "per_page": 2, "total": 3, "pages": 2})
        self.assertEqual(self.client.get(path + "?per_page=101", headers=headers).status_code, 400)

    def test_status_update_changes_only_active_flag(self):
        material = self.add_material(1)
        response = self.client.patch("/api/admin/study-materials/1/status", json={"is_active": False},
                                     headers=self.headers(2))
        self.assertEqual(response.status_code, 200)
        db.session.refresh(material)
        self.assertFalse(material.is_active)
        self.assertEqual(material.title, "Lesson 1")
        self.assertEqual(self.client.patch("/api/admin/study-materials/1/status", json={},
                                           headers=self.headers(2)).status_code, 422)

    def test_admin_delete_removes_record_and_file_missing_is_success(self):
        material = self.add_material(1)
        file_path = self.storage_dir / material.storage_key
        self.storage_dir.mkdir(parents=True)
        file_path.write_bytes(VALID_PDF)
        response = self.client.delete("/api/admin/study-materials/1", headers=self.headers(2))
        self.assertEqual(response.status_code, 200)
        self.assertFalse(file_path.exists())
        self.assertIsNone(db.session.get(StudyMaterial, 1))
        self.add_material(2)
        response = self.client.delete("/api/admin/study-materials/2", headers=self.headers(2))
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(db.session.get(StudyMaterial, 2))
        self.assertEqual(self.client.delete("/api/admin/study-materials/999", headers=self.headers(2)).status_code, 404)

    def test_student_list_only_returns_active_materials_for_requested_topic(self):
        self.add_material(1, topic_id=1, title="Active")
        self.add_material(2, topic_id=1, title="Inactive", active=False)
        self.add_material(3, topic_id=2, title="Other topic")
        path = "/api/student/study-materials/topic/1"
        self.assertEqual(self.client.get(path).status_code, 401)
        self.assertEqual(self.client.get(path, headers=self.headers(2)).status_code, 403)
        response = self.client.get(path, headers=self.headers(1))
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual([item["id"] for item in data], [1])
        self.assertNotIn("storage_key", str(response.get_json()))
        self.assertEqual(self.client.get("/api/student/study-materials/topic/999",
                                         headers=self.headers(1)).status_code, 404)

    def test_student_file_access_active_missing_inactive_and_safe_path(self):
        active = self.add_material(1)
        active_path = self.storage_dir / active.storage_key
        self.storage_dir.mkdir(parents=True)
        active_path.write_bytes(VALID_PDF)
        self.add_material(2, active=False)
        headers = self.headers(1)
        path = "/api/student/study-materials/1/file"
        self.assertEqual(self.client.get(path).status_code, 401)
        self.assertEqual(self.client.get(path, headers=self.headers(2)).status_code, 403)
        response = self.client.get(path, headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "application/pdf")
        self.assertIn("inline", response.headers.get("Content-Disposition", ""))
        self.assertEqual(response.data, VALID_PDF)
        response.close()
        download_path = "/api/student/study-materials/1/download"
        self.assertEqual(self.client.get(download_path).status_code, 401)
        self.assertEqual(self.client.get(download_path, headers=self.headers(2)).status_code, 403)
        download = self.client.get(download_path, headers=headers)
        self.assertEqual(download.status_code, 200)
        self.assertEqual(download.mimetype, "application/pdf")
        self.assertIn("attachment", download.headers.get("Content-Disposition", ""))
        self.assertIn("lesson_1.pdf", download.headers.get("Content-Disposition", ""))
        self.assertEqual(download.data, VALID_PDF)
        self.assertNotIn(str(self.storage_dir), str(download.headers))
        self.assertNotIn("storage_key", str(download.headers))
        download.close()
        self.assertEqual(self.client.get("/api/student/study-materials/2/file", headers=headers).status_code, 404)
        self.assertEqual(self.client.get("/api/student/study-materials/999/file", headers=headers).status_code, 404)
        self.add_material(3, title="Missing physical file")
        self.assertEqual(self.client.get("/api/student/study-materials/3/file", headers=headers).status_code, 404)
        self.assertEqual(self.client.get("/api/student/study-materials/2/download", headers=headers).status_code, 404)
        self.assertEqual(self.client.get("/api/student/study-materials/999/download", headers=headers).status_code, 404)
        self.assertEqual(self.client.get("/api/student/study-materials/3/download", headers=headers).status_code, 404)

        outside = Path(self.temp_dir.name) / "secret.pdf"
        outside.write_bytes(b"secret")
        active.storage_key = "../../secret.pdf"
        db.session.commit()
        self.assertEqual(self.client.get(path, headers=headers).status_code, 404)
        self.assertEqual(self.client.get(download_path, headers=headers).status_code, 404)
        self.assertEqual(outside.read_bytes(), b"secret")

    def test_student_identity_does_not_change_shared_topic_materials(self):
        self.add_material(1, title="Shared material")
        first = self.client.get("/api/student/study-materials/topic/1", headers=self.headers(1)).get_json()
        second = self.client.get("/api/student/study-materials/topic/1", headers=self.headers(4)).get_json()
        self.assertEqual(first["data"], second["data"])

    def test_no_response_exposes_filesystem_paths_or_server_storage(self):
        material = self.add_material(1)
        self.storage_dir.mkdir(parents=True)
        (self.storage_dir / material.storage_key).write_bytes(VALID_PDF)
        admin_result = self.client.get("/api/admin/study-materials", headers=self.headers(2)).get_json()
        student_result = self.client.get("/api/student/study-materials/topic/1",
                                         headers=self.headers(1)).get_json()
        for response in (admin_result, student_result):
            serialized = str(response)
            self.assertNotIn(str(self.storage_dir), serialized)
            self.assertNotIn("storage_key", serialized)
            self.assertNotIn("backend\\uploads", serialized)


if __name__ == "__main__":
    unittest.main()
