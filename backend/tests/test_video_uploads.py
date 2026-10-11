import tempfile
import unittest
from io import BytesIO
from pathlib import Path
from unittest.mock import patch

from flask_jwt_extended import create_access_token
from werkzeug.datastructures import FileStorage

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import Notification, Subject, Topic, User, Video
from app.services.video_service import VideoService
from app.utils.video_storage import resolve_video_path


class VideoUploadTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()
        cls.app.config.update(TESTING=True)
        cls.client = cls.app.test_client()
        with cls.app.app_context():
            db.create_all()

    def setUp(self):
        self.context = self.app.app_context()
        self.context.push()
        db.drop_all()
        db.create_all()
        self.temp_directory = tempfile.TemporaryDirectory()
        self.app.config.update(
            VIDEO_UPLOAD_DIRECTORY=self.temp_directory.name,
            MAX_VIDEO_SIZE_MB=1,
            MAIL_ENABLED=False,
        )
        db.session.add_all([
            User(id=1, name="Student", email="student@video.test", password_hash="x",
                 role="student", is_active=True),
            User(id=2, name="Admin", email="admin@video.test", password_hash="x",
                 role="admin", is_active=True),
        ])
        db.session.add(Subject(id=1, name="History", is_active=True))
        db.session.add(Topic(id=1, subject_id=1, name="Ancient", is_active=True))
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.temp_directory.cleanup()
        self.context.pop()

    @staticmethod
    def _headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    @staticmethod
    def _signature(extension):
        if extension == "mp4":
            return b"\x00\x00\x00\x18ftypisom" + b"\x00" * 20
        if extension == "webm":
            return b"\x1a\x45\xdf\xa3\x00webm" + b"\x00" * 20
        if extension == "mov":
            return b"\x00\x00\x00\x18ftypqt  " + b"\x00" * 20
        raise AssertionError("Unsupported test extension")

    @staticmethod
    def _mime(extension):
        return {
            "mp4": "video/mp4",
            "webm": "video/webm",
            "mov": "video/quicktime",
        }[extension]

    def _upload(self, extension="mp4", contents=None, extra=None):
        file_stream = BytesIO(contents if contents is not None else self._signature(extension))
        payload = {
            "title": "Uploaded lesson",
            "subject_id": "1",
            "topic_id": "1",
            "duration": "04:30",
            "video_file": (
                file_stream,
                f"lesson.{extension}",
                self._mime(extension),
            ),
        }
        if extra:
            payload.update(extra)
        response = self.client.post(
            "/api/admin/videos", data=payload, headers=self._headers(2)
        )
        file_stream.close()
        return response

    def _create_url_video(self, is_active=True):
        response = self.client.post(
            "/api/admin/videos",
            json={
                "subject_id": 1,
                "topic_id": 1,
                "title": "External lesson",
                "video_url": "https://www.youtube.com/watch?v=abcdefghijk",
                "is_active": is_active,
            },
            headers=self._headers(2),
        )
        self.assertEqual(response.status_code, 201, response.get_json())
        return response.get_json()["data"]

    def test_existing_url_video_creation_still_works(self):
        data = self._create_url_video()
        self.assertEqual(data["source_type"], "URL")
        self.assertEqual(data["video_url"], "https://www.youtube.com/watch?v=abcdefghijk")

    def test_uploaded_mp4_video_creation_works(self):
        response = self._upload("mp4")
        self.assertEqual(response.status_code, 201, response.get_json())
        self.assertEqual(response.get_json()["data"]["source_type"], "UPLOAD")
        self.assertEqual(response.get_json()["data"]["original_filename"], "lesson.mp4")
        self.assertIsNone(response.get_json()["data"]["video_url"])

    def test_uploaded_webm_video_creation_works(self):
        response = self._upload("webm")
        self.assertEqual(response.status_code, 201, response.get_json())
        video_id = response.get_json()["data"]["id"]
        file_response = self.client.get(
            f"/api/videos/{video_id}/file", headers=self._headers(1)
        )
        self.assertEqual(file_response.mimetype, "video/webm")
        file_response.close()

    def test_uploaded_mov_video_creation_works(self):
        response = self._upload("mov")
        self.assertEqual(response.status_code, 201, response.get_json())
        self.assertEqual(response.get_json()["data"]["source_type"], "UPLOAD")

    def test_unsupported_file_is_rejected(self):
        response = self._upload(
            "mp4", contents=b"%PDF-1.7 not a video", extra={
                "video_file": (BytesIO(b"%PDF-1.7 not a video"), "lesson.pdf", "application/pdf")
            }
        )
        self.assertEqual(response.status_code, 422)
        self.assertIn("MP4, WebM, or MOV", response.get_json()["message"])

    def test_renamed_non_video_file_is_rejected_by_signature(self):
        response = self._upload(contents=b"not an MP4 container")
        self.assertEqual(response.status_code, 422)
        self.assertIn("MP4 signature", response.get_json()["message"])

    def test_oversized_video_is_rejected(self):
        response = self._upload(contents=self._signature("mp4") + b"x" * (1024 * 1024))
        self.assertEqual(response.status_code, 422)
        self.assertIn("1 MB", response.get_json()["message"])

    def test_missing_url_and_file_is_rejected(self):
        response = self.client.post(
            "/api/admin/videos",
            data={"title": "No source", "subject_id": "1", "topic_id": "1"},
            headers=self._headers(2),
        )
        self.assertEqual(response.status_code, 422)

    def test_url_and_file_together_are_rejected(self):
        response = self._upload(extra={"video_url": "https://example.test/video.mp4"})
        self.assertEqual(response.status_code, 422)
        self.assertIn("either", response.get_json()["message"])

    def test_uploaded_video_student_access_works_when_active(self):
        created = self._upload().get_json()["data"]
        response = self.client.get(
            f"/api/videos/{created['id']}/file", headers=self._headers(1)
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "video/mp4")
        self.assertTrue(response.data.startswith(b"\x00\x00\x00\x18ftyp"))
        self.assertEqual(response.headers["X-Content-Type-Options"], "nosniff")
        response.close()

    def test_admin_can_view_uploaded_video_file(self):
        created = self._upload().get_json()["data"]
        response = self.client.get(
            f"/api/admin/videos/{created['id']}/file", headers=self._headers(2)
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, "video/mp4")
        response.close()

    def test_uploaded_video_unavailable_when_inactive(self):
        created = self._upload(extra={"is_active": "false"}).get_json()["data"]
        response = self.client.get(
            f"/api/videos/{created['id']}/file", headers=self._headers(1)
        )
        self.assertEqual(response.status_code, 404)

    def test_non_student_cannot_access_student_video_file(self):
        created = self._upload().get_json()["data"]
        response = self.client.get(
            f"/api/videos/{created['id']}/file", headers=self._headers(2)
        )
        self.assertEqual(response.status_code, 403)

    def test_existing_url_video_remains_accessible_in_topic_list(self):
        self._create_url_video()
        response = self.client.get("/api/videos/topic/1", headers=self._headers(1))
        self.assertEqual(response.status_code, 200)
        item = response.get_json()["data"][0]
        self.assertEqual(item["source_type"], "URL")
        self.assertTrue(item["video_url"].startswith("https://"))
        file_response = self.client.get(
            f"/api/videos/{item['id']}/file", headers=self._headers(1)
        )
        self.assertEqual(file_response.status_code, 404)

    def test_uploaded_video_update_and_safe_replacement(self):
        created = self._upload().get_json()["data"]
        old_key = db.session.get(Video, created["id"]).storage_key
        old_path = resolve_video_path(old_key)
        replacement = self.client.patch(
            f"/api/admin/videos/{created['id']}",
            data={"video_file": (
                BytesIO(self._signature("webm") + b"replacement"),
                "replacement.webm", "video/webm",
            )},
            headers=self._headers(2),
        )
        self.assertEqual(replacement.status_code, 200, replacement.get_json())
        self.assertEqual(replacement.get_json()["data"]["source_type"], "UPLOAD")
        row = db.session.get(Video, created["id"])
        new_key = row.storage_key
        self.assertNotEqual(new_key, old_key)
        self.assertFalse(old_path.exists())
        self.assertTrue(resolve_video_path(new_key).exists())

        updated = self.client.patch(
            f"/api/admin/videos/{row.id}",
            json={"title": "Revised uploaded lesson"},
            headers=self._headers(2),
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(db.session.get(Video, row.id).storage_key, new_key)

    def test_uploaded_video_can_be_replaced_by_url(self):
        created = self._upload().get_json()["data"]
        row = db.session.get(Video, created["id"])
        old_path = resolve_video_path(row.storage_key)
        response = self.client.patch(
            f"/api/admin/videos/{row.id}",
            json={"video_url": "https://example.test/new.mp4"},
            headers=self._headers(2),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["source_type"], "URL")
        self.assertTrue(old_path.exists() is False)

    def test_url_video_can_be_replaced_by_another_url(self):
        created = self._create_url_video()
        response = self.client.patch(
            f"/api/admin/videos/{created['id']}",
            json={"video_url": "https://example.test/revised.mp4"},
            headers=self._headers(2),
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["source_type"], "URL")
        self.assertEqual(response.get_json()["data"]["video_url"], "https://example.test/revised.mp4")

    def test_url_video_can_be_replaced_by_upload(self):
        created = self._create_url_video()
        response = self.client.patch(
            f"/api/admin/videos/{created['id']}",
            data={"video_file": (
                BytesIO(self._signature("mp4")), "new.mp4", "video/mp4"
            )},
            headers=self._headers(2),
        )
        self.assertEqual(response.status_code, 200, response.get_json())
        self.assertEqual(response.get_json()["data"]["source_type"], "UPLOAD")
        self.assertIsNone(response.get_json()["data"]["video_url"])

    def test_uploaded_video_delete_removes_stored_file(self):
        created = self._upload().get_json()["data"]
        storage_path = resolve_video_path(db.session.get(Video, created["id"]).storage_key)
        response = self.client.delete(
            f"/api/admin/videos/{created['id']}", headers=self._headers(2)
        )
        self.assertEqual(response.status_code, 200)
        self.assertFalse(storage_path.exists())

    def test_url_video_delete_does_not_attempt_file_delete(self):
        created = self._create_url_video()
        with patch("app.services.video_service.delete_video_file") as delete_file:
            response = self.client.delete(
                f"/api/admin/videos/{created['id']}", headers=self._headers(2)
            )
        self.assertEqual(response.status_code, 200)
        delete_file.assert_not_called()

    def test_unsafe_storage_path_is_rejected(self):
        row = Video(
            id=20, subject_id=1, topic_id=1, title="Unsafe stored row",
            video_url=None, source_type="UPLOAD", storage_key="../outside.mp4",
            original_filename="outside.mp4", mime_type="video/mp4",
            file_size_bytes=1, is_active=True,
        )
        db.session.add(row)
        db.session.commit()
        outside = Path(self.temp_directory.name).parent / "outside.mp4"
        outside.write_bytes(b"must remain")
        response = self.client.get("/api/videos/20/file", headers=self._headers(1))
        self.assertEqual(response.status_code, 404)
        self.assertEqual(outside.read_bytes(), b"must remain")

    def test_database_update_failure_preserves_current_uploaded_file(self):
        created = self._upload().get_json()["data"]
        row = db.session.get(Video, created["id"])
        old_key = row.storage_key
        old_path = resolve_video_path(old_key)
        replacement = FileStorage(
            stream=BytesIO(self._signature("webm") + b"replacement"),
            filename="replacement.webm",
            content_type="video/webm",
        )
        with patch(
            "app.services.video_service.VideoRepository.update",
            side_effect=RuntimeError("database unavailable"),
        ):
            with self.assertRaises(RuntimeError):
                VideoService.update(row.id, {"title": "Replacement"}, replacement)
        self.assertTrue(old_path.exists())
        self.assertEqual(db.session.get(Video, row.id).storage_key, old_key)
        self.assertEqual(len(list(Path(self.temp_directory.name).iterdir())), 1)

    def test_video_creation_still_generates_existing_notification(self):
        response = self._upload()
        self.assertEqual(response.status_code, 201)
        video_id = response.get_json()["data"]["id"]
        notification = Notification.query.filter_by(
            notification_type="VIDEO", related_entity_id=video_id
        ).one()
        self.assertEqual(notification.user_id, 1)


if __name__ == "__main__":
    unittest.main()
