import unittest
from datetime import datetime
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import Note, Subject, Topic, User


class AdminNotesTest(unittest.TestCase):
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
            Subject(id=1, name="History"),
            Subject(id=2, name="Science"),
        ])
        db.session.add_all([
            Topic(id=1, subject_id=1, name="Ancient India"),
            Topic(id=2, subject_id=1, name="Modern India"),
            Topic(id=3, subject_id=2, name="Physics"),
        ])
        db.session.add_all([
            Note(id=1, subject_id=1, topic_id=1, title="Ancient Empires", content="Maurya and Gupta history", is_active=True,
                 created_at=datetime(2026, 1, 1), updated_at=datetime(2026, 1, 2)),
            Note(id=2, subject_id=1, topic_id=2, title="Freedom Movement", content="Leaders and events", is_active=False),
            Note(id=3, subject_id=2, topic_id=3, title="Motion Basics", content="Newton laws and force", is_active=True),
            Note(id=4, subject_id=1, topic_id=1, title="Study Guide", content="Additional ancient history", is_active=False),
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
        self.assertEqual(self.client.get("/api/admin/notes").status_code, 401)
        self.assertEqual(self.client.get("/api/admin/notes", headers=self._headers(1)).status_code, 403)
        self.assertEqual(self.client.get("/api/admin/notes", headers=self._headers(3)).status_code, 403)
        self.assertEqual(self.client.get("/api/admin/notes", headers=self._headers(2)).status_code, 200)

    def test_list_includes_subject_topic_and_safe_fields_newest_first(self):
        response = self.client.get("/api/admin/notes", headers=self._headers(2))
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        notes = payload["data"]["notes"]
        self.assertEqual([note["id"] for note in notes], [4, 3, 2, 1])
        self.assertEqual(notes[0]["subject_name"], "History")
        self.assertEqual(notes[0]["topic_name"], "Ancient India")
        self.assertEqual(set(notes[0]), {
            "id", "subject_id", "subject_name", "topic_id", "topic_name", "title", "content",
            "is_active", "created_at", "updated_at",
        })
        self.assertNotIn("password_hash", str(payload))
        self.assertNotIn("internal", str(payload))

    def test_search_matches_title_and_content_case_insensitively(self):
        for term, expected_ids in (("EMPIRES", [1]), ("NEWTON", [3])):
            with self.subTest(term=term):
                response = self.client.get("/api/admin/notes", query_string={"search": term},
                                           headers=self._headers(2))
                self.assertEqual([note["id"] for note in response.get_json()["data"]["notes"]], expected_ids)

    def test_subject_topic_status_and_combined_filters(self):
        cases = [
            ({"subject_id": "1"}, [4, 2, 1]),
            ({"topic_id": "3"}, [3]),
            ({"is_active": "true"}, [3, 1]),
            ({"is_active": "false"}, [4, 2]),
            ({"subject_id": "1", "topic_id": "1", "is_active": "false"}, [4]),
            ({"subject_id": "1", "topic_id": "2", "is_active": "true"}, []),
        ]
        for query, expected_ids in cases:
            with self.subTest(query=query):
                response = self.client.get("/api/admin/notes", query_string=query,
                                           headers=self._headers(2))
                self.assertEqual(response.status_code, 200)
                self.assertEqual([note["id"] for note in response.get_json()["data"]["notes"]], expected_ids)

    def test_unknown_and_invalid_subject_topic_filters(self):
        for field in ("subject_id", "topic_id"):
            response = self.client.get("/api/admin/notes", query_string={field: "999"},
                                       headers=self._headers(2))
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.get_json()["data"]["notes"], [])
            invalid = self.client.get("/api/admin/notes", query_string={field: "invalid"},
                                      headers=self._headers(2))
            self.assertEqual(invalid.status_code, 400)

    def test_pagination_and_per_page_maximum(self):
        response = self.client.get("/api/admin/notes?page=2&per_page=2", headers=self._headers(2))
        data = response.get_json()["data"]
        self.assertEqual([note["id"] for note in data["notes"]], [2, 1])
        self.assertEqual(data["pagination"], {"page": 2, "per_page": 2, "total": 4, "pages": 2})
        limited = self.client.get("/api/admin/notes?per_page=101", headers=self._headers(2))
        self.assertEqual(limited.status_code, 400)

    def test_existing_student_get_returns_active_and_inactive_without_contract_change(self):
        response = self.client.get("/api/notes/topic/1", headers=self._headers(1))
        self.assertEqual(response.status_code, 200)
        self.assertEqual([note["id"] for note in response.get_json()["data"]], [4, 1])
        self.assertFalse(response.get_json()["data"][0]["is_active"])

    def test_existing_admin_create_and_patch_apis_remain_usable(self):
        def create_note_with_explicit_sqlite_id(subject_id, topic_id, data):
            note = Note(id=5, subject_id=subject_id, topic_id=topic_id, **data)
            db.session.add(note)
            db.session.commit()
            return note

        with patch("app.services.note_service.NoteRepository.create",
                   side_effect=create_note_with_explicit_sqlite_id):
            created = self.client.post("/api/notes/subject/2/topic/3",
                                       json={"title": "Chemistry", "content": "Atoms and bonds"},
                                       headers=self._headers(2))
        self.assertEqual(created.status_code, 201)
        self.assertEqual(created.get_json()["data"]["id"], 5)

        updated = self.client.patch("/api/notes/5", json={
            "title": "Chemistry Basics", "content": "Matter and atoms", "is_active": False,
        }, headers=self._headers(2))
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.get_json()["data"]["title"], "Chemistry Basics")
        self.assertFalse(updated.get_json()["data"]["is_active"])
        self.assertNotIn("subject_id", updated.get_json()["data"])

    def test_existing_create_validation_and_delete_remain_usable(self):
        invalid_relationship = self.client.post("/api/notes/subject/1/topic/3",
                                                json={"title": "Invalid", "content": "Mismatch"},
                                                headers=self._headers(2))
        self.assertEqual(invalid_relationship.status_code, 409)
        deleted = self.client.delete("/api/notes/2", headers=self._headers(2))
        self.assertEqual(deleted.status_code, 200)
        self.assertIsNone(db.session.get(Note, 2))


if __name__ == "__main__":
    unittest.main()
