import unittest
from unittest.mock import patch

from flask_jwt_extended import create_access_token
from sqlalchemy import inspect

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import PhysicalTraining, User


class PhysicalTrainingApiTest(unittest.TestCase):

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

        self.student = User(
            id=1,
            name="Student One",
            email="student1@example.test",
            password_hash="test-hash",
            role="student",
            is_active=True,
            email_verified=True
        )
        self.other_student = User(
            id=2,
            name="Student Two",
            email="student2@example.test",
            password_hash="test-hash",
            role="student",
            is_active=True,
            email_verified=True
        )
        self.admin = User(
            id=3,
            name="Admin",
            email="admin@example.test",
            password_hash="test-hash",
            role="admin",
            is_active=True,
            email_verified=True
        )
        db.session.add_all([self.student, self.other_student, self.admin])
        db.session.commit()

        self.student_headers = self._headers(1)
        self.other_student_headers = self._headers(2)
        self.admin_headers = self._headers(3)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    @staticmethod
    def _headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    @staticmethod
    def _payload(date="2026-10-02", **values):
        return {
            "date": date,
            "running": "900.00",
            "run_100m": "15.25",
            "run_1600m": "420.50",
            "run_800m": "210.25",
            "long_jump": "4.25",
            "shot_put": "7.10",
            "push_ups": 25,
            "running_distance": "2500.00",
            "running_time": "900.00",
            "weight": "68.50",
            **values
        }

    def _create_record(self, headers=None, **kwargs):
        return self.client.post(
            "/api/student/physical-training",
            json=self._payload(**kwargs),
            headers=headers or self.student_headers
        )

    def test_student_can_create_record(self):
        response = self._create_record()

        self.assertEqual(response.status_code, 201)
        body = response.get_json()
        self.assertTrue(body["success"])
        self.assertEqual(body["data"]["user_id"], self.student.id)
        self.assertEqual(body["data"]["date"], "2026-10-02")
        self.assertEqual(body["data"]["run_100m"], "15.25")

    def test_student_can_get_their_history_in_date_and_id_order(self):
        self._create_record(date="2026-10-01")
        self._create_record(date="2026-10-02")
        self._create_record(date="2026-10-02")

        response = self.client.get(
            "/api/student/physical-training",
            headers=self.student_headers
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(
            [record["date"] for record in data],
            ["2026-10-02", "2026-10-02", "2026-10-01"]
        )
        self.assertGreater(data[0]["id"], data[1]["id"])

    def test_student_can_get_one_of_their_records(self):
        record_id = self._create_record().get_json()["data"]["id"]

        response = self.client.get(
            f"/api/student/physical-training/{record_id}",
            headers=self.student_headers
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["id"], record_id)

    def test_student_can_partially_update_their_record(self):
        record_id = self._create_record().get_json()["data"]["id"]

        response = self.client.patch(
            f"/api/student/physical-training/{record_id}",
            json={"weight": "69.25"},
            headers=self.student_headers
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["weight"], "69.25")

    def test_student_can_delete_their_record(self):
        record_id = self._create_record().get_json()["data"]["id"]

        response = self.client.delete(
            f"/api/student/physical-training/{record_id}",
            headers=self.student_headers
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.get_json()["data"]["id"],
            record_id
        )

        fetch_response = self.client.get(
            f"/api/student/physical-training/{record_id}",
            headers=self.student_headers
        )
        self.assertEqual(fetch_response.status_code, 404)

    def test_student_can_get_latest_record(self):
        self._create_record(date="2026-10-01")
        latest_id = self._create_record(date="2026-10-02").get_json()["data"]["id"]

        response = self.client.get(
            "/api/student/physical-training/latest",
            headers=self.student_headers
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["data"]["id"], latest_id)

    def test_latest_returns_404_when_student_has_no_records(self):
        response = self.client.get(
            "/api/student/physical-training/latest",
            headers=self.student_headers
        )

        self.assertEqual(response.status_code, 404)

    def test_unauthenticated_request_is_rejected(self):
        response = self.client.get("/api/student/physical-training")

        self.assertEqual(response.status_code, 401)

    def test_non_student_role_is_rejected(self):
        response = self.client.get(
            "/api/student/physical-training",
            headers=self.admin_headers
        )

        self.assertEqual(response.status_code, 403)

    def test_student_cannot_access_another_students_record(self):
        record_id = self._create_record(
            headers=self.other_student_headers
        ).get_json()["data"]["id"]

        route = f"/api/student/physical-training/{record_id}"
        response = self.client.get(route, headers=self.student_headers)

        self.assertEqual(response.status_code, 404)

        update_response = self.client.patch(
            route,
            json={"weight": "70.00"},
            headers=self.student_headers
        )
        self.assertEqual(update_response.status_code, 404)

        delete_response = self.client.delete(
            route,
            headers=self.student_headers
        )
        self.assertEqual(delete_response.status_code, 404)

    def test_student_id_in_payload_is_rejected(self):
        response = self._create_record(user_id=self.other_student.id)

        self.assertEqual(response.status_code, 422)
        self.assertIn("user_id", response.get_json()["errors"])

    def test_invalid_dates_negative_values_and_non_numeric_values_are_rejected(self):
        invalid_payloads = [
            self._payload(date="02-10-2026"),
            self._payload(run_100m="-1"),
            self._payload(run_100m="15.253"),
            self._payload(weight="not-a-number")
        ]

        for payload in invalid_payloads:
            with self.subTest(payload=payload):
                response = self.client.post(
                    "/api/student/physical-training",
                    json=payload,
                    headers=self.student_headers
                )
                self.assertEqual(response.status_code, 422)

    def test_date_is_required_and_empty_patch_is_rejected(self):
        missing_date = self._payload()
        missing_date.pop("date")
        response = self.client.post(
            "/api/student/physical-training",
            json=missing_date,
            headers=self.student_headers
        )
        self.assertEqual(response.status_code, 422)

        record_id = self._create_record().get_json()["data"]["id"]
        empty_patch = self.client.patch(
            f"/api/student/physical-training/{record_id}",
            json={},
            headers=self.student_headers
        )
        self.assertEqual(empty_patch.status_code, 400)

    def test_physical_training_table_has_expected_columns_and_user_foreign_key(self):
        table = inspect(db.engine).get_columns("physical_training_records")
        column_names = {column["name"] for column in table}
        self.assertTrue({
            "id",
            "user_id",
            "date",
            "running",
            "run_100m",
            "run_1600m",
            "run_800m",
            "long_jump",
            "shot_put",
            "push_ups",
            "running_distance",
            "running_time",
            "weight",
            "created_at",
            "updated_at"
        }.issubset(column_names))

        foreign_keys = inspect(db.engine).get_foreign_keys(
            "physical_training_records"
        )
        self.assertTrue(any(
            foreign_key["referred_table"] == "users"
            and foreign_key["constrained_columns"] == ["user_id"]
            for foreign_key in foreign_keys
        ))


if __name__ == "__main__":
    unittest.main()
