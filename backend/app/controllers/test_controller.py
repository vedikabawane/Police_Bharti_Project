from datetime import datetime, timedelta, timezone
from decimal import Decimal

from flask import Blueprint, g, request
from flask_jwt_extended import get_jwt_identity
from marshmallow import Schema, ValidationError, fields, validate

from app.middleware.rbac import role_required

from app.schemas.test_schema import (
    CreateTestSchema,
    AddTestQuestionSchema,
)

from app.services.test_service import TestService
from app.services.student_performance_service import StudentPerformanceService


test_bp = Blueprint(
    "test",
    __name__,
    url_prefix="/api/tests"
)

student_test_bp = Blueprint(
    "student_test",
    __name__,
    url_prefix="/api/student/tests"
)


class SaveAttemptAnswerSchema(Schema):
    question_id = fields.Integer(required=True, validate=validate.Range(min=1))
    selected_option = fields.String(
        required=True,
        allow_none=True,
        validate=validate.OneOf(["A", "B", "C", "D", None]),
    )


# ============================================================
# SERIALIZERS
# ============================================================

def serialize_test(test):
    return {
        "id": test.id,
        "title": test.title,
        "description": test.description,
        "instructions": test.instructions,
        "test_type": test.test_type,
        "subject_id": test.subject_id,
        "topic_id": test.topic_id,
        "duration_minutes": test.duration_minutes,
        "total_questions": test.total_questions,
        "total_marks": str(test.total_marks),
        "is_active": test.is_active,
        "created_at": (
            test.created_at.isoformat()
            if test.created_at
            else None
        ),
        "updated_at": (
            test.updated_at.isoformat()
            if test.updated_at
            else None
        )
    }


def serialize_test_question(test_question):
    question = test_question.question

    return {
        "id": test_question.id,
        "test_id": test_question.test_id,
        "question_id": test_question.question_id,
        "question_order": test_question.question_order,
        "question": {
            "id": question.id,
            "subject_id": question.subject_id,
            "topic_id": question.topic_id,
            "exam_name": question.exam_name,
            "exam_year": question.exam_year,
            "question_text": question.question_text,
            "difficulty": question.difficulty,
            "marks": str(question.marks),
            "is_pyq": question.is_pyq,
            "options": [
                {
                    "id": option.id,
                    "option_label": option.option_label,
                    "option_text": option.option_text
                }
                for option in question.options
            ]
        }
    }


def serialize_attempt(attempt):
    return {
        "id": attempt.id,
        "test_id": attempt.test_id,
        "student_id": attempt.student_id,
        "started_at": (
            attempt.started_at.isoformat()
            if attempt.started_at
            else None
        ),
        "submitted_at": (
            attempt.submitted_at.isoformat()
            if attempt.submitted_at
            else None
        ),
        "score": str(attempt.score),
        "correct_answers": attempt.correct_answers,
        "wrong_answers": attempt.wrong_answers,
        "skipped_answers": attempt.skipped_answers,
        "percentage": str(attempt.percentage),
        "time_taken_seconds": attempt.time_taken_seconds,
        "accuracy": str(attempt.accuracy),
        "status": attempt.status
    }


def serialize_student_test(test):
    return {
        "id": test.id,
        "title": test.title,
        "description": test.description,
        "instructions": test.instructions,
        "test_type": test.test_type,
        "subject_id": test.subject_id,
        "subject": test.subject.name if test.subject else None,
        "topic_id": test.topic_id,
        "topic": test.topic.name if test.topic else None,
        "duration_minutes": test.duration_minutes,
        "question_count": test.total_questions,
        "total_questions": test.total_questions,
        "total_marks": str(test.total_marks),
        "is_active": test.is_active,
    }


def serialize_student_attempt(attempt):
    test = attempt.test
    started_at = attempt.started_at.replace(tzinfo=timezone.utc)
    expires_at = started_at + timedelta(minutes=test.duration_minutes)
    remaining_seconds = max(0, int((expires_at - datetime.now(timezone.utc)).total_seconds()))
    answers = {
        answer.question_id: answer.selected_option
        for answer in TestService.get_student_attempt_answers(attempt.id)
    }
    questions = []
    for test_question in TestService.get_test_questions(test.id):
        question = test_question.question
        if not question:
            continue
        questions.append({
            "question_id": question.id,
            "question_number": test_question.question_order,
            "question_text": question.question_text,
            "marks": str(question.marks),
            "selected_answer": answers.get(question.id),
            "options": [
                {"option_label": option.option_label, "option_text": option.option_text}
                for option in question.options
            ],
        })

    return {
        "attempt_id": attempt.id,
        "test_id": test.id,
        "test_title": test.title,
        "test_active": test.is_active,
        "status": attempt.status,
        "started_at": started_at.isoformat().replace("+00:00", "Z"),
        "expires_at": expires_at.isoformat().replace("+00:00", "Z"),
        "duration_minutes": test.duration_minutes,
        "remaining_seconds": remaining_seconds,
        "is_expired": remaining_seconds == 0,
        "question_count": len(questions),
        "questions": questions,
    }


