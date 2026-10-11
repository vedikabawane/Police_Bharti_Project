import unittest
from datetime import datetime
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import Subject, Topic, User


class AdminSubjectsTest(unittest.TestCase):
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
            User(
                id=1, name="Student", email="student@example.test",
                password_hash="student-hash", role="student", is_active=True,
            ),
            User(
                id=2, name="Admin", email="admin@example.test",
                password_hash="admin-hash", role="admin", is_active=True,
            ),
        ])
        db.session.add_all([
            Subject(
                id=1, name="Algebra", description="Basic equations",
                is_active=True, created_at=datetime(2026, 1, 1),
                updated_at=datetime(2026, 1, 2),
            ),
            Subject(
                id=2, name="Geography", description="World History",
                is_active=False, created_at=datetime(2026, 1, 3),
                updated_at=datetime(2026, 1, 4),
            ),
            Subject(
                id=3, name="Science", description="Natural Sciences",
                is_active=True, created_at=datetime(2026, 1, 5),
                updated_at=datetime(2026, 1, 6),
            ),
            Subject(
                id=4, name="Mathematics", description="Advanced topics",
                is_active=True, created_at=datetime(2026, 1, 7),
                updated_at=datetime(2026, 1, 8),
            ),
        ])
        db.session.add(Topic(
            id=1, subject_id=1, name="Equations", description="Linear equations",
        ))
        db.session.commit()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    @staticmethod
    def _headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    def test_list_requires_admin_authentication(self):
        anonymous = self.client.get("/api/admin/subjects")
        student = self.client.get(
            "/api/admin/subjects", headers=self._headers(1)
        )
        self.assertEqual(anonymous.status_code, 401)
        self.assertEqual(student.status_code, 403)

    def test_admin_list_returns_safe_fields_and_newest_first(self):
        response = self.client.get(
            "/api/admin/subjects", headers=self._headers(2)
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload["success"])
        data = payload["data"]
        self.assertEqual(
            [subject["id"] for subject in data["subjects"]], [4, 3, 2, 1]
        )
        self.assertEqual(data["pagination"], {
            "page": 1, "per_page": 20, "total": 4, "pages": 1,
        })
        expected_fields = {
            "id", "name", "description", "is_active", "created_at", "updated_at",
        }
        self.assertTrue(all(set(subject) == expected_fields for subject in data["subjects"]))

    def test_pagination_returns_requested_page_and_metadata(self):
        response = self.client.get(
            "/api/admin/subjects?page=2&per_page=2",
            headers=self._headers(2),
        )
        data = response.get_json()["data"]
        self.assertEqual([item["id"] for item in data["subjects"]], [2, 1])
        self.assertEqual(data["pagination"], {
            "page": 2, "per_page": 2, "total": 4, "pages": 2,
        })

    def test_search_matches_name_and_description_case_insensitively(self):
        cases = {
            "math": [4],
            "WORLD": [2],
            "NATURAL": [3],
        }
        for search, expected_ids in cases.items():
            with self.subTest(search=search):
                response = self.client.get(
                    "/api/admin/subjects",
                    query_string={"search": search},
                    headers=self._headers(2),
                )
                subjects = response.get_json()["data"]["subjects"]
                self.assertEqual([item["id"] for item in subjects], expected_ids)

    def test_active_filter_supports_true_false_and_unfiltered_results(self):
        expected = {
            "true": [4, 3, 1],
            "false": [2],
            None: [4, 3, 2, 1],
        }
        for active_filter, expected_ids in expected.items():
            with self.subTest(active_filter=active_filter):
                query = {} if active_filter is None else {"is_active": active_filter}
                response = self.client.get(
                    "/api/admin/subjects", query_string=query,
                    headers=self._headers(2),
                )
                subjects = response.get_json()["data"]["subjects"]
                self.assertEqual([item["id"] for item in subjects], expected_ids)

    def test_invalid_pagination_and_active_filter_are_rejected(self):
        for query in (
            {"page": "0"}, {"page": "abc"}, {"per_page": "0"},
            {"per_page": "101"}, {"per_page": "abc"},
            {"is_active": "yes"}, {"is_active": ""},
        ):
            with self.subTest(query=query):
                response = self.client.get(
                    "/api/admin/subjects", query_string=query,
                    headers=self._headers(2),
                )
                self.assertEqual(response.status_code, 400)

    def test_existing_admin_create_and_update_endpoints_remain_usable(self):
        def create_subject_with_explicit_sqlite_id(name, description=None):
            subject = Subject(
                id=5, name=name, description=description, is_active=True,
            )
            db.session.add(subject)
            db.session.commit()
            return subject

        with patch(
            "app.services.subject_service.SubjectRepository.create",
            side_effect=create_subject_with_explicit_sqlite_id,
        ):
            created = self.client.post(
                "/api/subjects",
                json={"name": "Physics", "description": "Motion and energy"},
                headers=self._headers(2),
            )
        self.assertEqual(created.status_code, 201)
        subject_id = created.get_json()["data"]["id"]
        self.assertTrue(db.session.get(Subject, subject_id).is_active)

        updated = self.client.patch(
            f"/api/subjects/{subject_id}",
            json={
                "name": "Applied Physics",
                "description": "Updated details",
                "is_active": False,
            },
            headers=self._headers(2),
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.get_json()["data"]["name"], "Applied Physics")
        self.assertFalse(updated.get_json()["data"]["is_active"])

        listed = self.client.get(
            "/api/admin/subjects?is_active=false", headers=self._headers(2)
        )
        self.assertIn(
            subject_id,
            [item["id"] for item in listed.get_json()["data"]["subjects"]],
        )

    def test_existing_admin_create_validation_and_invalid_update(self):
        duplicate = self.client.post(
            "/api/subjects", json={"name": "Algebra"},
            headers=self._headers(2),
        )
        self.assertEqual(duplicate.status_code, 409)

        invalid_update = self.client.patch(
            "/api/subjects/999", json={"name": "Missing Subject"},
            headers=self._headers(2),
        )
        self.assertEqual(invalid_update.status_code, 404)

        unexpected_field = self.client.patch(
            "/api/subjects/1", json={"name": "Algebra II", "internal": True},
            headers=self._headers(2),
        )
        self.assertEqual(unexpected_field.status_code, 422)

    def test_student_cannot_create_update_or_delete_subject(self):
        create_response = self.client.post(
            "/api/subjects", json={"name": "Unauthorized Subject"},
            headers=self._headers(1),
        )
        update_response = self.client.patch(
            "/api/subjects/1", json={"name": "Changed"},
            headers=self._headers(1),
        )
        delete_response = self.client.delete(
            "/api/subjects/1", headers=self._headers(1)
        )
        self.assertEqual(create_response.status_code, 403)
        self.assertEqual(update_response.status_code, 403)
        self.assertEqual(delete_response.status_code, 403)
        self.assertEqual(db.session.get(Subject, 1).name, "Algebra")

    def test_existing_student_subject_and_topic_reads_are_preserved(self):
        subjects_response = self.client.get(
            "/api/subjects", headers=self._headers(1)
        )
        topics_response = self.client.get(
            "/api/topics/subject/1", headers=self._headers(1)
        )
        self.assertEqual(subjects_response.status_code, 200)
        self.assertEqual(topics_response.status_code, 200)
        subjects = subjects_response.get_json()["data"]
        self.assertEqual(len(subjects), 4)
        self.assertIn(False, [item["is_active"] for item in subjects])
        self.assertEqual(topics_response.get_json()["data"][0]["name"], "Equations")


if __name__ == "__main__":
    unittest.main()
