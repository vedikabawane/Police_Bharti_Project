from datetime import datetime, timedelta
from decimal import Decimal
from math import ceil

from app.repositories.test_repository import TestRepository
from app.services.notification_service import NotificationService
from app.repositories.subject_repository import SubjectRepository
from app.repositories.topic_repository import TopicRepository
from app.repositories.question_repository import QuestionRepository
from app.models.question_model import Question
from app.models.question_option_model import QuestionOption
from app.models.test_question_model import TestQuestion
from app.models.test_answer_model import TestAnswer
from app.extensions import db
from app.services.student_performance_service import StudentPerformanceService


class TestService:

    DEFAULT_ADMIN_PAGE = 1
    DEFAULT_ADMIN_PER_PAGE = 20
    MAX_ADMIN_PER_PAGE = 100
    STUDENT_TEST_TYPES = {
        "subject", "topic", "mixed", "full_mock", "daily", "weekly", "previous_year"
    }
    ADMIN_TEST_TYPES = {
        "subject", "topic", "mixed", "full_mock", "daily", "weekly", "previous_year"
    }
    ADMIN_ATTEMPT_STATUSES = {"in_progress", "submitted"}

    @classmethod
    def list_admin_test_attempts(
        cls, page_value=None, per_page_value=None, search_value=None,
        test_id_value=None, student_id_value=None, status_value=None,
        test_type_value=None,
    ):
        page = cls._admin_positive_integer(
            page_value, "page", cls.DEFAULT_ADMIN_PAGE
        )
        per_page = cls._admin_positive_integer(
            per_page_value, "per_page", cls.DEFAULT_ADMIN_PER_PAGE
        )
        if per_page > cls.MAX_ADMIN_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_ADMIN_PER_PAGE}.")

        test_id = cls._admin_optional_positive_integer(test_id_value, "test_id")
        student_id = cls._admin_optional_positive_integer(
            student_id_value, "student_id"
        )
        status = (status_value or "").strip().lower() or None
        if status is not None and status not in cls.ADMIN_ATTEMPT_STATUSES:
            raise ValueError("status is invalid.")
        test_type = (test_type_value or "").strip().lower() or None
        if test_type is not None and test_type not in cls.ADMIN_TEST_TYPES:
            raise ValueError("test_type is invalid.")

        total, attempts = TestRepository.get_admin_test_attempts(
            search=(search_value or "").strip(),
            test_id=test_id,
            student_id=student_id,
            status=status,
            test_type=test_type,
            page=page,
            per_page=per_page,
        )
        return {
            "attempts": [cls._serialize_admin_attempt(attempt) for attempt in attempts],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": ceil(total / per_page) if total else 0,
            },
        }

    @staticmethod
    def _serialize_admin_attempt(attempt):
        test = attempt.test
        student = attempt.student
        return {
            "attempt_id": attempt.id,
            "test_id": attempt.test_id,
            "test_title": test.title if test else None,
            "test_type": test.test_type if test else None,
            "student_id": attempt.student_id,
            "student_name": student.name if student else None,
            "student_email": student.email if student else None,
            "status": attempt.status,
            "started_at": attempt.started_at.isoformat() if attempt.started_at else None,
            "completed_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
            "score": str(attempt.score),
            "total_marks": str(test.total_marks) if test else "0",
            "percentage": str(attempt.percentage),
            "correct_count": attempt.correct_answers,
            "wrong_count": attempt.wrong_answers,
            "skipped_count": attempt.skipped_answers,
            "accuracy": str(attempt.accuracy),
            "time_taken_seconds": attempt.time_taken_seconds,
            "duration_minutes": test.duration_minutes if test else None,
        }

    @classmethod
    def get_admin_test_attempt_detail(cls, attempt_id_value):
        attempt_id = cls._admin_positive_integer(
            attempt_id_value, "attempt_id", None
        )
        attempt = TestRepository.get_admin_test_attempt_by_id(attempt_id)
        if not attempt:
            raise LookupError("Test attempt not found.")

        test = attempt.test
        student = attempt.student
        if not test or not student:
            raise LookupError("Test attempt not found.")

        is_completed = attempt.status == "submitted"
        answers_by_question = {answer.question_id: answer for answer in attempt.answers}
        question_reviews = []
        for test_question in sorted(test.questions, key=lambda row: row.question_order):
            question = test_question.question
            if not question:
                continue
            answer = answers_by_question.get(question.id)
            selected_option = answer.selected_option if answer else None
            if not is_completed:
                result_status = "saved" if selected_option else "unanswered"
            elif not selected_option:
                result_status = "skipped"
            elif answer and answer.is_correct:
                result_status = "correct"
            else:
                result_status = "wrong"

            question_reviews.append({
                "question_id": question.id,
                "question_number": test_question.question_order,
                "question_text": question.question_text,
                "options": [
                    {"label": option.option_label, "text": option.option_text}
                    for option in question.options
                ],
                "selected_option": selected_option,
                "correct_option": (
                    (answer.correct_option if answer else question.correct_option)
                    if is_completed else None
                ),
                "result_status": result_status,
                "marks_earned": (
                    str(answer.marks_obtained) if answer else "0"
                ) if is_completed else None,
            })

        comparison = StudentPerformanceService.get_attempt_comparison_insights(attempt)
        return {
            "attempt": {
                "attempt_id": attempt.id,
                "status": attempt.status,
                "started_at": attempt.started_at.isoformat() if attempt.started_at else None,
                "completed_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
                "time_taken_seconds": attempt.time_taken_seconds,
                "duration_minutes": test.duration_minutes,
            },
            "student": {
                "student_id": student.id,
                "name": student.name,
                "email": student.email,
            },
            "test": {
                "test_id": test.id,
                "title": test.title,
                "test_type": test.test_type,
                "total_questions": test.total_questions,
                "total_marks": str(test.total_marks),
                "duration_minutes": test.duration_minutes,
            },
            "result": {
                "score": str(attempt.score),
                "total_marks": str(test.total_marks),
                "percentage": str(attempt.percentage),
                "correct_count": attempt.correct_answers,
                "wrong_count": attempt.wrong_answers,
                "skipped_count": attempt.skipped_answers,
                "accuracy": str(attempt.accuracy),
                **comparison,
            },
            "questions": question_reviews,
        }

    @classmethod
    def get_admin_test_analytics(cls, test_id_value):
        test_id = cls._admin_positive_integer(
            test_id_value, "test_id", None
        )
        data = TestRepository.get_admin_test_analytics(test_id)
        if not data:
            raise LookupError("Test not found.")

        def metric(value):
            if value is None:
                return None
            return str(Decimal(str(value)).quantize(Decimal("0.01")))

        attempt_counts = data["attempt_counts"]
        avg_score, highest_score, lowest_score, avg_percentage, avg_accuracy = data["score_values"]
        correct, wrong, skipped = data["answer_counts"]
        questions = []
        for (
            question_id, question_order, question_text, attempts,
            question_correct, question_wrong, question_skipped,
        ) in data["question_rows"]:
            attempted_answers = question_correct + question_wrong
            questions.append({
                "question_id": question_id,
                "question_number": question_order,
                "question_text": question_text,
                "attempts": attempts,
                "correct": question_correct,
                "wrong": question_wrong,
                "skipped": question_skipped,
                "accuracy": (
                    round(question_correct * 100 / attempted_answers, 2)
                    if attempted_answers else None
                ),
            })

        range_labels = [
            "0-20%", "21-40%", "41-60%", "61-80%", "81-100%"
        ]
        distribution = dict(data["distribution_rows"])
        return {
            "test": {
                "id": data["test"].id,
                "title": data["test"].title,
                "test_type": data["test"].test_type,
                "total_questions": data["test"].total_questions,
                "total_marks": str(data["test"].total_marks),
                "is_active": data["test"].is_active,
            },
            "attempts": {
                "total": attempt_counts[0],
                "submitted": attempt_counts[2],
                # Expired attempts are finalized as submitted by this platform;
                # the schema stores no reason distinguishing expiry from manual submit.
                "expired": None,
                "in_progress": attempt_counts[3],
                "unique_students": attempt_counts[1],
            },
            "score": {
                "average_score": metric(avg_score),
                "highest_score": metric(highest_score),
                "lowest_score": metric(lowest_score),
                "average_percentage": metric(avg_percentage),
                "average_accuracy": metric(avg_accuracy),
            },
            "answers": {
                "correct": correct,
                "wrong": wrong,
                "skipped": skipped,
            },
            "question_performance": questions,
            "score_distribution": [
                {"range": label, "count": distribution.get(label, 0)}
                for label in range_labels
            ],
        }

    @classmethod
    def list_admin_tests(
        cls, page_value=None, per_page_value=None, search_value=None,
        test_type_value=None, subject_id_value=None, topic_id_value=None,
        is_active_value=None,
    ):
        page = cls._admin_positive_integer(
            page_value, "page", cls.DEFAULT_ADMIN_PAGE
        )
        per_page = cls._admin_positive_integer(
            per_page_value, "per_page", cls.DEFAULT_ADMIN_PER_PAGE
        )
        if per_page > cls.MAX_ADMIN_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_ADMIN_PER_PAGE}.")

        test_type = (test_type_value or "").strip().lower() or None
        if test_type is not None and test_type not in cls.ADMIN_TEST_TYPES:
            raise ValueError("test_type is invalid.")
        subject_id = cls._admin_optional_positive_integer(subject_id_value, "subject_id")
        topic_id = cls._admin_optional_positive_integer(topic_id_value, "topic_id")
        is_active = cls._admin_boolean_filter(is_active_value, "is_active")

        total, tests = TestRepository.get_admin_tests(
            search=(search_value or "").strip(),
            test_type=test_type,
            subject_id=subject_id,
            topic_id=topic_id,
            is_active=is_active,
            page=page,
            per_page=per_page,
        )
        return {
            "tests": tests,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": ceil(total / per_page),
            },
        }

    @staticmethod
    def get_admin_test(test_id):
        test = TestRepository.get_admin_test(test_id)
        if test is None:
            raise ValueError("Test not found.")
        return test

    @classmethod
    def create_admin_test(cls, data):
        title = (data.get("title") or "").strip()
        if not title:
            raise ValueError("title is required.")
        test_type = (data.get("test_type") or "").strip().lower()
        if test_type not in cls.ADMIN_TEST_TYPES:
            raise ValueError("test_type is invalid.")
        duration = data.get("duration_minutes")
        if isinstance(duration, bool) or not isinstance(duration, int) or duration < 1:
            raise ValueError("duration_minutes must be a positive integer.")

        subject_id = data.get("subject_id")
        topic_id = data.get("topic_id")
        question_inputs = data.get("questions")
        if question_inputs is None:
            question_ids = data.get("question_ids") or []
            questions = cls._validate_admin_question_selection(
                test_type, subject_id, topic_id, question_ids
            )
        else:
            questions = []
        create_data = {
            "title": title,
            "description": data.get("description"),
            "instructions": data.get("instructions"),
            "test_type": test_type,
            "subject_id": subject_id,
            "topic_id": topic_id,
            "duration_minutes": duration,
            "negative_marks": Decimal("0"),
            "is_active": data.get("is_active", True),
            "total_questions": len(questions),
            "total_marks": sum(
                (max(Decimal("0"), Decimal(str(question.marks))) for question in questions),
                start=Decimal("0"),
            ),
        }
        owned_question_ids = set()
        try:
            if question_inputs is not None:
                validated_inputs = cls._validate_admin_inline_questions(
                    test_type, subject_id, topic_id, question_inputs
                )
                questions, owned_question_ids = cls._save_admin_inline_questions(
                    validated_inputs, existing_test=None
                )
                create_data["total_questions"] = len(questions)
                create_data["total_marks"] = sum(
                    (max(Decimal("0"), Decimal(str(question.marks))) for question in questions),
                    start=Decimal("0"),
                )
                if create_data["is_active"]:
                    cls._validate_publishable_test(
                        test_type, questions, create_data["total_marks"]
                    )
                test = TestRepository.create_admin_test(
                    create_data, questions, owned_question_ids
                )
            else:
                if data.get("question_ids") is None:
                    raise ValueError("At least one question is required.")
                if create_data["is_active"]:
                    cls._validate_publishable_test(
                        test_type, questions, create_data["total_marks"]
                    )
                test = TestRepository.create_admin_test(create_data, questions)
        except Exception:
            db.session.rollback()
            raise
        if test.is_active:
            NotificationService.try_automatic_notification(
                NotificationService.notify_students_about_test,
                title="नवीन चाचणी उपलब्ध",
                message=f"नवीन चाचणी उपलब्ध आहे: {test.title}",
                test_id=test.id,
            )
        return test

    @classmethod
    def update_admin_test(cls, test_id, data):
        test = TestRepository.find_by_id(test_id)
        if test is None:
            raise ValueError("Test not found.")
        if not data:
            raise ValueError("At least one test field must be provided.")

        update_data = dict(data)
        update_data.pop("negative_marks", None)
        if not update_data:
            return test
        if "title" in update_data:
            update_data["title"] = update_data["title"].strip()
            if not update_data["title"]:
                raise ValueError("title is required.")
        if "test_type" in update_data:
            update_data["test_type"] = update_data["test_type"].strip().lower()

        effective_type = update_data.get("test_type", test.test_type)
        effective_subject_id = update_data.get("subject_id", test.subject_id)
        effective_topic_id = update_data.get("topic_id", test.topic_id)
        inline_question_inputs = update_data.pop("questions", None)
        requested_question_ids = update_data.pop("question_ids", None)
        if inline_question_inputs is not None and requested_question_ids is not None:
            raise ValueError("Provide either questions or question_ids, not both.")
        existing_question_ids = [
            row.question_id for row in TestRepository.get_test_questions(test_id)
        ]
        questions_changed = (
            requested_question_ids is not None
            and requested_question_ids != existing_question_ids
        )
        if requested_question_ids is not None and not questions_changed:
            requested_question_ids = None
        structural_fields = {"test_type", "subject_id", "topic_id"}
        structure_changed = any(
            key in update_data and update_data[key] != getattr(test, key)
            for key in structural_fields
        )
        has_attempts = TestRepository.test_has_attempts(test_id)
        inline_questions_changed = (
            inline_question_inputs is not None
            and not cls._inline_admin_questions_match_test(
                inline_question_inputs, test, effective_type,
                effective_subject_id, effective_topic_id,
            )
        )
        if has_attempts and (
            questions_changed or inline_questions_changed or structure_changed
        ):
            raise ValueError(
                "Test questions, type, subject, or topic cannot be changed after student attempts exist."
            )
        questions = None
        owned_question_ids = None
        if inline_question_inputs is not None and not inline_questions_changed:
            inline_question_inputs = None
        if inline_question_inputs is not None:
            validated_inputs = cls._validate_admin_inline_questions(
                effective_type, effective_subject_id, effective_topic_id,
                inline_question_inputs, test,
            )
            try:
                questions, owned_question_ids = cls._save_admin_inline_questions(
                    validated_inputs, existing_test=test
                )
            except Exception:
                db.session.rollback()
                raise
        elif requested_question_ids is not None:
            questions = cls._validate_admin_question_selection(
                effective_type, effective_subject_id, effective_topic_id,
                requested_question_ids,
            )
        elif structure_changed:
            questions = cls._validate_admin_question_selection(
                effective_type, effective_subject_id, effective_topic_id,
                existing_question_ids,
            )
        if questions is not None and owned_question_ids is None:
            existing_managed_ids = {
                row.question_id for row in TestRepository.get_test_questions(test_id)
                if row.is_admin_created
            }
            owned_question_ids = existing_managed_ids.intersection(
                question.id for question in questions
            )

        if "duration_minutes" in update_data:
            duration = update_data["duration_minutes"]
            if isinstance(duration, bool) or not isinstance(duration, int) or duration < 1:
                raise ValueError("duration_minutes must be a positive integer.")
        try:
            if update_data.get("is_active", test.is_active):
                publish_questions = questions or [
                    row.question for row in TestRepository.get_test_questions(test_id)
                    if row.question is not None
                ]
                marks = sum(
                    (max(Decimal("0"), Decimal(str(question.marks))) for question in publish_questions),
                    start=Decimal("0"),
                )
                cls._validate_publishable_test(effective_type, publish_questions, marks)
            if owned_question_ids is None:
                return TestRepository.update_admin_test(test, update_data, questions)
            return TestRepository.update_admin_test(
                test, update_data, questions, owned_question_ids
            )
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def update_admin_test_status(test_id, is_active):
        if type(is_active) is not bool:
            raise ValueError("is_active must be a boolean.")
        test = TestRepository.find_by_id(test_id)
        if test is None:
            raise ValueError("Test not found.")
        if is_active:
            questions = [
                row.question for row in TestRepository.get_test_questions(test_id)
                if row.question is not None
            ]
            marks = sum(
                (max(Decimal("0"), Decimal(str(question.marks))) for question in questions),
                start=Decimal("0"),
            )
            TestService._validate_publishable_test(test.test_type, questions, marks)
        was_active = test.is_active
        updated_test = TestRepository.update_test_status(test, is_active)
        if not was_active and updated_test.is_active:
            NotificationService.try_automatic_notification(
                NotificationService.notify_students_about_test,
                title="नवीन चाचणी उपलब्ध",
                message=f"नवीन चाचणी उपलब्ध आहे: {updated_test.title}",
                test_id=updated_test.id,
            )
        return updated_test

    @staticmethod
    def delete_admin_test(test_id):
        test = TestRepository.find_by_id(test_id)
        if test is None:
            raise LookupError("Test not found.")

        if (
            TestRepository.test_has_attempts(test_id)
            or TestRepository.test_has_linked_notifications(test_id)
        ):
            TestRepository.update_test_status(test, False)
            return {"archived": True}

        TestRepository.delete_test(test)
        return {"archived": False}

    @classmethod
    def _validate_admin_question_selection(cls, test_type, subject_id, topic_id, question_ids):
        if not isinstance(question_ids, list) or not question_ids:
            raise ValueError("At least one question is required.")
        if len(set(question_ids)) != len(question_ids):
            raise ValueError("Duplicate question IDs are not allowed.")
        if test_type not in cls.ADMIN_TEST_TYPES:
            raise ValueError("test_type is invalid.")
        if test_type == "subject" and subject_id is None:
            raise ValueError("subject_id is required for SUBJECT tests.")
        if test_type == "topic" and (subject_id is None or topic_id is None):
            raise ValueError("subject_id and topic_id are required for TOPIC tests.")

        if subject_id is not None and SubjectRepository.find_by_id(subject_id) is None:
            raise ValueError("Subject not found.")
        topic = None
        if topic_id is not None:
            topic = TopicRepository.find_by_id(topic_id)
            if topic is None:
                raise ValueError("Topic not found.")
            if subject_id is not None and topic.subject_id != subject_id:
                raise ValueError("Topic does not belong to this subject.")

        found_questions = QuestionRepository.get_by_ids(question_ids)
        question_by_id = {question.id: question for question in found_questions}
        missing_ids = [question_id for question_id in question_ids if question_id not in question_by_id]
        if missing_ids:
            raise ValueError(f"Question not found: {missing_ids[0]}.")

        ordered_questions = [question_by_id[question_id] for question_id in question_ids]
        for question in ordered_questions:
            if not question.is_active:
                raise ValueError(f"Question {question.id} is inactive.")
            if test_type == "subject" and question.subject_id != subject_id:
                raise ValueError("All questions in a SUBJECT test must belong to the selected subject.")
            if test_type == "topic" and question.topic_id != topic_id:
                raise ValueError("All questions in a TOPIC test must belong to the selected topic.")
            if test_type == "previous_year" and not question.is_pyq:
                raise ValueError("PREVIOUS_YEAR tests can only include question-bank PYQs.")
        return ordered_questions

    @classmethod
    def _validate_admin_inline_questions(
        cls, test_type, subject_id, topic_id, question_inputs, existing_test=None
    ):
        if not isinstance(question_inputs, list) or not question_inputs:
            raise ValueError("At least one question is required.")
        if test_type == "subject" and subject_id is None:
            raise ValueError("subject_id is required for SUBJECT tests.")
        if test_type == "topic" and (subject_id is None or topic_id is None):
            raise ValueError("subject_id and topic_id are required for TOPIC tests.")
        if subject_id is not None and SubjectRepository.find_by_id(subject_id) is None:
            raise ValueError("Subject not found.")
        selected_topic = TopicRepository.find_by_id(topic_id) if topic_id is not None else None
        if topic_id is not None and selected_topic is None:
            raise ValueError("Topic not found.")
        if selected_topic is not None and subject_id is not None:
            if selected_topic.subject_id != subject_id:
                raise ValueError("Topic does not belong to this subject.")

        existing_managed = {}
        if existing_test is not None:
            existing_managed = {
                row.question_id: row.question
                for row in TestQuestion.query.filter_by(
                    test_id=existing_test.id, is_admin_created=True
                ).all()
                if row.question is not None
            }
        seen_ids = set()
        validated = []
        for item in question_inputs:
            item = dict(item)
            question_id = item.get("id")
            if question_id is not None:
                if question_id in seen_ids:
                    raise ValueError("Duplicate question IDs are not allowed.")
                seen_ids.add(question_id)
                question = existing_managed.get(question_id)
                if question is None:
                    raise ValueError(
                        "Only questions created in this test can be edited in place."
                    )
                if TestQuestion.query.filter(
                    TestQuestion.question_id == question_id,
                    TestQuestion.test_id != existing_test.id,
                ).first() is not None or TestAnswer.query.filter_by(
                    question_id=question_id
                ).first() is not None:
                    raise ValueError(
                        "A question used by another test or historical attempt cannot be edited."
                    )

            item_subject_id = item.get("subject_id") or subject_id
            item_topic_id = item.get("topic_id") or topic_id
            if test_type == "topic":
                if item.get("subject_id") not in (None, subject_id):
                    raise ValueError("All TOPIC test questions must belong to the selected subject.")
                if item.get("topic_id") not in (None, topic_id):
                    raise ValueError("All TOPIC test questions must belong to the selected topic.")
                item_subject_id = subject_id
                item_topic_id = topic_id
            if test_type == "subject" and item_subject_id != subject_id:
                raise ValueError("All SUBJECT test questions must belong to the selected subject.")
            if item_subject_id is None or item_topic_id is None:
                raise ValueError("Every question must have a subject and topic.")
            if not item["question_text"].strip() or any(
                not option["option_text"].strip() for option in item["options"]
            ):
                raise ValueError("Question text and all four options are required.")
            question_subject = SubjectRepository.find_by_id(item_subject_id)
            question_topic = TopicRepository.find_by_id(item_topic_id)
            if question_subject is None:
                raise ValueError(f"Subject {item_subject_id} not found.")
            if question_topic is None:
                raise ValueError(f"Topic {item_topic_id} not found.")
            if question_topic.subject_id != item_subject_id:
                raise ValueError("Question topic does not belong to its subject.")
            if test_type == "topic" and item_topic_id != topic_id:
                raise ValueError("All TOPIC test questions must belong to the selected topic.")
            item["subject_id"] = item_subject_id
            item["topic_id"] = item_topic_id
            if test_type == "previous_year" and not item.get("is_pyq", False):
                raise ValueError("PREVIOUS_YEAR tests can only include PYQ questions.")
            validated.append((item, existing_managed.get(question_id)))
        return validated

    @staticmethod
    def _save_admin_inline_questions(validated_inputs, existing_test=None):
        questions = []
        owned_question_ids = set()
        for item, existing_question in validated_inputs:
            question = existing_question or Question(
                subject_id=item["subject_id"],
                topic_id=item["topic_id"],
                question_text=item["question_text"],
                correct_option=item["correct_option"],
            )
            question.subject_id = item["subject_id"]
            question.topic_id = item["topic_id"]
            question.question_text = item["question_text"].strip()
            question.correct_option = item["correct_option"]
            question.exam_name = item.get("exam_name")
            question.exam_year = item.get("exam_year")
            question.explanation = item.get("explanation")
            question.difficulty = item.get("difficulty", "medium")
            question.marks = item.get("marks", Decimal("1"))
            question.negative_marks = Decimal("0")
            question.is_pyq = item.get("is_pyq", False)
            question.is_active = True
            if existing_question is None:
                if db.engine.dialect.name == "sqlite":
                    question.id = (
                        db.session.query(db.func.max(Question.id)).scalar() or 0
                    ) + 1
                db.session.add(question)
                db.session.flush()
            else:
                question.options.clear()
            for option_data in item["options"]:
                option = QuestionOption(
                    option_label=option_data["option_label"],
                    option_text=option_data["option_text"].strip(),
                )
                if db.engine.dialect.name == "sqlite":
                    option.id = (
                        db.session.query(db.func.max(QuestionOption.id)).scalar() or 0
                    ) + 1
                question.options.append(option)
            db.session.flush()
            questions.append(question)
            owned_question_ids.add(question.id)
        return questions, owned_question_ids

    @staticmethod
    def _inline_admin_questions_match_test(
        question_inputs, test, test_type, subject_id, topic_id
    ):
        rows = sorted(test.questions, key=lambda row: row.question_order)
        if len(rows) != len(question_inputs):
            return False
        for item, row in zip(question_inputs, rows):
            question = row.question
            if question is None:
                return False
            expected_subject = subject_id if test_type in {"subject", "topic"} else item.get("subject_id")
            expected_topic = topic_id if test_type == "topic" else item.get("topic_id")
            if (
                item.get("question_text", "").strip() != question.question_text
                or item.get("correct_option") != question.correct_option
                or item.get("explanation") != question.explanation
                or item.get("difficulty", "medium") != question.difficulty
                or Decimal(str(item.get("marks", "1"))) != Decimal(str(question.marks))
                or item.get("exam_name") != question.exam_name
                or item.get("exam_year") != question.exam_year
                or item.get("is_pyq", False) != question.is_pyq
                or expected_subject != question.subject_id
                or expected_topic != question.topic_id
            ):
                return False
            submitted_options = {
                option["option_label"]: option["option_text"].strip()
                for option in item.get("options", [])
            }
            current_options = {
                option.option_label: option.option_text
                for option in question.options
            }
            if submitted_options != current_options:
                return False
        return True

    @staticmethod
    def _validate_publishable_test(test_type, questions, total_marks):
        if not questions:
            raise ValueError("A test must contain at least one question before publishing.")
        if test_type == "full_mock" and total_marks != Decimal("100"):
            raise ValueError("Overall mock tests must total exactly 100 marks before publishing.")

    @staticmethod
    def _admin_positive_integer(value, field_name, default):
        if value is None or value == "":
            return default
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            raise ValueError(f"{field_name} must be a positive integer.")
        if parsed < 1:
            raise ValueError(f"{field_name} must be a positive integer.")
        return parsed

    @classmethod
    def _admin_optional_positive_integer(cls, value, field_name):
        if value is None or value == "":
            return None
        return cls._admin_positive_integer(value, field_name, None)

    @staticmethod
    def _admin_boolean_filter(value, field_name):
        if value is None or value == "":
            return None
        normalized = str(value).strip().lower()
        if normalized in {"true", "1"}:
            return True
        if normalized in {"false", "0"}:
            return False
        raise ValueError(f"{field_name} must be 'true' or 'false'.")

    # =========================================================
    # CREATE TEST
    # =========================================================

    @staticmethod
    def create_test(data: dict):

        subject_id = data.get("subject_id")
        topic_id = data.get("topic_id")

        # -----------------------------------------------------
        # Validate Subject
        # -----------------------------------------------------

        if subject_id is not None:
            subject = SubjectRepository.find_by_id(subject_id)

            if not subject:
                raise ValueError("Subject not found.")

        # -----------------------------------------------------
        # Validate Topic
        # -----------------------------------------------------

        if topic_id is not None:
            topic = TopicRepository.find_by_id(topic_id)

            if not topic:
                raise ValueError("Topic not found.")

            # Topic must belong to selected subject
            if subject_id is not None and topic.subject_id != subject_id:
                raise ValueError(
                    "Topic does not belong to this subject."
                )

        # -----------------------------------------------------
        # Create Test
        # -----------------------------------------------------

        test = TestRepository.create_test({
            "title": data["title"].strip(),
            "description": data.get("description"),
            "test_type": data["test_type"],
            "subject_id": subject_id,
            "topic_id": topic_id,
            "duration_minutes": data.get(
                "duration_minutes",
                30
            ),
            "negative_marks": Decimal("0"),
            "total_questions": 0,
            "total_marks": Decimal("0")
        })

        if test.is_active:
            NotificationService.try_automatic_notification(
                NotificationService.notify_students_about_test,
                title="नवीन चाचणी उपलब्ध",
                message=f"नवीन चाचणी उपलब्ध आहे: {test.title}",
                test_id=test.id,
            )

        return test


    # =========================================================
    # GET TEST
    # =========================================================

    @staticmethod
    def get_test(test_id: int):

        test = TestRepository.find_by_id(test_id)

        if not test:
            raise ValueError("Test not found.")

        return test


    # =========================================================
    # GET ALL TESTS
    # =========================================================

    @staticmethod
    def get_all_tests():

        return TestRepository.get_all_tests()

    @classmethod
    def list_student_tests(
        cls, page_value=None, per_page_value=None, search_value=None,
        test_type_value=None, subject_id_value=None, topic_id_value=None,
    ):
        page = cls._admin_positive_integer(page_value, "page", 1)
        per_page = cls._admin_positive_integer(per_page_value, "per_page", 20)
        if per_page > cls.MAX_ADMIN_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_ADMIN_PER_PAGE}.")

        test_type = (test_type_value or "").strip().lower() or None
        if test_type is not None and test_type not in cls.STUDENT_TEST_TYPES:
            raise ValueError("test_type is invalid.")
        subject_id = cls._admin_optional_positive_integer(subject_id_value, "subject_id")
        topic_id = cls._admin_optional_positive_integer(topic_id_value, "topic_id")

        total, tests = TestRepository.get_student_tests(
            search=(search_value or "").strip(),
            test_type=test_type,
            subject_id=subject_id,
            topic_id=topic_id,
            page=page,
            per_page=per_page,
        )
        return {
            "tests": tests,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": ceil(total / per_page) if total else 0,
            },
        }

    @classmethod
    def list_student_test_history(
        cls, student_id, page_value=None, per_page_value=None,
        search_value=None, test_type_value=None, subject_id_value=None,
        topic_id_value=None,
    ):
        page = cls._admin_positive_integer(page_value, "page", 1)
        per_page = cls._admin_positive_integer(per_page_value, "per_page", 20)
        if per_page > cls.MAX_ADMIN_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_ADMIN_PER_PAGE}.")

        test_type = (test_type_value or "").strip().lower() or None
        if test_type is not None and test_type not in cls.STUDENT_TEST_TYPES:
            raise ValueError("type is invalid.")
        subject_id = cls._admin_optional_positive_integer(
            subject_id_value, "subject_id"
        )
        topic_id = cls._admin_optional_positive_integer(
            topic_id_value, "topic_id"
        )

        total, attempts = TestRepository.get_student_test_history(
            student_id=student_id,
            search=(search_value or "").strip(),
            test_type=test_type,
            subject_id=subject_id,
            topic_id=topic_id,
            page=page,
            per_page=per_page,
        )
        history = []
        for attempt in attempts:
            test = attempt.test
            comparison = StudentPerformanceService.get_attempt_comparison_insights(
                attempt
            )
            attempted = attempt.correct_answers + attempt.wrong_answers
            history.append({
                "attempt_id": attempt.id,
                "test_id": attempt.test_id,
                "test_title": test.title if test else None,
                "test_type": test.test_type if test else None,
                "subject_id": test.subject_id if test else None,
                "subject_name": (
                    test.subject.name if test and test.subject else None
                ),
                "topic_id": test.topic_id if test else None,
                "topic_name": test.topic.name if test and test.topic else None,
                "score": float(attempt.score),
                "total_marks": float(test.total_marks) if test else 0,
                "percentage": float(attempt.percentage),
                "accuracy": float(attempt.accuracy),
                "correct": attempt.correct_answers,
                "wrong": attempt.wrong_answers,
                "skipped": attempt.skipped_answers,
                "attempted": attempted,
                "time_taken_seconds": attempt.time_taken_seconds,
                "rank": comparison["rank"],
                "previous_percentage": comparison["previous_percentage"],
                "improvement_percentage_points": comparison[
                    "improvement_percentage_points"
                ],
                "completed_at": (
                    (attempt.submitted_at or attempt.started_at).isoformat()
                    if attempt.submitted_at or attempt.started_at else None
                ),
            })

        return {
            "history": history,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": ceil(total / per_page) if total else 0,
            },
        }

    @staticmethod
    def get_student_test(test_id):
        test = TestRepository.find_active_test(test_id)
        if not test:
            raise ValueError("Test not found.")
        return test


    # =========================================================
    # ADD QUESTION TO TEST
    # =========================================================

    @staticmethod
    def add_question(
        test_id: int,
        question_id: int,
        question_order: int = None
    ):

        # -----------------------------------------------------
        # Check Test
        # -----------------------------------------------------

        test = TestRepository.find_by_id(test_id)

        if not test:
            raise ValueError("Test not found.")

        # -----------------------------------------------------
        # Check Question
        # -----------------------------------------------------

        question = QuestionRepository.find_by_id(question_id)

        if not question:
            raise ValueError("Question not found.")

        if not question.is_active:
            raise ValueError("Question is inactive.")

        # -----------------------------------------------------
        # Validate Subject
        # -----------------------------------------------------

        if test.subject_id is not None:
            if question.subject_id != test.subject_id:
                raise ValueError(
                    "Question does not belong to the test subject."
                )

        # -----------------------------------------------------
        # Validate Topic
        # -----------------------------------------------------

        if test.topic_id is not None:
            if question.topic_id != test.topic_id:
                raise ValueError(
                    "Question does not belong to the test topic."
                )

        # -----------------------------------------------------
        # Duplicate Question Check
        # -----------------------------------------------------

        existing = TestRepository.find_test_question(
            test_id=test_id,
            question_id=question_id
        )

        if existing:
            raise ValueError(
                "Question is already added to this test."
            )

        # -----------------------------------------------------
        # Question Order
        # -----------------------------------------------------

        if question_order is None:
            question_order = TestRepository.get_next_question_order(
                test_id
            )

        # -----------------------------------------------------
        # Add Question
        # -----------------------------------------------------

        test_question = TestRepository.add_question_to_test(
            test_id=test_id,
            question_id=question_id,
            question_order=question_order
        )

        # -----------------------------------------------------
        # Update Test Statistics
        # -----------------------------------------------------

        TestService._update_test_statistics(test)

        return test_question


    # =========================================================
    # UPDATE TEST STATISTICS
    # =========================================================

    @staticmethod
    def _update_test_statistics(test):

        test_questions = TestRepository.get_test_questions(
            test.id
        )

        total_questions = len(test_questions)

        total_marks = Decimal("0")

        for test_question in test_questions:

            question = test_question.question

            if question:
                total_marks += max(Decimal("0"), Decimal(str(question.marks)))

        test.total_questions = total_questions
        test.total_marks = total_marks

        db.session.commit()


    # =========================================================
    # GET TEST QUESTIONS
    # =========================================================

    @staticmethod
    def get_test_questions(test_id: int):

        test = TestRepository.find_by_id(test_id)

        if not test:
            raise ValueError("Test not found.")

        return TestRepository.get_test_questions(
            test_id
        )


    # =========================================================
    # START TEST
    # =========================================================

    @staticmethod
    def start_test(
        test_id: int,
        student_id: int
    ):

        # -----------------------------------------------------
        # Check Test
        # -----------------------------------------------------

        test = TestRepository.find_by_id(test_id)

        if not test:
            raise ValueError("Test not found.")

        if not test.is_active:
            raise ValueError("Test is inactive.")

        # -----------------------------------------------------
        # Check Questions
        # -----------------------------------------------------

        test_questions = TestRepository.get_test_questions(
            test_id
        )

        if not test_questions:
            raise ValueError(
                "This test does not have any questions."
            )

        # -----------------------------------------------------
        # Create Attempt
        # -----------------------------------------------------

        attempt = TestRepository.create_attempt(
            test_id=test_id,
            student_id=student_id
        )

        return attempt

    @staticmethod
    def get_student_attempt(attempt_id, student_id):
        attempt = TestRepository.find_attempt_by_id(attempt_id)
        if not attempt:
            raise ValueError("Test attempt not found.")
        if attempt.student_id != student_id:
            raise ValueError("Test attempt not found.")
        if not attempt.test:
            raise ValueError("Test not found.")
        if attempt.status != "in_progress":
            raise ValueError("This test attempt has already been submitted.")
        return attempt

    @staticmethod
    def get_student_attempt_answers(attempt_id):
        return TestRepository.get_attempt_answers(attempt_id)

    @staticmethod
    def save_student_attempt_answer(attempt_id, student_id, question_id, selected_option):
        attempt = TestRepository.find_attempt_for_update(attempt_id)
        if not attempt:
            raise ValueError("Test attempt not found.")
        if attempt.student_id != student_id:
            raise ValueError("Test attempt not found.")
        if attempt.status != "in_progress":
            raise ValueError("This test attempt has already been submitted.")

        test = attempt.test
        if not test or not test.is_active:
            raise ValueError("This test is inactive.")
        if not attempt.started_at or datetime.utcnow() >= attempt.started_at.replace(tzinfo=None) + timedelta(minutes=test.duration_minutes):
            raise ValueError("The test time has expired.")

        test_question = TestRepository.find_test_question(test.id, question_id)
        if not test_question or not test_question.question:
            raise ValueError("Question does not belong to this test.")
        question = test_question.question
        valid_options = {option.option_label for option in question.options}
        if selected_option is not None and selected_option not in valid_options:
            raise ValueError("Selected option is invalid for this question.")

        return TestRepository.save_attempt_answer(attempt.id, question, selected_option)


    # =========================================================
    # SUBMIT TEST
    # =========================================================

    @staticmethod
    def _finalize_attempt(attempt, now=None):
        test = attempt.test
        if not test:
            raise ValueError("Test not found.")

        test_questions = TestRepository.get_test_questions(test.id)
        if not test_questions:
            raise ValueError("This test does not contain any questions.")

        now = now or datetime.utcnow()
        saved_answers = {
            answer.question_id: answer
            for answer in TestRepository.get_attempt_answers(attempt.id)
        }
        correct_answers = 0
        wrong_answers = 0
        total_score = Decimal("0")
        total_marks = Decimal("0")

        for test_question in test_questions:
            question = test_question.question
            if not question:
                continue

            question_marks = max(Decimal("0"), Decimal(str(question.marks)))
            total_marks += question_marks
            answer = saved_answers.get(question.id)
            selected_option = answer.selected_option if answer else None
            if selected_option is None:
                if answer:
                    answer.correct_option = question.correct_option
                    answer.is_correct = False
                    answer.marks_obtained = Decimal("0")
                    answer.time_taken_seconds = 0
                else:
                    TestRepository.create_answer(
                        attempt_id=attempt.id,
                        question_id=question.id,
                        selected_option=None,
                        correct_option=question.correct_option,
                        is_correct=False,
                        marks_obtained=Decimal("0"),
                        time_taken_seconds=0,
                    )
                continue

            is_correct = selected_option == question.correct_option
            marks_obtained = question_marks if is_correct else Decimal("0")
            if is_correct:
                correct_answers += 1
            else:
                wrong_answers += 1
            total_score += marks_obtained

            if answer:
                answer.correct_option = question.correct_option
                answer.is_correct = is_correct
                answer.marks_obtained = marks_obtained
                answer.time_taken_seconds = 0
            else:
                TestRepository.create_answer(
                    attempt_id=attempt.id,
                    question_id=question.id,
                    selected_option=selected_option,
                    correct_option=question.correct_option,
                    is_correct=is_correct,
                    marks_obtained=marks_obtained,
                    time_taken_seconds=0,
                )

        total_questions = len(test_questions)
        attempted_questions = correct_answers + wrong_answers
        skipped_questions = max(0, total_questions - attempted_questions)
        if total_marks > 0:
            percentage = (total_score / total_marks * Decimal("100")).quantize(Decimal("0.01"))
        else:
            percentage = Decimal("0")
        if attempted_questions:
            accuracy = (
                Decimal(correct_answers) / Decimal(attempted_questions) * Decimal("100")
            ).quantize(Decimal("0.01"))
        else:
            accuracy = Decimal("0")

        started_at = attempt.started_at.replace(tzinfo=None) if attempt.started_at else now
        duration_seconds = max(0, test.duration_minutes * 60)
        elapsed_seconds = max(0, int((now - started_at).total_seconds()))
        time_taken = min(elapsed_seconds, duration_seconds)
        attempt.submitted_at = now
        TestRepository.update_attempt_result(
            attempt=attempt,
            score=total_score,
            correct_answers=correct_answers,
            wrong_answers=wrong_answers,
            skipped_answers=skipped_questions,
            percentage=percentage,
            time_taken_seconds=time_taken,
            accuracy=accuracy,
            status="submitted",
        )
        NotificationService.try_automatic_notification(
            NotificationService.notify_student_about_result,
            student_id=attempt.student_id,
            title="चाचणी निकाल उपलब्ध",
            message=f"तुमचा चाचणी निकाल उपलब्ध आहे: {test.title}",
            attempt_id=attempt.id,
        )
        return attempt

    @staticmethod
    def submit_test(attempt_id: int, student_id: int):
        attempt = TestRepository.find_attempt_for_update(attempt_id)
        if not attempt:
            raise ValueError("Test attempt not found.")
        if attempt.student_id != student_id:
            raise ValueError("Test attempt not found.")
        if attempt.status == "submitted":
            return attempt
        if attempt.status != "in_progress":
            raise ValueError("This test attempt cannot be submitted.")
        return TestService._finalize_attempt(attempt)
    # =========================================================
    # GET ATTEMPT RESULT
    # =========================================================

    @staticmethod
    def get_attempt_result(
        attempt_id: int,
        student_id: int
    ):

        attempt = TestRepository.find_attempt_for_update(attempt_id)

        if not attempt:
            raise ValueError(
                "Test attempt not found."
            )

        # -----------------------------------------------------
        # Security Check
        # -----------------------------------------------------

        if attempt.student_id != student_id:
            raise ValueError(
                "Test attempt not found."
            )

        if attempt.status == "in_progress":
            test = attempt.test
            if not test or not attempt.started_at:
                raise ValueError("Test attempt is incomplete.")
            started_at = attempt.started_at.replace(tzinfo=None)
            expires_at = started_at + timedelta(minutes=test.duration_minutes)
            now = datetime.utcnow()
            if now < expires_at:
                raise ValueError("The test attempt is still in progress.")
            return TestService._finalize_attempt(attempt, now=now)

        if attempt.status != "submitted":
            raise ValueError("This test attempt has no result.")

        return attempt

    @staticmethod
    def get_submitted_attempt_question_review(attempt_id, student_id):
        attempt = TestRepository.get_attempt_for_result_review(attempt_id)
        if not attempt or attempt.student_id != student_id:
            raise ValueError("Test attempt not found.")
        if attempt.status != "submitted":
            raise ValueError("The test attempt is still in progress.")
        if not attempt.test:
            raise ValueError("Test not found.")

        answers_by_question = {
            answer.question_id: answer for answer in attempt.answers
        }
        review = []
        for test_question in sorted(
            attempt.test.questions, key=lambda row: row.question_order
        ):
            question = test_question.question
            if not question:
                continue

            answer = answers_by_question.get(question.id)
            selected_option = answer.selected_option if answer else None
            correct_option = (
                answer.correct_option if answer else question.correct_option
            )
            if selected_option is None:
                result_status = "skipped"
            elif selected_option == correct_option:
                result_status = "correct"
            else:
                result_status = "wrong"

            option_by_label = {
                option.option_label: option.option_text
                for option in question.options
            }
            review.append({
                "question_id": question.id,
                "question_number": test_question.question_order,
                "question_text": question.question_text,
                "options": [
                    {
                        "option_label": option.option_label,
                        "option_text": option.option_text,
                    }
                    for option in question.options
                ],
                "selected_option": selected_option,
                "selected_option_text": option_by_label.get(selected_option),
                "correct_option": correct_option,
                "correct_option_text": option_by_label.get(correct_option),
                "result_status": result_status,
                "marks": str(question.marks),
                "marks_earned": str(answer.marks_obtained) if answer else "0",
                "explanation": question.explanation,
                "topic": question.topic.name if question.topic else None,
                "subject": question.subject.name if question.subject else None,
            })
        return review