def serialize_test_result(attempt, student_id):
    test_questions = TestService.get_test_questions(attempt.test_id)
    total_marks = sum(
        (
            max(Decimal("0"), Decimal(str(row.question.marks)))
            for row in test_questions if row.question
        ),
        start=Decimal("0"),
    )
    attempted_questions = attempt.correct_answers + attempt.wrong_answers
    result = {
        "attempt_id": attempt.id,
        "test_id": attempt.test_id,
        "test_title": attempt.test.title if attempt.test else "चाचणी",
        "status": attempt.status,
        "started_at": attempt.started_at.isoformat() if attempt.started_at else None,
        "submitted_at": attempt.submitted_at.isoformat() if attempt.submitted_at else None,
        "total_questions": len(test_questions),
        "attempted_questions": attempted_questions,
        "correct_answers": attempt.correct_answers,
        "wrong_answers": attempt.wrong_answers,
        "skipped_questions": max(0, len(test_questions) - attempted_questions),
        "total_marks": str(total_marks),
        "score": str(attempt.score),
        "percentage": str(attempt.percentage),
        "accuracy": str(attempt.accuracy),
        "time_taken_seconds": attempt.time_taken_seconds,
    }
    result.update(StudentPerformanceService.get_attempt_result_insights(attempt))
    if attempt.status == "submitted":
        result["question_review"] = TestService.get_submitted_attempt_question_review(
            attempt.id, student_id
        )
    return result


@student_test_bp.get("")
@role_required("student")
def get_student_tests():
    try:
        result = TestService.list_student_tests(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            test_type_value=request.args.get("test_type"),
            subject_id_value=request.args.get("subject_id"),
            topic_id_value=request.args.get("topic_id"),
        )
        return {
            "success": True,
            "message": "Tests fetched successfully.",
            "data": {
                "tests": [serialize_student_test(test) for test in result["tests"]],
                "pagination": result["pagination"],
            },
        }, 200
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400


@student_test_bp.get("/history")
@role_required("student")
def get_student_test_history():
    try:
        student_id = int(get_jwt_identity())
        result = TestService.list_student_test_history(
            student_id=student_id,
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            test_type_value=request.args.get("type"),
            subject_id_value=request.args.get("subject_id"),
            topic_id_value=request.args.get("topic_id"),
        )
        return {
            "success": True,
            "message": "Test history fetched successfully.",
            "data": result,
        }, 200
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400


@student_test_bp.get("/<int:test_id>")
@role_required("student")
def get_student_test(test_id):
    try:
        test = TestService.get_student_test(test_id)
        return {
            "success": True,
            "message": "Test fetched successfully.",
            "data": serialize_student_test(test),
        }, 200
    except ValueError as error:
        return {"success": False, "message": str(error)}, 404


# ============================================================
# ADMIN - CREATE TEST
# ============================================================

@test_bp.post("")
@role_required("admin")
def create_test():

    try:

        json_data = request.get_json()

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        data = CreateTestSchema().load(json_data)

        test = TestService.create_test(data)

        return {
            "success": True,
            "message": "Test created successfully.",
            "data": serialize_test(test)
        }, 201

    except ValidationError as error:

        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages
        }, 422

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 409


# ============================================================
# STUDENT / ADMIN - GET ALL TESTS
# ============================================================

@test_bp.get("")
@role_required("student", "admin")
def get_all_tests():

    tests = TestService.get_all_tests()

    return {
        "success": True,
        "message": "Tests fetched successfully.",
        "data": [
            serialize_student_test(test) if g.current_user.role == "student" else serialize_test(test)
            for test in tests
        ]
    }, 200


# ============================================================
# STUDENT / ADMIN - GET SINGLE TEST
# ============================================================

