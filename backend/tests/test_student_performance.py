import unittest
from datetime import datetime, date
from decimal import Decimal
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import (
    PhysicalTraining,
    Question,
    Subject,
    Test,
    TestAnswer,
    TestAttempt,
    Topic,
    User,
)


class StudentPerformanceTest(unittest.TestCase):

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
                id=1,
                name="Student One",
                email="student1@example.test",
                password_hash="test-hash",
                role="student",
                is_active=True,
            ),
            User(
                id=2,
                name="Student Two",
                email="student2@example.test",
                password_hash="test-hash",
                role="student",
                is_active=True,
            ),
            User(
                id=3,
                name="Admin",
                email="admin@example.test",
                password_hash="test-hash",
                role="admin",
                is_active=True,
            ),
            Subject(id=1, name="मराठी"),
            Subject(id=2, name="गणित"),
            Topic(id=1, subject_id=1, name="व्याकरण"),
            Topic(id=2, subject_id=2, name="अंकगणित"),
            Test(
                id=1,
                title="सराव चाचणी",
                test_type="mixed",
                total_questions=3,
                total_marks=4,
                negative_marks=Decimal("0.25"),
            ),
            Question(
                id=1,
                subject_id=1,
                topic_id=1,
                question_text="प्रश्न १",
                correct_option="A",
                marks=Decimal("2"),
            ),
            Question(
                id=2,
                subject_id=1,
                topic_id=1,
                question_text="प्रश्न २",
                correct_option="A",
                marks=Decimal("1"),
            ),
            Question(
                id=3,
                subject_id=2,
                topic_id=2,
                question_text="प्रश्न ३",
                correct_option="B",
                marks=Decimal("1"),
            ),
        ])
        db.session.flush()
        db.session.add_all([
            TestAttempt(
                id=10,
                test_id=1,
                student_id=1,
                started_at=datetime(2026, 1, 1, 9),
                submitted_at=datetime(2026, 1, 1, 10),
                score=Decimal("1.75"),
                correct_answers=1,
                wrong_answers=1,
                skipped_answers=1,
                percentage=Decimal("43.75"),
                time_taken_seconds=900,
                accuracy=Decimal("50"),
                status="submitted",
            ),
            TestAttempt(
                id=11,
                test_id=1,
                student_id=1,
                started_at=datetime(2026, 1, 2, 9),
                status="in_progress",
            ),
            TestAttempt(
                id=12,
                test_id=1,
                student_id=2,
                started_at=datetime(2026, 1, 1, 9),
                submitted_at=datetime(2026, 1, 1, 10),
                score=Decimal("2"),
                correct_answers=1,
                wrong_answers=0,
                skipped_answers=0,
                percentage=Decimal("50"),
                time_taken_seconds=500,
                accuracy=Decimal("100"),
                status="submitted",
            ),
        ])
        db.session.flush()
        db.session.add_all([
            TestAnswer(
                id=1,
                attempt_id=10,
                question_id=1,
                selected_option="A",
                correct_option="A",
                is_correct=True,
                marks_obtained=Decimal("2"),
                time_taken_seconds=100,
            ),
            TestAnswer(
                id=2,
                attempt_id=10,
                question_id=2,
                selected_option="B",
                correct_option="A",
                is_correct=False,
                marks_obtained=Decimal("-0.25"),
                time_taken_seconds=200,
            ),
            TestAnswer(
                id=3,
                attempt_id=10,
                question_id=3,
                selected_option=None,
                correct_option="B",
                is_correct=False,
                marks_obtained=Decimal("0"),
                time_taken_seconds=0,
            ),
            TestAnswer(
                id=4,
                attempt_id=12,
                question_id=1,
                selected_option="A",
                correct_option="A",
                is_correct=True,
                marks_obtained=Decimal("2"),
                time_taken_seconds=100,
            ),
        ])
        db.session.add_all([
            PhysicalTraining(
                id=1,
                user_id=1,
                date=date(2026, 1, 1),
                weight=Decimal("70"),
                run_100m=Decimal("15.20"),
            ),
            PhysicalTraining(
                id=2,
                user_id=1,
                date=date(2026, 1, 2),
                weight=Decimal("69.50"),
                running_distance=Decimal("2.5"),
            ),
            PhysicalTraining(
                id=3,
                user_id=2,
                date=date(2026, 1, 3),
                weight=Decimal("80"),
            ),
        ])
        db.session.commit()
        self.student_headers = self._headers(1)
        self.other_student_headers = self._headers(2)
        self.admin_headers = self._headers(3)

    @staticmethod
    def _headers(user_id):
        token = create_access_token(identity=str(user_id))
        return {"Authorization": f"Bearer {token}"}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.app_context.pop()

    def test_overview_uses_only_submitted_attempts_for_results(self):
        response = self.client.get(
            "/api/student/performance/overview",
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["total_tests"], 1)
        self.assertEqual(data["total_test_attempts"], 2)
        self.assertEqual(data["completed_tests"], 1)
        self.assertEqual(data["total_questions_attempted"], 2)
        self.assertEqual(data["total_correct"], 1)
        self.assertEqual(data["total_wrong"], 1)
        self.assertEqual(data["total_skipped"], 1)
        self.assertEqual(data["overall_accuracy"], 50)
        self.assertIsNone(data["total_study_attempts"])
        self.assertIsNone(data["improvement_percentage"])

    def test_subject_and_topic_metrics_use_real_question_relationships(self):
        subjects_response = self.client.get(
            "/api/student/performance/subjects",
            headers=self.student_headers,
        )
        topics_response = self.client.get(
            "/api/student/performance/topics",
            headers=self.student_headers,
        )

        self.assertEqual(subjects_response.status_code, 200)
        subjects = subjects_response.get_json()["data"]
        marathi = next(
            subject for subject in subjects if subject["subject_id"] == 1
        )
        self.assertEqual(marathi["subject_name"], "मराठी")
        self.assertEqual(marathi["correct"], 1)
        self.assertEqual(marathi["wrong"], 1)
        self.assertEqual(marathi["skipped"], 0)
        self.assertEqual(marathi["score"], 1.75)
        self.assertAlmostEqual(marathi["percentage"], 58.3333, places=3)
        self.assertEqual(marathi["accuracy"], 50)

        self.assertEqual(topics_response.status_code, 200)
        topics = topics_response.get_json()["data"]
        grammar = next(topic for topic in topics if topic["topic_id"] == 1)
        self.assertEqual(grammar["subject_name"], "मराठी")
        self.assertEqual(grammar["questions_attempted"], 2)

    def test_strengths_respect_minimum_question_threshold(self):
        response = self.client.get(
            "/api/student/performance/strengths",
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["minimum_questions"], 5)
        self.assertEqual(data["strong_topics"], [])
        self.assertEqual(data["weak_topics"], [])
        self.assertEqual(len(data["insufficient_data_topics"]), 2)

    def test_progress_is_chronological_and_history_is_newest_first(self):
        progress_response = self.client.get(
            "/api/student/performance/progress",
            headers=self.student_headers,
        )
        history_response = self.client.get(
            "/api/student/performance/test-history",
            headers=self.student_headers,
        )

        self.assertEqual(progress_response.status_code, 200)
        self.assertEqual(
            [item["attempt_id"] for item in progress_response.get_json()["data"]],
            [10],
        )
        history = history_response.get_json()["data"]
        self.assertEqual(history[0]["test_name"], "सराव चाचणी")
        self.assertEqual(history[0]["test_type"], "mixed")
        self.assertEqual(history[0]["total_questions"], 3)
        self.assertEqual(history[0]["time_taken_seconds"], 900)

    def test_physical_performance_is_scoped_and_chronological(self):
        response = self.client.get(
            "/api/student/performance/physical",
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["latest_weight"], 69.5)
        self.assertEqual(data["previous_weight"], 70)
        self.assertEqual(data["weight_change"], -0.5)
        self.assertEqual(
            [item["date"] for item in data["history"]],
            ["2026-01-01", "2026-01-02"],
        )
        self.assertEqual(data["latest"]["running_distance"], 2.5)
        self.assertEqual(
            set(data["latest"]),
            {
                "id", "date", "weight", "running_distance", "running_time",
                "run_100m", "run_800m", "run_1600m", "shot_put", "push_ups",
            },
        )

    def test_combined_endpoint_reuses_performance_sections(self):
        response = self.client.get(
            "/api/student/performance",
            headers=self.student_headers,
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            set(response.get_json()["data"]),
            {
                "overview",
                "subjects",
                "topics",
                "strengths",
                "progress",
                "test_history",
                "physical",
            },
        )

    def test_no_data_returns_empty_collections_and_null_metrics(self):
        db.session.query(TestAnswer).delete()
        db.session.query(TestAttempt).filter_by(student_id=1).delete()
        db.session.query(PhysicalTraining).filter_by(user_id=1).delete()
        db.session.commit()

        response = self.client.get(
            "/api/student/performance/overview",
            headers=self.student_headers,
        )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(data["total_tests"], 0)
        self.assertEqual(data["total_correct"], 0)
        self.assertIsNone(data["average_percentage"])
        self.assertIsNone(data["overall_accuracy"])

    def test_authentication_and_student_role_are_required(self):
        self.assertEqual(
            self.client.get("/api/student/performance").status_code,
            401,
        )
        self.assertEqual(
            self.client.get(
                "/api/student/performance",
                headers=self.admin_headers,
            ).status_code,
            403,
        )

    def test_student_cannot_access_another_students_performance(self):
        response = self.client.get(
            "/api/student/performance/overview",
            headers=self.other_student_headers,
        )

        data = response.get_json()["data"]
        self.assertEqual(response.status_code, 200)
        self.assertEqual(data["completed_tests"], 1)
        self.assertEqual(data["total_correct"], 1)
        self.assertEqual(data["total_wrong"], 0)


if __name__ == "__main__":
    unittest.main()
