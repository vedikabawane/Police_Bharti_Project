import unittest
from datetime import datetime
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import Subject, Topic, User, Video


class AdminVideosTest(unittest.TestCase):
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
        db.session.add_all([
            User(id=1, name="Student", email="student@video.test", password_hash="x",
                 role="student", is_active=True),
            User(id=2, name="Admin", email="admin@video.test", password_hash="x",
                 role="admin", is_active=True),
            User(id=3, name="Inactive admin", email="inactive@video.test", password_hash="x",
                 role="admin", is_active=False),
        ])
        db.session.add_all([
            Subject(id=1, name="History", is_active=True),
            Subject(id=2, name="Science", is_active=True),
        ])
        db.session.add_all([
            Topic(id=1, subject_id=1, name="Ancient India", is_active=True),
            Topic(id=2, subject_id=2, name="Physics", is_active=True),
        ])
        db.session.add_all([
            Video(id=1, subject_id=1, topic_id=1, title="Ancient lesson",
                  video_url="https://example.test/1", description="Early history",
                  duration="25", is_active=True, created_at=datetime(2026, 1, 1),
                  updated_at=datetime(2026, 1, 1)),
            Video(id=2, subject_id=1, topic_id=1, title="Inactive lesson",
                  video_url="https://example.test/2", description="Old history",
                  duration=None, is_active=False, created_at=datetime(2026, 1, 2),
                  updated_at=datetime(2026, 1, 2)),
            Video(id=3, subject_id=2, topic_id=2, title="Physics lesson",
                  video_url="https://example.test/3", description="Motion",
                  is_active=True, created_at=datetime(2026, 1, 3),
                  updated_at=datetime(2026, 1, 3)),
        ])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    @staticmethod
    def headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    def test_admin_list_requires_active_admin(self):
        self.assertEqual(self.client.get("/api/admin/videos").status_code, 401)
        self.assertEqual(self.client.get("/api/admin/videos", headers=self.headers(1)).status_code, 403)
        self.assertEqual(self.client.get("/api/admin/videos", headers=self.headers(3)).status_code, 403)
        response = self.client.get("/api/admin/videos", headers=self.headers(2))
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.get_json()["data"]["videos"]], [3, 2, 1])

    def test_admin_list_combines_filters_search_and_pagination(self):
        response = self.client.get(
            "/api/admin/videos?search=history&subject_id=1&topic_id=1&is_active=false",
            headers=self.headers(2),
        )
        data = response.get_json()["data"]
        self.assertEqual([item["id"] for item in data["videos"]], [2])
        self.assertEqual(data["videos"][0]["subject"], {"id": 1, "name": "History"})
        self.assertEqual(data["videos"][0]["topic"], {"id": 1, "name": "Ancient India"})
        self.assertEqual(data["pagination"], {"page": 1, "per_page": 20, "total": 1, "pages": 1})
        paginated = self.client.get("/api/admin/videos?page=2&per_page=2", headers=self.headers(2))
        self.assertEqual([item["id"] for item in paginated.get_json()["data"]["videos"]], [1])

    def test_admin_list_rejects_invalid_filters(self):
        for query in ("page=0", "per_page=101", "subject_id=abc", "topic_id=0", "is_active=yes"):
            with self.subTest(query=query):
                response = self.client.get(f"/api/admin/videos?{query}", headers=self.headers(2))
                self.assertEqual(response.status_code, 400)

    def test_admin_create_and_validation(self):
        def create_video(subject_id, topic_id, data):
            video = Video(id=4, subject_id=subject_id, topic_id=topic_id, **data)
            db.session.add(video)
            db.session.commit()
            return video

        payload = {
            "subject_id": 1, "topic_id": 1, "title": " New lesson ",
            "video_url": "https://example.test/new", "description": "Details", "duration": 25,
        }
        with patch("app.repositories.video_repository.VideoRepository.create", side_effect=create_video):
            response = self.client.post("/api/admin/videos", json=payload, headers=self.headers(2))
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["data"]["duration"], "25")
        self.assertTrue(response.get_json()["data"]["is_active"])
        self.assertEqual(response.get_json()["data"]["title"], "New lesson")

        invalid_payloads = [
            ({"subject_id": 1, "topic_id": 1, "video_url": "https://e.test/v"}, "title"),
            ({"subject_id": 1, "topic_id": 1, "title": "Valid"}, "video_url"),
            ({"subject_id": 1, "topic_id": 1, "title": "Valid", "video_url": "not-a-url"}, "video_url"),
            ({"subject_id": 999, "topic_id": 1, "title": "Valid", "video_url": "https://e.test/v"}, None),
            ({"subject_id": 1, "topic_id": 999, "title": "Valid", "video_url": "https://e.test/v"}, None),
            ({"subject_id": 2, "topic_id": 1, "title": "Valid", "video_url": "https://e.test/v"}, None),
        ]
        for invalid, field in invalid_payloads:
            with self.subTest(payload=invalid):
                response = self.client.post("/api/admin/videos", json=invalid, headers=self.headers(2))
                self.assertIn(response.status_code, (404, 422))
                if field:
                    self.assertIn(field, response.get_json().get("errors", {}))

    def test_update_status_and_delete_admin_routes(self):
        updated = self.client.patch("/api/admin/videos/1", json={"title": "Revised"}, headers=self.headers(2))
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.get_json()["data"]["title"], "Revised")
        self.assertEqual(self.client.patch("/api/admin/videos/999", json={"title": "X"},
                                           headers=self.headers(2)).status_code, 404)

        for is_active in (False, True):
            response = self.client.patch(f"/api/admin/videos/1/status", json={"is_active": is_active},
                                         headers=self.headers(2))
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json()["data"]["is_active"], is_active)
        self.assertEqual(self.client.patch("/api/admin/videos/999/status", json={"is_active": False},
                                           headers=self.headers(2)).status_code, 404)
        self.assertEqual(self.client.delete("/api/admin/videos/1", headers=self.headers(2)).status_code, 200)
        self.assertEqual(self.client.delete("/api/admin/videos/999", headers=self.headers(2)).status_code, 404)

    def test_student_topic_read_only_returns_active_videos(self):
        response = self.client.get("/api/videos/topic/1", headers=self.headers(1))
        self.assertEqual(response.status_code, 200)
        self.assertEqual([item["id"] for item in response.get_json()["data"]], [1])


if __name__ == "__main__":
    unittest.main()
