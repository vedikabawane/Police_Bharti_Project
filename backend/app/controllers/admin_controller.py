from flask import Blueprint, current_app, g, request
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.services.admin_dashboard_service import AdminDashboardService
from app.services.admin_student_service import AdminStudentService
from app.services.subject_service import SubjectService
from app.services.topic_service import TopicService
from app.services.note_service import NoteService
from app.services.question_service import QuestionService
from app.services.test_service import TestService
from app.schemas.test_schema import (
    CreateAdminTestSchema,
    UpdateAdminTestSchema,
    TestStatusSchema,
)
from app.controllers.question_controller import serialize_question


admin_bp = Blueprint(
    "admin",
    __name__,
    url_prefix="/api/admin"
)


def serialize_admin_test(test, include_questions=False):
    data = {
        "id": test.id,
        "title": test.title,
        "description": test.description,
        "instructions": test.instructions,
        "test_type": test.test_type,
        "subject_id": test.subject_id,
        "subject": (
            {"id": test.subject.id, "name": test.subject.name}
            if test.subject else None
        ),
        "topic_id": test.topic_id,
        "topic": (
            {"id": test.topic.id, "name": test.topic.name}
            if test.topic else None
        ),
        "duration_minutes": test.duration_minutes,
        "question_count": test.total_questions,
        "total_questions": test.total_questions,
        "total_marks": str(test.total_marks),
        "is_active": test.is_active,
        "created_at": test.created_at.isoformat() if test.created_at else None,
        "updated_at": test.updated_at.isoformat() if test.updated_at else None,
    }
    if include_questions:
        data["questions"] = [
            {
                "question_order": row.question_order,
                "question_id": row.question_id,
                "is_admin_created": row.is_admin_created,
                "question": serialize_question(
                    row.question, include_admin_metadata=True
                ),
            }
            for row in sorted(test.questions, key=lambda item: item.question_order)
            if row.question is not None
        ]
        data["question_count"] = len(data["questions"])
        data["total_questions"] = len(data["questions"])
    return data


@admin_bp.get("/tests")
@role_required("admin")
def list_tests():
    try:
        result = TestService.list_admin_tests(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search") or request.args.get("title"),
            test_type_value=request.args.get("test_type"),
            subject_id_value=request.args.get("subject_id"),
            topic_id_value=request.args.get("topic_id"),
            is_active_value=request.args.get("is_active"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400

    result["tests"] = [serialize_admin_test(test) for test in result["tests"]]
    return {
        "success": True,
        "message": "Tests fetched successfully.",
        "data": result,
    }, 200


@admin_bp.post("/tests")
@role_required("admin")
def create_admin_test():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return {"success": False, "message": "Request body is required."}, 400
    try:
        data = CreateAdminTestSchema().load(payload)
        test = TestService.create_admin_test(data)
    except ValidationError as error:
        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages,
        }, 422
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except Exception:
        current_app.logger.exception("Failed to create admin test.")
        return {"success": False, "message": "Unable to create test."}, 500
    return {
        "success": True,
        "message": "Test created successfully.",
        "data": serialize_admin_test(test, include_questions=True),
    }, 201


@admin_bp.get("/tests/<int:test_id>")
@role_required("admin")
def get_admin_test(test_id):
    try:
        test = TestService.get_admin_test(test_id)
    except ValueError as error:
        return {"success": False, "message": str(error)}, 404
    return {
        "success": True,
        "message": "Test fetched successfully.",
        "data": serialize_admin_test(test, include_questions=True),
    }, 200


@admin_bp.get("/tests/<int:test_id>/analytics")
@role_required("admin")
def get_admin_test_analytics(test_id):
    try:
        data = TestService.get_admin_test_analytics(test_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except Exception:
        current_app.logger.exception("Failed to fetch admin test analytics.")
        return {"success": False, "message": "Unable to fetch test analytics."}, 500
    return {
        "success": True,
        "message": "Test analytics fetched successfully.",
        "data": data,
    }, 200


@admin_bp.patch("/tests/<int:test_id>")
@role_required("admin")
def update_admin_test(test_id):
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return {"success": False, "message": "Request body is required."}, 400
    try:
        data = UpdateAdminTestSchema().load(payload, partial=True)
        test = TestService.update_admin_test(test_id, data)
    except ValidationError as error:
        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages,
        }, 422
    except ValueError as error:
        status = 404 if str(error) == "Test not found." else 409
        return {"success": False, "message": str(error)}, status
    except Exception:
        current_app.logger.exception("Failed to update admin test.")
        return {"success": False, "message": "Unable to update test."}, 500
    return {
        "success": True,
        "message": "Test updated successfully.",
        "data": serialize_admin_test(test, include_questions=True),
    }, 200


@admin_bp.patch("/tests/<int:test_id>/status")
@role_required("admin")
def update_admin_test_status(test_id):
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return {"success": False, "message": "Request body is required."}, 400
    try:
        data = TestStatusSchema().load(payload)
        test = TestService.update_admin_test_status(test_id, data["is_active"])
    except ValidationError as error:
        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages,
        }, 422
    except ValueError as error:
        status = 404 if str(error) == "Test not found." else 400
        return {"success": False, "message": str(error)}, status
    except Exception:
        current_app.logger.exception("Failed to update admin test status.")
        return {"success": False, "message": "Unable to update test status."}, 500
    return {
        "success": True,
        "message": "Test status updated successfully.",
        "data": serialize_admin_test(test),
    }, 200


