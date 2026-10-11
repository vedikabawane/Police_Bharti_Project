import unittest
from datetime import datetime, timedelta
from decimal import Decimal
from unittest.mock import patch

from flask_jwt_extended import create_access_token

from app import create_app
from app.config.config import Config
from app.extensions import db
from app.models import (
    Question,
    QuestionOption,
    Subject,
    Test,
    TestAnswer,
    TestAttempt,
    TestQuestion,
    Topic,
    User,
)
from app.repositories.test_repository import TestRepository


class StudentTestSubmissionTest(unittest.TestCase):
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
            User(id=1, name="Student One", email="student-one@test", password_hash="secret",
                 role="student", is_active=True),
            User(id=2, name="Student Two", email="student-two@test", password_hash="secret",
                 role="student", is_active=True),
            User(id=3, name="Admin", email="admin@test", password_hash="secret",
                 role="admin", is_active=True),
            Subject(id=1, name="History"),
            Topic(id=1, subject_id=1, name="Ancient"),
        ])
        db.session.add_all([
            Question(id=1, subject_id=1, topic_id=1, question_text="Question one",
                     correct_option="A", difficulty="easy", marks=2,
                     explanation="The stored explanation for question one.",
                     negative_marks=Decimal("0.50"), is_active=True),
            Question(id=2, subject_id=1, topic_id=1, question_text="Question two",
                     correct_option="B", difficulty="medium", marks=1,
                     negative_marks=Decimal("0.25"), is_active=True),
            Question(id=3, subject_id=1, topic_id=1, question_text="Question three",
                     correct_option="C", difficulty="hard", marks=3,
                     negative_marks=Decimal("0.75"), is_active=True),
        ])
        option_id = 1
        for question_id in (1, 2, 3):
            for label in ("A", "B", "C", "D"):
                db.session.add(QuestionOption(
                    id=option_id,
                    question_id=question_id,
                    option_label=label,
                    option_text=f"Option {label}",
                ))
                option_id += 1
        db.session.add(Test(
            id=1,
            title="Submission Test",
            description="Test submission and results",
            test_type="mixed",
            subject_id=1,
            topic_id=1,
            duration_minutes=30,
            total_questions=3,
            total_marks=6,
            negative_marks=0,
            is_active=True,
        ))
        db.session.flush()
        db.session.add_all([
            TestQuestion(id=1, test_id=1, question_id=1, question_order=1),
            TestQuestion(id=2, test_id=1, question_id=2, question_order=2),
            TestQuestion(id=3, test_id=1, question_id=3, question_order=3),
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

    def _add_attempt(self, attempt_id=1, student_id=1, started_at=None, answers=()):
        db.session.add(TestAttempt(
            id=attempt_id,
            test_id=1,
            student_id=student_id,
            started_at=started_at or datetime.utcnow() - timedelta(seconds=20),
        ))
        for answer_id, question_id, selected_option in answers:
            question = db.session.get(Question, question_id)
            db.session.add(TestAnswer(
                id=answer_id,
                attempt_id=attempt_id,
                question_id=question_id,
                selected_option=selected_option,
                correct_option=question.correct_option,
                is_correct=False,
                marks_obtained=Decimal("0"),
                time_taken_seconds=0,
            ))
        db.session.commit()

    @staticmethod
    def _create_answer_for_sqlite(**values):
        answer_id = (db.session.query(db.func.max(TestAnswer.id)).scalar() or 0) + 1
        answer = TestAnswer(id=answer_id, **values)
        db.session.add(answer)
        return answer

    def _add_completed_attempt(
        self, attempt_id, student_id, submitted_at, score, percentage, answers,
        test_id=1,
    ):
        correct = sum(1 for _question_id, selected, correct_option in answers
                      if selected is not None and selected == correct_option)
        wrong = sum(1 for _question_id, selected, correct_option in answers
                    if selected is not None and selected != correct_option)
        skipped = sum(1 for _question_id, selected, _correct_option in answers
                      if selected is None)
        db.session.add(TestAttempt(
            id=attempt_id,
            test_id=test_id,
            student_id=student_id,
            started_at=submitted_at - timedelta(minutes=5),
            submitted_at=submitted_at,
            score=Decimal(str(score)),
            correct_answers=correct,
            wrong_answers=wrong,
            skipped_answers=skipped,
            percentage=Decimal(str(percentage)),
            accuracy=Decimal(str(correct * 100 / (correct + wrong))) if correct + wrong else 0,
            time_taken_seconds=300,
            status="submitted",
        ))
        for offset, (question_id, selected, correct_option) in enumerate(answers, start=1):
            is_correct = selected is not None and selected == correct_option
            db.session.add(TestAnswer(
                id=attempt_id * 100 + offset,
                attempt_id=attempt_id,
                question_id=question_id,
                selected_option=selected,
                correct_option=correct_option,
                is_correct=is_correct,
                marks_obtained=Decimal("1") if is_correct else Decimal("0"),
                time_taken_seconds=0,
            ))

    def test_submission_scores_saved_correct_wrong_and_skipped_answers(self):
        self._add_attempt(answers=((1, 1, "A"), (2, 2, "A")))
        with patch.object(TestRepository, "create_answer", side_effect=self._create_answer_for_sqlite):
            response = self.client.post(
                "/api/tests/attempts/1/submit", headers=self._headers(1)
            )
        self.assertEqual(response.status_code, 200)
        result = response.get_json()["data"]
        self.assertEqual(result["status"], "submitted")
        self.assertEqual(result["total_questions"], 3)
        self.assertEqual(result["attempted_questions"], 2)
        self.assertEqual(result["correct_answers"], 1)
        self.assertEqual(result["wrong_answers"], 1)
        self.assertEqual(result["skipped_questions"], 1)
        self.assertEqual(Decimal(result["total_marks"]), Decimal("6"))
        self.assertEqual(Decimal(result["score"]), Decimal("2.00"))
        self.assertEqual(Decimal(result["percentage"]), Decimal("33.33"))
        self.assertEqual(Decimal(result["accuracy"]), Decimal("50.00"))
        self.assertLessEqual(result["time_taken_seconds"], 30 * 60)
        saved_answers = TestAnswer.query.filter_by(attempt_id=1).order_by(TestAnswer.question_id).all()
        self.assertEqual(len(saved_answers), 3)
        self.assertTrue(saved_answers[0].is_correct)
        self.assertEqual(saved_answers[0].marks_obtained, Decimal("2.00"))
        self.assertFalse(saved_answers[1].is_correct)
        self.assertEqual(saved_answers[1].marks_obtained, Decimal("0.00"))
        self.assertIsNone(saved_answers[2].selected_option)
        self.assertEqual(saved_answers[2].marks_obtained, Decimal("0.00"))

    def test_all_skipped_answers_have_zero_accuracy_and_percentage(self):
        self._add_attempt()
        with patch.object(TestRepository, "create_answer", side_effect=self._create_answer_for_sqlite):
            response = self.client.post(
                "/api/tests/attempts/1/submit", headers=self._headers(1)
            )
        result = response.get_json()["data"]
        self.assertEqual(result["attempted_questions"], 0)
        self.assertEqual(result["skipped_questions"], 3)
        self.assertEqual(Decimal(result["score"]), Decimal("0"))
        self.assertEqual(Decimal(result["percentage"]), Decimal("0"))
        self.assertEqual(Decimal(result["accuracy"]), Decimal("0"))

    def test_all_wrong_answers_score_zero_and_never_negative(self):
        self._add_attempt(answers=((1, 1, "B"), (2, 2, "A"), (3, 3, "A")))
        with patch.object(TestRepository, "create_answer", side_effect=self._create_answer_for_sqlite):
            response = self.client.post(
                "/api/tests/attempts/1/submit", headers=self._headers(1)
            )
        self.assertEqual(response.status_code, 200)
        result = response.get_json()["data"]
        self.assertEqual(result["correct_answers"], 0)
        self.assertEqual(result["wrong_answers"], 3)
        self.assertEqual(result["skipped_questions"], 0)
        self.assertEqual(Decimal(result["score"]), Decimal("0"))
        self.assertEqual(Decimal(result["percentage"]), Decimal("0"))
        self.assertGreaterEqual(Decimal(result["score"]), Decimal("0"))

    def test_mixed_correct_wrong_and_skipped_use_no_deduction(self):
        db.session.get(Question, 2).marks = Decimal("2")
        db.session.get(Question, 3).marks = Decimal("1")
        db.session.add(Question(
            id=4, subject_id=1, topic_id=1, question_text="Question four",
            correct_option="A", difficulty="easy", marks=Decimal("1"),
            negative_marks=Decimal("4"), is_active=True,
        ))
        db.session.add(TestQuestion(
            id=4, test_id=1, question_id=4, question_order=4,
        ))
        db.session.flush()
        db.session.get(Test, 1).total_questions = 4
        db.session.get(Test, 1).total_marks = Decimal("6")
        db.session.commit()
        self._add_attempt(answers=((1, 1, "A"), (2, 2, "A"), (3, 3, "C")))

        with patch.object(TestRepository, "create_answer", side_effect=self._create_answer_for_sqlite):
            response = self.client.post(
                "/api/tests/attempts/1/submit", headers=self._headers(1)
            )

        self.assertEqual(response.status_code, 200)
        result = response.get_json()["data"]
        self.assertEqual(result["correct_answers"], 2)
        self.assertEqual(result["wrong_answers"], 1)
        self.assertEqual(result["skipped_questions"], 1)
        self.assertEqual(Decimal(result["score"]), Decimal("3"))
        self.assertEqual(Decimal(result["total_marks"]), Decimal("6"))
        self.assertEqual(Decimal(result["percentage"]), Decimal("50.00"))

    def test_ownership_duplicate_submission_and_result_key_safety(self):
        self._add_attempt(answers=((1, 1, "A"),))
        self._add_attempt(attempt_id=2, student_id=2, answers=((2, 2, "B"),))
        self.assertEqual(self.client.post(
            "/api/tests/attempts/1/submit", headers=self._headers(2)
        ).status_code, 409)

        with patch.object(TestRepository, "create_answer", side_effect=self._create_answer_for_sqlite):
            first = self.client.post(
                "/api/tests/attempts/1/submit", headers=self._headers(1)
            )
            self.assertEqual(first.status_code, 200)
            answer_count = TestAnswer.query.filter_by(attempt_id=1).count()
            second = self.client.post(
                "/api/tests/attempts/1/submit", headers=self._headers(1)
            )
        self.assertEqual(second.status_code, 200)
        self.assertEqual(TestAnswer.query.filter_by(attempt_id=1).count(), answer_count)
        stored_score_before_review = db.session.get(TestAttempt, 1).score
        own_result = self.client.get(
            "/api/tests/attempts/1/result", headers=self._headers(1)
        )
        self.assertEqual(own_result.status_code, 200)
        own_data = own_result.get_json()["data"]
        self.assertGreaterEqual(Decimal(own_data["score"]), Decimal("0"))
        self.assertGreaterEqual(Decimal(own_data["percentage"]), Decimal("0"))
        self.assertNotIn("correct_option", own_data)
        self.assertNotIn("answers", own_data)
        review = own_data["question_review"]
        self.assertEqual(
            [question["result_status"] for question in review],
            ["correct", "skipped", "skipped"],
        )
        self.assertEqual(review[0]["correct_option"], "A")
        self.assertEqual(review[0]["selected_option_text"], "Option A")
        self.assertEqual(review[0]["correct_option_text"], "Option A")
        self.assertEqual(review[0]["options"][0], {
            "option_label": "A", "option_text": "Option A",
        })
        self.assertEqual(review[0]["explanation"], "The stored explanation for question one.")
        self.assertIsNone(review[1]["explanation"])
        self.assertEqual(review[0]["subject"], "History")
        self.assertEqual(review[0]["topic"], "Ancient")
        self.assertEqual(Decimal(own_data["score"]), Decimal("2.00"))
        self.assertEqual(
            db.session.get(TestAttempt, 1).score, stored_score_before_review
        )
        self.assertEqual(Decimal(review[0]["marks_earned"]), Decimal("2.00"))
        self.assertEqual(Decimal(review[1]["marks_earned"]), Decimal("0"))
        self.assertTrue(all("negative_marks" not in question for question in review))
        self.assertEqual(self.client.get(
            "/api/tests/attempts/1/result", headers=self._headers(2)
        ).status_code, 404)

    def test_submitted_wrong_and_skipped_review_statuses_and_nonnegative_marks(self):
        self._add_attempt(answers=((1, 1, "D"), (2, 2, "A")))
        with patch.object(TestRepository, "create_answer", side_effect=self._create_answer_for_sqlite):
            response = self.client.post(
                "/api/tests/attempts/1/submit", headers=self._headers(1)
            )
        self.assertEqual(response.status_code, 200)
        data = response.get_json()["data"]
        self.assertEqual(
            [question["result_status"] for question in data["question_review"]],
            ["wrong", "wrong", "skipped"],
        )
        self.assertEqual(Decimal(data["score"]), Decimal("0"))
        self.assertTrue(all(
            Decimal(question["marks_earned"]) >= 0
            for question in data["question_review"]
        ))

    def test_unknown_attempt_result_returns_not_found(self):
        response = self.client.get(
            "/api/tests/attempts/999/result", headers=self._headers(1)
        )
        self.assertEqual(response.status_code, 404)

    def test_expired_attempt_is_finalized_from_saved_answers_on_result_read(self):
        self._add_attempt(
            started_at=datetime.utcnow() - timedelta(minutes=31),
            answers=((1, 1, "A"),),
        )
        with patch.object(TestRepository, "create_answer", side_effect=self._create_answer_for_sqlite):
            response = self.client.get(
                "/api/tests/attempts/1/result", headers=self._headers(1)
            )
        self.assertEqual(response.status_code, 200)
        result = response.get_json()["data"]
        self.assertEqual(result["status"], "submitted")
        self.assertEqual(result["correct_answers"], 1)
        self.assertEqual(result["skipped_questions"], 2)
        self.assertEqual(result["time_taken_seconds"], 30 * 60)
        self.assertEqual(len(result["question_review"]), 3)
        self.assertEqual(result["question_review"][0]["result_status"], "correct")

    def test_result_is_unavailable_before_submit_and_requires_auth(self):
        self._add_attempt()
        self.assertEqual(self.client.get("/api/tests/attempts/1/result").status_code, 401)
        in_progress = self.client.get(
            "/api/tests/attempts/1/result", headers=self._headers(1)
        )
        self.assertEqual(in_progress.status_code, 409)

    def test_result_rank_tie_previous_improvement_topics_and_completed_scope(self):
        db.session.add(Topic(id=2, subject_id=1, name="Modern"))
        db.session.add(Question(
            id=4, subject_id=1, topic_id=2, question_text="Question four",
            correct_option="A", difficulty="easy", marks=1,
            negative_marks=0, is_active=True,
        ))
        db.session.add(TestQuestion(id=4, test_id=1, question_id=4, question_order=4))
        db.session.add(Test(
            id=2, title="Other Test", test_type="mixed", duration_minutes=20,
            total_questions=1, total_marks=1, is_active=True,
        ))
        db.session.flush()
        self._add_completed_attempt(
            10, 1, datetime(2026, 1, 1, 8), 2, 33.33,
            [(1, "A", "A"), (2, "B", "B"), (3, None, "C"), (4, "A", "A")],
        )
        self._add_completed_attempt(
            11, 2, datetime(2026, 1, 1, 9), 4, 66.67,
            [(1, "A", "A"), (2, "B", "B"), (3, None, "C"), (4, "A", "A")],
        )
        self._add_completed_attempt(
            12, 1, datetime(2026, 1, 1, 10), 4, 66.67,
            [(1, "A", "A"), (2, "B", "B"), (3, None, "C"), (4, "B", "A")],
        )
        self._add_completed_attempt(
            13, 2, datetime(2026, 1, 1, 11), 100, 100,
            [(1, "A", "A")], test_id=2,
        )
        db.session.add(TestAttempt(
            id=14, test_id=1, student_id=2, started_at=datetime(2026, 1, 1, 12),
            score=Decimal("100"), status="in_progress",
        ))
        db.session.commit()

        with patch.object(Config, "PERFORMANCE_MIN_TOPIC_QUESTIONS", 1):
            response = self.client.get(
                "/api/tests/attempts/12/result", headers=self._headers(1)
            )
            other_owner = self.client.get(
                "/api/tests/attempts/12/result", headers=self._headers(2)
            )
            no_previous = self.client.get(
                "/api/tests/attempts/11/result", headers=self._headers(2)
            )

        self.assertEqual(response.status_code, 200)
        result = response.get_json()["data"]
        self.assertEqual(result["rank"], 2)
        self.assertEqual(result["previous_score"], 2.0)
        self.assertEqual(result["previous_percentage"], 33.33)
        self.assertAlmostEqual(result["improvement_percentage_points"], 33.34)
        self.assertEqual(result["strong_topics"][0]["topic_name"], "Ancient")
        self.assertEqual(result["strong_topics"][0]["percentage"], 100)
        self.assertEqual(result["weak_topics"][0]["topic_name"], "Modern")
        self.assertEqual(result["weak_topics"][0]["percentage"], 0)
        self.assertNotIn("student_id", result)
        self.assertNotIn("correct_option", result)
        self.assertEqual(other_owner.status_code, 404)
        self.assertEqual(self.client.get("/api/tests/attempts/12/result").status_code, 401)
        self.assertEqual(self.client.get(
            "/api/tests/attempts/12/result", headers=self._headers(3)
        ).status_code, 403)
        self.assertEqual(no_previous.status_code, 200)
        no_previous_data = no_previous.get_json()["data"]
        self.assertIsNone(no_previous_data["previous_score"])
        self.assertIsNone(no_previous_data["previous_percentage"])
        self.assertIsNone(no_previous_data["improvement_percentage_points"])


if __name__ == "__main__":
    unittest.main()
