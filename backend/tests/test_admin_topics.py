import unittest
from datetime import datetime
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import Subject, Topic, User


class AdminTopicsTest(unittest.TestCase):
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
            User(id=1, name="Student", email="student@test", password_hash="secret", role="student", is_active=True),
            User(id=2, name="Admin", email="admin@test", password_hash="secret", role="admin", is_active=True),
            User(id=3, name="Inactive Admin", email="inactive@test", password_hash="secret", role="admin", is_active=False),
        ])
        db.session.add_all([
            Subject(id=1, name="History", description="Past events"),
            Subject(id=2, name="Science", description="Natural world"),
        ])
        db.session.add_all([
            Topic(id=1, subject_id=1, name="Ancient India", description="Early kingdoms", is_active=True,
                  created_at=datetime(2026, 1, 1), updated_at=datetime(2026, 1, 2)),
            Topic(id=2, subject_id=1, name="Modern India", description="Freedom movement", is_active=False),
            Topic(id=3, subject_id=2, name="Physics", description="Motion and energy", is_active=True),
        ])
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    @staticmethod
    def _headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    def test_authentication_and_active_admin_required(self):
        self.assertEqual(self.client.get("/api/admin/topics").status_code, 401)
        self.assertEqual(self.client.get("/api/admin/topics", headers=self._headers(1)).status_code, 403)
        self.assertEqual(self.client.get("/api/admin/topics", headers=self._headers(3)).status_code, 403)
        self.assertEqual(self.client.get("/api/admin/topics", headers=self._headers(2)).status_code, 200)

    def test_list_includes_subject_and_safe_fields_newest_first(self):
        response = self.client.get("/api/admin/topics", headers=self._headers(2))
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        topics = payload["data"]["topics"]
        self.assertEqual([item["id"] for item in topics], [3, 2, 1])
        self.assertEqual(topics[1]["subject_name"], "History")
        self.assertEqual(topics[1]["subject_id"], 1)
        self.assertEqual(set(topics[0]), {"id", "subject_id", "subject_name", "name", "description",
                                         "is_active", "created_at", "updated_at"})
        self.assertNotIn("internal", str(payload))

    def test_search_matches_name_and_description_case_insensitively(self):
        for term, expected in (("ANCIENT", [1]), ("FREEDOM", [2])):
            response = self.client.get("/api/admin/topics", query_string={"search": term},
                                       headers=self._headers(2))
            self.assertEqual([r["id"] for r in response.get_json()["data"]["topics"]], expected)

    def test_subject_and_active_filters_and_unknown_subject(self):
        cases = [({"subject_id": "1"}, [2, 1]), ({"subject_id": "999"}, []),
                 ({"is_active": "true"}, [3, 1]), ({"is_active": "false"}, [2])]
        for query, expected in cases:
            response = self.client.get("/api/admin/topics", query_string=query, headers=self._headers(2))
            self.assertEqual([r["id"] for r in response.get_json()["data"]["topics"]], expected)
        invalid = self.client.get("/api/admin/topics?subject_id=nope", headers=self._headers(2))
        self.assertEqual(invalid.status_code, 400)

    def test_pagination_and_per_page_limit(self):
        response = self.client.get("/api/admin/topics?page=2&per_page=2", headers=self._headers(2))
        self.assertEqual([r["id"] for r in response.get_json()["data"]["topics"]], [1])
        self.assertEqual(response.get_json()["data"]["pagination"],
                         {"page": 2, "per_page": 2, "total": 3, "pages": 2})
        limited = self.client.get("/api/admin/topics?per_page=101", headers=self._headers(2))
        self.assertEqual(limited.status_code, 400)

    def test_student_topic_read_and_admin_create_update_remain_usable(self):
        student_read = self.client.get("/api/topics/subject/1", headers=self._headers(1))
        self.assertEqual(student_read.status_code, 200)
        self.assertEqual(student_read.get_json()["data"][0]["name"], "Ancient India")
        def create_topic_with_explicit_sqlite_id(subject_id, name, description=None, is_active=True):
            topic = Topic(id=4, subject_id=subject_id, name=name, description=description, is_active=is_active)
            db.session.add(topic)
            db.session.commit()
            return topic

        with patch("app.services.topic_service.TopicRepository.create",
                   side_effect=create_topic_with_explicit_sqlite_id):
            created = self.client.post("/api/topics/subject/2",
                                       json={"name": "Chemistry", "is_active": False},
                                       headers=self._headers(2))
        self.assertEqual(created.status_code, 201)
        created_id = created.get_json()["data"]["id"]
        updated = self.client.patch(f"/api/topics/{created_id}",
                                    json={"subject_id": 1, "is_active": True, "description": "Matter"},
                                    headers=self._headers(2))
        self.assertEqual(updated.status_code, 200)
        stored = db.session.get(Topic, created_id)
        self.assertEqual(stored.subject_id, 1)
        self.assertTrue(stored.is_active)

    def test_invalid_subject_rejected_for_create_and_update(self):
        create = self.client.post("/api/topics/subject/999", json={"name": "Invalid"}, headers=self._headers(2))
        update = self.client.patch("/api/topics/1", json={"subject_id": 999}, headers=self._headers(2))
        self.assertEqual(create.status_code, 409)
        self.assertEqual(update.status_code, 404)


if __name__ == "__main__":
    unittest.main()