@admin_bp.delete("/tests/<int:test_id>")
@role_required("admin")
def delete_admin_test(test_id):
    try:
        result = TestService.delete_admin_test(test_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except Exception:
        current_app.logger.exception("Failed to remove admin test.")
        return {"success": False, "message": "Unable to remove test."}, 500
    return {
        "success": True,
        "message": (
            "Test deactivated to preserve student history."
            if result["archived"] else "Test deleted successfully."
        ),
        "data": result,
    }, 200


@admin_bp.get("/test-attempts")
@role_required("admin")
def list_admin_test_attempts():
    try:
        data = TestService.list_admin_test_attempts(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            test_id_value=request.args.get("test_id"),
            student_id_value=request.args.get("student_id"),
            status_value=request.args.get("status"),
            test_type_value=request.args.get("test_type"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except Exception:
        current_app.logger.exception("Failed to list admin test attempts.")
        return {"success": False, "message": "Unable to fetch test attempts."}, 500

    return {
        "success": True,
        "message": "Test attempts fetched successfully.",
        "data": data,
    }, 200


@admin_bp.get("/test-attempts/<int:attempt_id>")
@role_required("admin")
def get_admin_test_attempt(attempt_id):
    try:
        data = TestService.get_admin_test_attempt_detail(attempt_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except Exception:
        current_app.logger.exception("Failed to fetch admin test attempt detail.")
        return {"success": False, "message": "Unable to fetch test attempt."}, 500

    return {
        "success": True,
        "message": "Test attempt fetched successfully.",
        "data": data,
    }, 200


@admin_bp.get("/dashboard")
@role_required("admin")
def dashboard():
    return {
        "success": True,
        "message": "Admin dashboard fetched successfully.",
        "data": AdminDashboardService.get_dashboard(g.current_user)
    }, 200


@admin_bp.get("/subjects")
@role_required("admin")
def list_subjects():
    try:
        data = SubjectService.get_admin_subjects(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            is_active_value=request.args.get("is_active"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400

    return {
        "success": True,
        "message": "Subjects fetched successfully.",
        "data": data,
    }, 200


@admin_bp.get("/topics")
@role_required("admin")
def list_topics():
    try:
        data = TopicService.get_admin_topics(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            subject_id_value=request.args.get("subject_id"),
            is_active_value=request.args.get("is_active"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    return {"success": True, "message": "Topics fetched successfully.", "data": data}, 200


@admin_bp.get("/notes")
@role_required("admin")
def list_notes():
    try:
        data = NoteService.get_admin_notes(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            subject_id_value=request.args.get("subject_id"),
            topic_id_value=request.args.get("topic_id"),
            is_active_value=request.args.get("is_active"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    return {"success": True, "message": "Notes fetched successfully.", "data": data}, 200


@admin_bp.get("/questions")
@role_required("admin")
def list_questions():
    try:
        data = QuestionService.get_admin_questions(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            subject_id_value=request.args.get("subject_id"),
            topic_id_value=request.args.get("topic_id"),
            exam_name_value=request.args.get("exam_name"),
            exam_year_value=request.args.get("exam_year"),
            is_pyq_value=request.args.get("is_pyq"),
            difficulty_value=request.args.get("difficulty"),
            is_active_value=request.args.get("is_active"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400

    data["questions"] = [
        serialize_question(question, include_admin_metadata=True)
        for question in data["questions"]
    ]

    return {
        "success": True,
        "message": "Questions fetched successfully.",
        "data": data,
    }, 200


@admin_bp.get("/students")
@role_required("admin")
def list_students():
    try:
        data = AdminStudentService.list_students(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400

    return {
        "success": True,
        "message": "Students fetched successfully.",
        "data": data,
    }, 200


@admin_bp.get("/students/<int:student_id>")
@role_required("admin")
def get_student(student_id):
    data = AdminStudentService.get_student(student_id)
    if data is None:
        return {"success": False, "message": "Student not found."}, 404

    return {
        "success": True,
        "message": "Student fetched successfully.",
        "data": data,
    }, 200


@admin_bp.get("/students/<int:student_id>/performance")
@role_required("admin")
def get_student_performance(student_id):
    try:
        data = AdminStudentService.get_student_performance(student_id)
    except Exception:
        current_app.logger.exception("Failed to fetch student performance.")
        return {
            "success": False,
            "message": "Failed to fetch student performance."
        }, 500

    if data is None:
        return {"success": False, "message": "Student not found."}, 404

    return {
        "success": True,
        "message": "Student performance fetched successfully.",
        "data": data,
    }, 200


@admin_bp.patch("/students/<int:student_id>/status")
@role_required("admin")
def update_student_status(student_id):
    payload = request.get_json(silent=True)
    is_active = payload.get("is_active") if isinstance(payload, dict) else None
    try:
        data = AdminStudentService.update_student_status(student_id, is_active)
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except Exception:
        current_app.logger.exception("Failed to update student status.")
        return {"success": False, "message": "Unable to update student status."}, 500

    if data is None:
        return {"success": False, "message": "Student not found."}, 404

    return {
        "success": True,
        "message": "Student status updated successfully.",
        "data": data,
    }, 200
