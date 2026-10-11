import io
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import StudentProfile, User


class StudentProfilePhotoUploadTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        with patch.object(Config, "SQLALCHEMY_DATABASE_URI", "sqlite://"):
            cls.app = create_app()

        cls.app.config.update(TESTING=True)
        cls.client = cls.app.test_client()

        with cls.app.app_context():
            db.create_all()

    def setUp(self):
        self.app_context = self.app.app_context()
        self.app_context.push()
        db.drop_all()
        db.create_all()

        student = User(
            id=1,
            name="Student One",
            email="student1@example.test",
            password_hash="test-hash",
            role="student",
            is_active=True,
        )
        db.session.add(student)
        db.session.add(StudentProfile(id=1, user_id=1))
        db.session.commit()

        token = create_access_token(identity="1")
        self.headers = {"Authorization": f"Bearer {token}"}
        self.temp_directory = tempfile.TemporaryDirectory()
        self.upload_directory = Path(self.temp_directory.name)
        self.storage_directory_patch = patch(
            "app.utils.profile_photo_storage.get_profile_photo_directory",
            return_value=self.upload_directory,
        )
        self.storage_directory_patch.start()
        self.serve_directory_patch = patch(
            "app.get_profile_photo_directory",
            return_value=self.upload_directory,
        )
        self.serve_directory_patch.start()

    def tearDown(self):
        self.serve_directory_patch.stop()
        self.storage_directory_patch.stop()
        self.temp_directory.cleanup()
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_student_can_upload_photo_and_fetch_it(self):
        response = self.client.post(
            "/api/student/profile/photo",
            data={
                "photo": (
                    io.BytesIO(b"\x89PNG\r\n\x1a\nvalid-test-image"),
                    "../../profile.png",
                    "image/png",
                )
            },
            headers=self.headers,
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 200)
        photo_path = response.get_json()["data"]["profile_photo"]
        filename = photo_path.rsplit("/", 1)[-1]
        self.assertRegex(filename, r"^student_1_[0-9a-f]{32}\.png$")
        self.assertEqual(
            StudentProfile.query.filter_by(user_id=1).first().profile_photo,
            photo_path,
        )
        self.assertTrue((self.upload_directory / filename).is_file())

        photo_response = self.client.get(photo_path)
        self.assertEqual(photo_response.status_code, 200)
        self.assertTrue(photo_response.data.startswith(b"\x89PNG\r\n\x1a\n"))

    def test_missing_photo_returns_400(self):
        response = self.client.post(
            "/api/student/profile/photo",
            headers=self.headers,
            data={},
        )

        self.assertEqual(response.status_code, 400)

    def test_unsupported_or_mismatched_image_returns_400(self):
        for filename, mimetype, contents in (
            ("photo.svg", "image/svg+xml", b"<svg></svg>"),
            ("photo.gif", "image/gif", b"GIF89a"),
            ("photo.jpg", "image/jpeg", b"not an image"),
        ):
            with self.subTest(filename=filename):
                response = self.client.post(
                    "/api/student/profile/photo",
                    data={
                        "photo": (
                            io.BytesIO(contents),
                            filename,
                            mimetype,
                        )
                    },
                    headers=self.headers,
                    content_type="multipart/form-data",
                )

                self.assertEqual(response.status_code, 400)

    def test_photo_larger_than_five_megabytes_returns_400(self):
        response = self.client.post(
            "/api/student/profile/photo",
            data={
                "photo": (
                    io.BytesIO(b"\x89PNG\r\n\x1a\n" + b"x" * (5 * 1024 * 1024)),
                    "photo.png",
                    "image/png",
                )
            },
            headers=self.headers,
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 400)
        self.assertIn("5 MB", response.get_json()["message"])

    def test_missing_profile_returns_404_without_storing_photo(self):
        StudentProfile.query.filter_by(user_id=1).delete()
        db.session.commit()

        response = self.client.post(
            "/api/student/profile/photo",
            data={
                "photo": (
                    io.BytesIO(b"\x89PNG\r\n\x1a\nvalid-test-image"),
                    "photo.png",
                    "image/png",
                )
            },
            headers=self.headers,
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(list(self.upload_directory.iterdir()), [])

    def test_upload_requires_student_authentication(self):
        response = self.client.post(
            "/api/student/profile/photo",
            data={
                "photo": (
                    io.BytesIO(b"\x89PNG\r\n\x1a\nvalid-test-image"),
                    "photo.png",
                    "image/png",
                )
            },
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 401)


if __name__ == "__main__":
    unittest.main()
