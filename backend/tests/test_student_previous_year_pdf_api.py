import unittest
from datetime import datetime, timedelta
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import PreviousYearPDF, User


API = "/api/student/previous-year-pdfs"
PRIVATE_STORAGE_KEY = "internal_previous_year_pdf_private_key.pdf"


class StudentPreviousYearPDFAPITest(unittest.TestCase):
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
            User(id=1, name="Student", email="student@test", password_hash="secret",
                 role="student", is_active=True),
            User(id=2, name="Admin", email="admin@test", password_hash="secret",
                 role="admin", is_active=True),
            User(id=3, name="Inactive Student", email="inactive@test", password_hash="secret",
                 role="student", is_active=False),
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

    def add_pdf(self, pdf_id, *, title=None, exam_name="Maharashtra Police Bharti",
                exam_year=2025, active=True, filename=None, created_at=None):
        pdf = PreviousYearPDF(
            id=pdf_id,
            title=title or f"Previous Year Paper {pdf_id}",
            exam_name=exam_name,
            exam_year=exam_year,
            description=f"Description {pdf_id}",
            storage_key=f"{PRIVATE_STORAGE_KEY}-{pdf_id}",
            original_filename=filename or f"paper_{pdf_id}.pdf",
            mime_type="application/pdf",
            file_size_bytes=123456,
            is_active=active,
            created_at=created_at or datetime(2026, 1, 1) + timedelta(days=pdf_id),
            updated_at=datetime(2026, 1, 2),
        )
        db.session.add(pdf)
        db.session.commit()
        return pdf

    def _get(self, query=None, user_id=1):
        headers = self.headers(user_id) if user_id else {}
        return self.client.get(API, query_string=query, headers=headers)

    def test_anonymous_is_rejected_and_only_active_student_is_allowed(self):
        self.assertEqual(self._get(user_id=None).status_code, 401)
        self.assertEqual(self._get(user_id=2).status_code, 403)
        self.assertEqual(self._get(user_id=3).status_code, 403)
        self.assertEqual(self._get(user_id=1).status_code, 200)

    def test_only_active_pdfs_are_returned_with_safe_metadata(self):
        self.add_pdf(1, active=True)
        self.add_pdf(2, active=False)
        response = self._get()
        self.assertEqual(response.status_code, 200)
        body = response.get_json()
        records = body["data"]["previous_year_pdfs"]
        self.assertEqual([record["id"] for record in records], [1])
        self.assertTrue(records[0]["is_active"])
        self.assertEqual(set(records[0]), {
            "id", "title", "exam_name", "exam_year", "description", "original_filename",
            "mime_type", "file_size_bytes", "is_active", "created_at", "updated_at",
        })
        serialized = str(body)
        self.assertNotIn("storage_key", serialized)
        self.assertNotIn(PRIVATE_STORAGE_KEY, serialized)
        self.assertNotIn("backend\\uploads", serialized)
        self.assertNotIn("/uploads/previous_year_pdfs", serialized)

    def test_search_matches_title_exam_name_and_original_filename(self):
        self.add_pdf(1, title="Constable Recruitment", exam_name="District Exam", filename="official-paper.pdf")
        self.add_pdf(2, title="Railway Paper", exam_name="Railway Recruitment", filename="railway.pdf")
        for term in ("constable", "district exam", "official-paper"):
            with self.subTest(term=term):
                response = self._get({"search": term})
                self.assertEqual([item["id"] for item in response.get_json()["data"]["previous_year_pdfs"]], [1])
        response = self._get({"search": "railway recruitment"})
        self.assertEqual([item["id"] for item in response.get_json()["data"]["previous_year_pdfs"]], [2])

    def test_exam_name_year_and_combined_filters_use_active_records(self):
        self.add_pdf(1, exam_name="Police", exam_year=2025, active=True)
        self.add_pdf(2, exam_name="Police", exam_year=2024, active=True)
        self.add_pdf(3, exam_name="Railway", exam_year=2025, active=True)
        self.add_pdf(4, exam_name="Police", exam_year=2025, active=False)
        cases = [
            ({"exam_name": "Police"}, [2, 1]),
            ({"exam_year": "2025"}, [3, 1]),
            ({"exam_name": "Police", "exam_year": "2025"}, [1]),
        ]
        for query, expected_ids in cases:
            with self.subTest(query=query):
                response = self._get(query)
                self.assertEqual([item["id"] for item in response.get_json()["data"]["previous_year_pdfs"]], expected_ids)

    def test_database_pagination_and_newest_first_with_deterministic_tiebreaker(self):
        same_time = datetime(2026, 5, 1)
        self.add_pdf(1, created_at=same_time)
        self.add_pdf(3, created_at=same_time)
        self.add_pdf(2, created_at=same_time - timedelta(days=1))
        first = self._get({"page": "1", "per_page": "2"}).get_json()["data"]
        self.assertEqual([item["id"] for item in first["previous_year_pdfs"]], [3, 1])
        self.assertEqual(first["pagination"], {"page": 1, "per_page": 2, "total": 3, "pages": 2})
        second = self._get({"page": "2", "per_page": "2"}).get_json()["data"]
        self.assertEqual([item["id"] for item in second["previous_year_pdfs"]], [2])

    def test_invalid_pagination_filters_are_rejected(self):
        for query in ({"page": "0"}, {"per_page": "101"}, {"per_page": "bad"}, {"exam_year": "bad"}):
            with self.subTest(query=query):
                self.assertEqual(self._get(query).status_code, 400)


if __name__ == "__main__":
    unittest.main()
