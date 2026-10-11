import unittest
from datetime import datetime
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import StudentProfile, User
from app.services.student_performance_service import StudentPerformanceService


class AdminStudentsTest(unittest.TestCase):
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
            User(id=1, name="Kartik Patil", email="kartik@example.test",
                 mobile="9876543210", password_hash="secret-hash", role="student",
                 is_active=True, email_verified=True,
                 created_at=datetime(2026, 1, 1), updated_at=datetime(2026, 1, 2)),
            User(id=2, name="Second Student", email="second@example.test",
                 mobile="9876543211", password_hash="secret-hash", role="student",
                 is_active=True, created_at=datetime(2026, 2, 1)),
            User(id=3, name="Administrator", email="admin@example.test",
                 password_hash="secret-hash", role="admin", is_active=True),
        ])
        db.session.add(StudentProfile(
            id=1, user_id=1, district="Pune", target_exam="Police Constable"
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

    def test_anonymous_request_is_rejected(self):
        self.assertEqual(self.client.get("/api/admin/students").status_code, 401)

    def test_student_is_rejected(self):
        response = self.client.get("/api/admin/students", headers=self._headers(1))
        self.assertEqual(response.status_code, 403)

    def test_admin_gets_only_students_and_safe_fields(self):
        response = self.client.get("/api/admin/students", headers=self._headers(3))
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        rows = payload["data"]["students"]
        self.assertEqual([row["id"] for row in rows], [2, 1])
        self.assertTrue(all(row["role"] == "student" for row in rows))
        self.assertNotIn("password_hash", str(payload))
        self.assertNotIn("secret-hash", str(payload))
        self.assertEqual(rows[1]["profile"]["district"], "Pune")
        self.assertEqual(payload["data"]["pagination"], {
            "page": 1, "per_page": 20, "total": 2, "pages": 1
        })

    def test_search_matches_name_email_and_mobile(self):
        for search in ("Kartik", "kartik@example", "9876543210"):
            with self.subTest(search=search):
                response = self.client.get(
                    "/api/admin/students", query_string={"search": search},
                    headers=self._headers(3),
                )
                self.assertEqual(response.status_code, 200)
                self.assertEqual(
                    [row["id"] for row in response.get_json()["data"]["students"]],
                    [1],
                )

    def test_pagination_returns_requested_page_and_page_size(self):
        response = self.client.get(
            "/api/admin/students?page=2&per_page=1", headers=self._headers(3)
        )
        payload = response.get_json()["data"]
        self.assertEqual([row["id"] for row in payload["students"]], [1])
        self.assertEqual(payload["pagination"], {
            "page": 2, "per_page": 1, "total": 2, "pages": 2
        })

    def test_invalid_pagination_is_rejected(self):
        for params in ({"page": "0"}, {"page": "abc"},
                       {"per_page": "0"}, {"per_page": "101"},
                       {"per_page": "abc"}):
            with self.subTest(params=params):
                response = self.client.get(
                    "/api/admin/students", query_string=params,
                    headers=self._headers(3),
                )
                self.assertEqual(response.status_code, 400)

    def test_empty_database_returns_empty_page_metadata(self):
        User.query.filter_by(role="student").delete()
        db.session.commit()
        response = self.client.get("/api/admin/students", headers=self._headers(3))
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()["data"]
        self.assertEqual(payload["students"], [])
        self.assertEqual(payload["pagination"], {
            "page": 1, "per_page": 20, "total": 0, "pages": 0
        })

    def test_student_detail_requires_admin_authentication(self):
        anonymous = self.client.get("/api/admin/students/1")
        student = self.client.get(
            "/api/admin/students/1", headers=self._headers(1)
        )
        self.assertEqual(anonymous.status_code, 401)
        self.assertEqual(student.status_code, 403)

    def test_admin_gets_student_detail_with_profile_and_safe_fields(self):
        response = self.client.get(
            "/api/admin/students/1", headers=self._headers(3)
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        student = payload["data"]["student"]
        self.assertEqual(student["id"], 1)
        self.assertEqual(student["role"], "student")
        self.assertEqual(student["email"], "kartik@example.test")
        self.assertEqual(student["profile"]["district"], "Pune")
        self.assertEqual(student["profile"]["target_exam"], "Police Constable")
        self.assertNotIn("password_hash", str(payload))
        self.assertNotIn("secret-hash", str(payload))
        self.assertNotIn("access_token", str(payload))
        self.assertNotIn("refresh_token", str(payload))

    def test_student_without_profile_is_returned_with_null_profile(self):
        response = self.client.get(
            "/api/admin/students/2", headers=self._headers(3)
        )
        self.assertEqual(response.status_code, 200)
        student = response.get_json()["data"]["student"]
        self.assertEqual(student["id"], 2)
        self.assertIsNone(student["profile"])

    def test_unknown_or_non_student_id_returns_same_not_found_response(self):
        unknown = self.client.get(
            "/api/admin/students/999", headers=self._headers(3)
        )
        admin = self.client.get(
            "/api/admin/students/3", headers=self._headers(3)
        )
        self.assertEqual(unknown.status_code, 404)
        self.assertEqual(admin.status_code, 404)
        self.assertEqual(unknown.get_json(), admin.get_json())

    def test_student_status_requires_admin_authentication(self):
        anonymous = self.client.patch(
            "/api/admin/students/1/status", json={"is_active": False}
        )
        student = self.client.patch(
            "/api/admin/students/1/status", json={"is_active": False},
            headers=self._headers(1),
        )
        self.assertEqual(anonymous.status_code, 401)
        self.assertEqual(student.status_code, 403)

    def test_active_admin_can_deactivate_student_safely(self):
        response = self.client.patch(
            "/api/admin/students/1/status", json={"is_active": False},
            headers=self._headers(3),
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        student = payload["data"]["student"]
        self.assertFalse(student["is_active"])
        self.assertEqual(student["role"], "student")
        self.assertNotIn("password_hash", str(payload))
        self.assertNotIn("secret-hash", str(payload))
        self.assertNotIn("access_token", str(payload))
        stored = db.session.get(User, 1)
        self.assertFalse(stored.is_active)
        self.assertEqual(stored.role, "student")
        self.assertEqual(stored.password_hash, "secret-hash")
        self.assertEqual(stored.name, "Kartik Patil")
        self.assertEqual(stored.email, "kartik@example.test")

    def test_inactive_student_can_be_activated(self):
        db.session.get(User, 2).is_active = False
        db.session.commit()
        response = self.client.patch(
            "/api/admin/students/2/status", json={"is_active": True},
            headers=self._headers(3),
        )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.get_json()["data"]["student"]["is_active"])
        self.assertTrue(db.session.get(User, 2).is_active)

    def test_status_unknown_and_admin_ids_share_student_not_found(self):
        unknown = self.client.patch(
            "/api/admin/students/999/status", json={"is_active": False},
            headers=self._headers(3),
        )
        admin = self.client.patch(
            "/api/admin/students/3/status", json={"is_active": False},
            headers=self._headers(3),
        )
        self.assertEqual(unknown.status_code, 404)
        self.assertEqual(admin.status_code, 404)
        self.assertEqual(unknown.get_json(), admin.get_json())

    def test_status_rejects_non_boolean_or_missing_values(self):
        for payload in (
            {"is_active": "false"}, {"is_active": "true"},
            {"is_active": "abc"}, {"is_active": None}, {},
            {"is_active": 0}, {"is_active": 1},
        ):
            with self.subTest(payload=payload):
                response = self.client.patch(
                    "/api/admin/students/1/status", json=payload,
                    headers=self._headers(3),
                )
                self.assertEqual(response.status_code, 400)
                self.assertTrue(db.session.get(User, 1).is_active)

    def test_status_ignores_unrequested_fields(self):
        response = self.client.patch(
            "/api/admin/students/1/status",
            json={"is_active": False, "role": "admin", "name": "Changed",
                  "password_hash": "attacker-value"},
            headers=self._headers(3),
        )
        self.assertEqual(response.status_code, 200)
        student = db.session.get(User, 1)
        self.assertFalse(student.is_active)
        self.assertEqual(student.role, "student")
        self.assertEqual(student.name, "Kartik Patil")
        self.assertEqual(student.password_hash, "secret-hash")

    def test_student_performance_requires_admin_authentication(self):
        anonymous = self.client.get("/api/admin/students/1/performance")
        student = self.client.get(
            "/api/admin/students/1/performance", headers=self._headers(1)
        )
        self.assertEqual(anonymous.status_code, 401)
        self.assertEqual(student.status_code, 403)

    def test_admin_gets_safe_performance_for_requested_student(self):
        expected_data = {
            "overview": {},
            "subjects": [],
            "topics": [],
            "strengths": {},
            "progress": [],
            "test_history": [],
            "physical": {},
        }
        with patch.object(
            StudentPerformanceService,
            "get_complete_performance",
            return_value=expected_data,
        ) as calculate_performance:
            response = self.client.get(
                "/api/admin/students/2/performance",
                headers=self._headers(3),
            )

        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertTrue(payload["success"])
        self.assertEqual(payload["data"], expected_data)
        calculate_performance.assert_called_once_with(2)
        for secret in (
            "password_hash", "secret-hash", "refresh_token", "access_token",
        ):
            self.assertNotIn(secret, str(payload))

    def test_admin_performance_endpoint_returns_complete_service_shape(self):
        response = self.client.get(
            "/api/admin/students/1/performance", headers=self._headers(3)
        )
        self.assertEqual(response.status_code, 200)
        payload = response.get_json()
        self.assertEqual(set(payload["data"]), {
            "overview", "subjects", "topics", "strengths", "progress",
            "test_history", "physical",
        })

    def test_student_performance_unknown_and_admin_ids_share_not_found(self):
        with patch.object(
            StudentPerformanceService, "get_complete_performance"
        ) as calculate_performance:
            unknown = self.client.get(
                "/api/admin/students/999/performance",
                headers=self._headers(3),
            )
            admin = self.client.get(
                "/api/admin/students/3/performance",
                headers=self._headers(3),
            )
        self.assertEqual(unknown.status_code, 404)
        self.assertEqual(admin.status_code, 404)
        self.assertEqual(unknown.get_json(), admin.get_json())
        calculate_performance.assert_not_called()


if __name__ == "__main__":
    unittest.main()
