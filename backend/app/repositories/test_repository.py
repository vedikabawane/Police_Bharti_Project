from decimal import Decimal

from app.extensions import db
from app.models.test_model import Test
from app.models.test_question_model import TestQuestion
from app.models.test_attempt_model import TestAttempt
from app.models.test_answer_model import TestAnswer
from app.models.user_model import User
from app.models.question_model import Question
from app.models.notification_model import Notification
from sqlalchemy import and_, case, func, or_
from sqlalchemy.orm import contains_eager, joinedload, selectinload


class TestRepository:

    @staticmethod
    def get_admin_test_analytics(test_id):
        test = Test.query.filter(Test.id == test_id).first()
        if not test:
            return None

        attempt_counts = db.session.query(
            func.count(TestAttempt.id),
            func.count(func.distinct(TestAttempt.student_id)),
            func.coalesce(func.sum(case(
                (TestAttempt.status == "submitted", 1), else_=0
            )), 0),
            func.coalesce(func.sum(case(
                (TestAttempt.status == "in_progress", 1), else_=0
            )), 0),
        ).join(User, User.id == TestAttempt.student_id).filter(
            TestAttempt.test_id == test_id
        ).one()

        score_values = db.session.query(
            func.avg(TestAttempt.score),
            func.max(TestAttempt.score),
            func.min(TestAttempt.score),
            func.avg(TestAttempt.percentage),
            func.avg(TestAttempt.accuracy),
        ).join(User, User.id == TestAttempt.student_id).filter(
            TestAttempt.test_id == test_id,
            TestAttempt.status == "submitted",
        ).one()

        answer_counts = db.session.query(
            func.coalesce(func.sum(case(
                (and_(TestAnswer.selected_option.isnot(None), TestAnswer.is_correct.is_(True)), 1),
                else_=0,
            )), 0),
            func.coalesce(func.sum(case(
                (and_(TestAnswer.selected_option.isnot(None), TestAnswer.is_correct.is_(False)), 1),
                else_=0,
            )), 0),
            func.coalesce(func.sum(case(
                (TestAnswer.selected_option.is_(None), 1), else_=0
            )), 0),
        ).join(
            TestAttempt, TestAttempt.id == TestAnswer.attempt_id
        ).join(
            User, User.id == TestAttempt.student_id
        ).join(
            Question, Question.id == TestAnswer.question_id
        ).filter(
            TestAttempt.test_id == test_id,
            TestAttempt.status == "submitted",
        ).one()

        question_rows = db.session.query(
            TestQuestion.question_id,
            TestQuestion.question_order,
            Question.question_text,
            func.count(case((User.id.isnot(None), TestAnswer.id), else_=None)),
            func.coalesce(func.sum(case(
                (and_(User.id.isnot(None), TestAnswer.id.isnot(None), TestAnswer.selected_option.isnot(None), TestAnswer.is_correct.is_(True)), 1),
                else_=0,
            )), 0),
            func.coalesce(func.sum(case(
                (and_(User.id.isnot(None), TestAnswer.id.isnot(None), TestAnswer.selected_option.isnot(None), TestAnswer.is_correct.is_(False)), 1),
                else_=0,
            )), 0),
            func.coalesce(func.sum(case(
                (and_(User.id.isnot(None), TestAnswer.id.isnot(None), TestAnswer.selected_option.is_(None)), 1),
                else_=0,
            )), 0),
        ).join(
            Question, Question.id == TestQuestion.question_id
        ).outerjoin(
            TestAttempt,
            and_(
                TestAttempt.test_id == TestQuestion.test_id,
                TestAttempt.status == "submitted",
            ),
        ).outerjoin(
            TestAnswer,
            and_(
                TestAnswer.question_id == TestQuestion.question_id,
                TestAnswer.attempt_id == TestAttempt.id,
            ),
        ).outerjoin(
            User, User.id == TestAttempt.student_id
        ).filter(
            TestQuestion.test_id == test_id
        ).group_by(
            TestQuestion.question_id,
            TestQuestion.question_order,
            Question.question_text,
        ).order_by(TestQuestion.question_order.asc()).all()

        distribution_bucket = case(
            (TestAttempt.percentage <= 20, "0-20%"),
            (TestAttempt.percentage <= 40, "21-40%"),
            (TestAttempt.percentage <= 60, "41-60%"),
            (TestAttempt.percentage <= 80, "61-80%"),
            else_="81-100%",
        )
        distribution_rows = db.session.query(
            distribution_bucket,
            func.count(TestAttempt.id),
        ).join(
            User, User.id == TestAttempt.student_id
        ).filter(
            TestAttempt.test_id == test_id,
            TestAttempt.status == "submitted",
        ).group_by(distribution_bucket).all()

        return {
            "test": test,
            "attempt_counts": attempt_counts,
            "score_values": score_values,
            "answer_counts": answer_counts,
            "question_rows": question_rows,
            "distribution_rows": distribution_rows,
        }

    @staticmethod
    def get_admin_test_attempts(
        search, test_id, student_id, status, test_type, page, per_page
    ):
        query = TestAttempt.query.join(TestAttempt.test).join(TestAttempt.student).options(
            joinedload(TestAttempt.test),
            joinedload(TestAttempt.student),
        )
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(
                User.name.ilike(pattern),
                User.email.ilike(pattern),
                Test.title.ilike(pattern),
            ))
        if test_id is not None:
            query = query.filter(TestAttempt.test_id == test_id)
        if student_id is not None:
            query = query.filter(TestAttempt.student_id == student_id)
        if status is not None:
            query = query.filter(TestAttempt.status == status)
        if test_type is not None:
            query = query.filter(func.lower(Test.test_type) == test_type)

        total = query.order_by(None).count()
        attempts = query.order_by(
            TestAttempt.started_at.desc(), TestAttempt.id.desc()
        ).offset((page - 1) * per_page).limit(per_page).all()
        return total, attempts

    @staticmethod
    def get_admin_test_attempt_by_id(attempt_id):
        return TestAttempt.query.options(
            joinedload(TestAttempt.student),
            joinedload(TestAttempt.test).selectinload(Test.questions)
                .joinedload(TestQuestion.question).selectinload(Question.options),
            selectinload(TestAttempt.answers),
        ).filter(TestAttempt.id == attempt_id).first()

    # =========================================================
    # TEST
    # =========================================================

    @staticmethod
    def create_test(data: dict):
        test = Test(**data)

        db.session.add(test)
        db.session.commit()

        return test

    @staticmethod
    def find_by_id(test_id: int):
        return db.session.get(Test, test_id)

    @staticmethod
    def get_all_tests():
        return Test.query.filter_by(
            is_active=True
        ).order_by(
            Test.id.desc()
        ).all()

    @staticmethod
    def get_student_tests(search, test_type, subject_id, topic_id, page, per_page):
        query = Test.query.outerjoin(Test.subject).outerjoin(Test.topic).options(
            contains_eager(Test.subject),
            contains_eager(Test.topic),
        ).filter(Test.is_active.is_(True))

        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(Test.title.ilike(pattern), Test.description.ilike(pattern)))
        if test_type is not None:
            query = query.filter(db.func.lower(Test.test_type) == test_type)
        if subject_id is not None:
            query = query.filter(Test.subject_id == subject_id)
        if topic_id is not None:
            query = query.filter(Test.topic_id == topic_id)

        total = query.order_by(None).count()
        tests = query.order_by(
            Test.created_at.desc(), Test.id.desc()
        ).offset((page - 1) * per_page).limit(per_page).all()
        return total, tests

    @staticmethod
    def get_student_test_history(
        student_id, search, test_type, subject_id, topic_id, page, per_page
    ):
        query = TestAttempt.query.join(
            Test, Test.id == TestAttempt.test_id
        ).options(
            joinedload(TestAttempt.test).joinedload(Test.subject),
            joinedload(TestAttempt.test).joinedload(Test.topic),
        ).filter(
            TestAttempt.student_id == student_id,
            TestAttempt.status == "submitted",
        )

        if search:
            query = query.filter(Test.title.ilike(f"%{search}%"))
        if test_type is not None:
            query = query.filter(func.lower(Test.test_type) == test_type)
        if subject_id is not None:
            query = query.filter(Test.subject_id == subject_id)
        if topic_id is not None:
            query = query.filter(Test.topic_id == topic_id)

        total = query.order_by(None).count()
        completion_time = func.coalesce(
            TestAttempt.submitted_at, TestAttempt.started_at
        )
        attempts = query.order_by(
            completion_time.desc(), TestAttempt.id.desc()
        ).offset((page - 1) * per_page).limit(per_page).all()
        return total, attempts

    @staticmethod
    def find_active_test(test_id):
        return Test.query.outerjoin(Test.subject).outerjoin(Test.topic).options(
            contains_eager(Test.subject),
            contains_eager(Test.topic),
        ).filter(Test.id == test_id, Test.is_active.is_(True)).first()

    @staticmethod
    def get_admin_tests(
        search, test_type, subject_id, topic_id, is_active, page, per_page
    ):
        query = Test.query.outerjoin(Test.subject).outerjoin(Test.topic).options(
            contains_eager(Test.subject),
            contains_eager(Test.topic),
        )
        if search:
            query = query.filter(Test.title.ilike(f"%{search}%"))
        if test_type is not None:
            query = query.filter(Test.test_type == test_type)
        if subject_id is not None:
            query = query.filter(Test.subject_id == subject_id)
        if topic_id is not None:
            query = query.filter(Test.topic_id == topic_id)
        if is_active is not None:
            query = query.filter(Test.is_active == is_active)

        total = query.order_by(None).count()
        tests = query.order_by(
            Test.created_at.desc(), Test.id.desc()
        ).offset((page - 1) * per_page).limit(per_page).all()
        return total, tests

    @staticmethod
    def get_admin_test(test_id):
        return Test.query.options(
            selectinload(Test.questions).selectinload(TestQuestion.question)
        ).filter(Test.id == test_id).first()

    @staticmethod
    def test_has_attempts(test_id):
        return TestAttempt.query.filter_by(test_id=test_id).first() is not None

    @staticmethod
    def test_has_linked_notifications(test_id):
        return Notification.query.filter_by(
            related_entity_type="TEST", related_entity_id=test_id
        ).first() is not None

    @staticmethod
    def delete_test(test):
        try:
            db.session.delete(test)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def create_admin_test(data, questions):
        test = Test(**data)
        test.total_questions = len(questions)
        test.total_marks = sum(
            (max(Decimal("0"), Decimal(str(question.marks))) for question in questions),
            start=Decimal("0"),
        )
        try:
            db.session.add(test)
            db.session.flush()
            for order, question in enumerate(questions, start=1):
                db.session.add(TestQuestion(
                    test_id=test.id,
                    question_id=question.id,
                    question_order=order,
                ))
            db.session.commit()
            db.session.expire(test, ["questions"])
        except Exception:
            db.session.rollback()
            raise
        return test

    @staticmethod
    def update_admin_test(test, data, questions=None):
        try:
            for key, value in data.items():
                setattr(test, key, value)
            if questions is not None:
                TestQuestion.query.filter_by(test_id=test.id).delete(
                    synchronize_session=False
                )
                for order, question in enumerate(questions, start=1):
                    db.session.add(TestQuestion(
                        test_id=test.id,
                        question_id=question.id,
                        question_order=order,
                    ))
                test.total_questions = len(questions)
                test.total_marks = sum(
                    (max(Decimal("0"), Decimal(str(question.marks))) for question in questions),
                    start=Decimal("0"),
                )
            db.session.commit()
            if questions is not None:
                db.session.expire(test, ["questions"])
        except Exception:
            db.session.rollback()
            raise
        return test

    @staticmethod
    def update_test_status(test, is_active):
        try:
            test.is_active = is_active
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return test

    @staticmethod
    def update_test(test, data: dict):
        for key, value in data.items():
            setattr(test, key, value)

        db.session.commit()

        return test

    # =========================================================
    # TEST QUESTIONS
    # =========================================================

    @staticmethod
    def add_question_to_test(
        test_id: int,
        question_id: int,
        question_order: int
    ):
        test_question = TestQuestion(
            test_id=test_id,
            question_id=question_id,
            question_order=question_order
        )

        db.session.add(test_question)
        db.session.commit()

        return test_question

    @staticmethod
    def get_test_questions(test_id: int):
        return TestQuestion.query.filter_by(
            test_id=test_id
        ).order_by(
            TestQuestion.question_order.asc()
        ).all()

    @staticmethod
    def find_test_question(
        test_id: int,
        question_id: int
    ):
        return TestQuestion.query.filter_by(
            test_id=test_id,
            question_id=question_id
        ).first()

    @staticmethod
    def get_next_question_order(test_id: int):
        last_question = TestQuestion.query.filter_by(
            test_id=test_id
        ).order_by(
            TestQuestion.question_order.desc()
        ).first()

        if not last_question:
            return 1

        return last_question.question_order + 1


    # =========================================================
    # TEST ATTEMPTS
    # =========================================================

    @staticmethod
    def create_attempt(
        test_id: int,
        student_id: int
    ):
        attempt = TestAttempt(
            test_id=test_id,
            student_id=student_id
        )

        db.session.add(attempt)
        db.session.commit()

        return attempt

    @staticmethod
    def find_attempt_by_id(attempt_id: int):
        return db.session.get(
            TestAttempt,
            attempt_id
        )

    @staticmethod
    def find_attempt_for_update(attempt_id: int):
        return TestAttempt.query.filter_by(id=attempt_id).with_for_update().first()

    @staticmethod
    def get_student_attempts(
        student_id: int,
        test_id: int = None
    ):
        query = TestAttempt.query.filter_by(
            student_id=student_id
        )

        if test_id is not None:
            query = query.filter_by(
                test_id=test_id
            )

        return query.order_by(
            TestAttempt.id.desc()
        ).all()


    # =========================================================
    # TEST ANSWERS
    # =========================================================

    @staticmethod
    def create_answer(
        attempt_id: int,
        question_id: int,
        selected_option: str,
        correct_option: str,
        is_correct: bool,
        marks_obtained,
        time_taken_seconds: int
    ):
        answer = TestAnswer(
            attempt_id=attempt_id,
            question_id=question_id,
            selected_option=selected_option,
            correct_option=correct_option,
            is_correct=is_correct,
            marks_obtained=marks_obtained,
            time_taken_seconds=time_taken_seconds
        )

        db.session.add(answer)

        return answer

    @staticmethod
    def get_attempt_answers(attempt_id: int):
        return TestAnswer.query.filter_by(
            attempt_id=attempt_id
        ).order_by(
            TestAnswer.id.asc()
        ).all()

    @staticmethod
    def get_attempt_for_result_review(attempt_id: int):
        return TestAttempt.query.options(
            selectinload(TestAttempt.answers),
            joinedload(TestAttempt.test).selectinload(Test.questions)
                .joinedload(TestQuestion.question).selectinload(Question.options),
            joinedload(TestAttempt.test).selectinload(Test.questions)
                .joinedload(TestQuestion.question).joinedload(Question.subject),
            joinedload(TestAttempt.test).selectinload(Test.questions)
                .joinedload(TestQuestion.question).joinedload(Question.topic),
        ).filter(TestAttempt.id == attempt_id).first()

    @staticmethod
    def find_attempt_answer(
        attempt_id: int,
        question_id: int
    ):
        return TestAnswer.query.filter_by(
            attempt_id=attempt_id,
            question_id=question_id
        ).first()

    @staticmethod
    def save_attempt_answer(attempt_id, question, selected_option):
        answer = TestRepository.find_attempt_answer(attempt_id, question.id)

        if selected_option is None:
            if answer:
                db.session.delete(answer)
                db.session.commit()
            return None

        if answer:
            answer.selected_option = selected_option
        else:
            answer = TestAnswer(
                attempt_id=attempt_id,
                question_id=question.id,
                selected_option=selected_option,
                correct_option=question.correct_option,
                is_correct=False,
                marks_obtained=0,
                time_taken_seconds=0,
            )
            db.session.add(answer)

        db.session.commit()
        return answer


    # =========================================================
    # SAVE COMPLETE ATTEMPT RESULT
    # =========================================================

    @staticmethod
    def update_attempt_result(
        attempt,
        score,
        correct_answers,
        wrong_answers,
        skipped_answers,
        percentage,
        time_taken_seconds,
        accuracy,
        status="submitted"
    ):
        attempt.score = score
        attempt.correct_answers = correct_answers
        attempt.wrong_answers = wrong_answers
        attempt.skipped_answers = skipped_answers
        attempt.percentage = percentage
        attempt.time_taken_seconds = time_taken_seconds
        attempt.accuracy = accuracy
        attempt.status = status

        db.session.commit()

        return attempt