@test_bp.get("/<int:test_id>")
@role_required("student", "admin")
def get_test(test_id):

    try:

        if g.current_user.role == "student":
            test = TestService.get_student_test(test_id)
            serializer = serialize_student_test
        else:
            test = TestService.get_test(test_id)
            serializer = serialize_test

        return {
            "success": True,
            "message": "Test fetched successfully.",
            "data": serializer(test)
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404


# ============================================================
# ADMIN - ADD QUESTION TO TEST
# ============================================================

@test_bp.post("/<int:test_id>/questions")
@role_required("admin")
def add_question_to_test(test_id):

    try:

        json_data = request.get_json()

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        data = AddTestQuestionSchema().load(
            json_data
        )

        test_question = TestService.add_question(
            test_id=test_id,
            question_id=data["question_id"],
            question_order=data.get("question_order")
        )

        return {
            "success": True,
            "message": "Question added to test successfully.",
            "data": serialize_test_question(
                test_question
            )
        }, 201

    except ValidationError as error:

        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages
        }, 422

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 409


# ============================================================
# STUDENT / ADMIN - GET TEST QUESTIONS
# ============================================================

@test_bp.get("/<int:test_id>/questions")
@role_required("student", "admin")
def get_test_questions(test_id):

    try:

        if g.current_user.role == "student":
            TestService.get_student_test(test_id)

        questions = TestService.get_test_questions(
            test_id
        )

        return {
            "success": True,
            "message": "Test questions fetched successfully.",
            "data": [
                serialize_test_question(question)
                for question in questions
            ]
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404


# ============================================================
# STUDENT - START TEST
# ============================================================

@test_bp.post("/<int:test_id>/start")
@role_required("student")
def start_test(test_id):

    try:

        student_id = int(
            get_jwt_identity()
        )

        attempt = TestService.start_test(
            test_id=test_id,
            student_id=student_id
        )

        return {
            "success": True,
            "message": "Test started successfully.",
            "data": serialize_attempt(attempt)
        }, 201

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 409


@test_bp.get("/attempts/<int:attempt_id>")
@role_required("student")
def get_student_attempt(attempt_id):
    try:
        student_id = int(get_jwt_identity())
        attempt = TestService.get_student_attempt(attempt_id, student_id)
        return {
            "success": True,
            "message": "Test attempt fetched successfully.",
            "data": serialize_student_attempt(attempt),
        }, 200
    except ValueError as error:
        return {"success": False, "message": str(error)}, 404


@test_bp.patch("/attempts/<int:attempt_id>/answers")
@role_required("student")
def save_student_attempt_answer(attempt_id):
    try:
        data = SaveAttemptAnswerSchema().load(request.get_json() or {})
        student_id = int(get_jwt_identity())
        answer = TestService.save_student_attempt_answer(
            attempt_id=attempt_id,
            student_id=student_id,
            question_id=data["question_id"],
            selected_option=data["selected_option"],
        )
        return {
            "success": True,
            "message": "Answer saved successfully.",
            "data": {
                "question_id": data["question_id"],
                "selected_answer": answer.selected_option if answer else None,
            },
        }, 200
    except ValidationError as error:
        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages,
        }, 422
    except ValueError as error:
        message = str(error)
        status_code = 400 if "Question" in message or "option" in message else 409
        return {"success": False, "message": message}, status_code


# ============================================================
# STUDENT - SUBMIT TEST
# ============================================================

@test_bp.post("/attempts/<int:attempt_id>/submit")
@role_required("student")
def submit_test(attempt_id):

    try:
        student_id = int(
            get_jwt_identity()
        )

        attempt = TestService.submit_test(
            attempt_id=attempt_id,
            student_id=student_id
        )

        return {
            "success": True,
            "message": "Test submitted successfully.",
            "data": serialize_test_result(attempt, student_id)
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 409


# ============================================================
# STUDENT - GET RESULT
# ============================================================

@test_bp.get("/attempts/<int:attempt_id>/result")
@role_required("student")
def get_attempt_result(attempt_id):

    try:

        student_id = int(
            get_jwt_identity()
        )

        attempt = TestService.get_attempt_result(
            attempt_id=attempt_id,
            student_id=student_id
        )

        return {
            "success": True,
            "message": "Test result fetched successfully.",
            "data": serialize_test_result(attempt, student_id)
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 409 if "still in progress" in str(error).lower() else 404
