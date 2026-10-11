from flask import Blueprint, current_app, g

from app.middleware.rbac import role_required
from app.services.student_performance_service import (
    StudentPerformanceService
)


student_performance_bp = Blueprint(
    "student_performance",
    __name__,
    url_prefix="/api/student/performance"
)


def _response(message, data):
    return {
        "success": True,
        "message": message,
        "data": data
    }, 200


def _server_error(message):
    current_app.logger.exception(message)
    return {
        "success": False,
        "message": message
    }, 500


@student_performance_bp.get("")
@role_required("student")
def get_complete_performance():
    try:
        data = StudentPerformanceService.get_complete_performance(
            g.current_user.id
        )
        return _response("Student performance fetched successfully.", data)
    except Exception:
        return _server_error("Failed to fetch student performance.")


@student_performance_bp.get("/overview")
@role_required("student")
def get_overview():
    try:
        data = StudentPerformanceService.get_overview(g.current_user.id)
        return _response("Performance overview fetched successfully.", data)
    except Exception:
        return _server_error("Failed to fetch performance overview.")


@student_performance_bp.get("/subjects")
@role_required("student")
def get_subjects():
    try:
        data = StudentPerformanceService.get_subject_performance(
            g.current_user.id
        )
        return _response("Subject performance fetched successfully.", data)
    except Exception:
        return _server_error("Failed to fetch subject performance.")


@student_performance_bp.get("/topics")
@role_required("student")
def get_topics():
    try:
        data = StudentPerformanceService.get_topic_performance(
            g.current_user.id
        )
        return _response("Topic performance fetched successfully.", data)
    except Exception:
        return _server_error("Failed to fetch topic performance.")


@student_performance_bp.get("/strengths")
@role_required("student")
def get_strengths():
    try:
        data = StudentPerformanceService.get_strengths(g.current_user.id)
        return _response("Topic strengths fetched successfully.", data)
    except Exception:
        return _server_error("Failed to fetch topic strengths.")


@student_performance_bp.get("/progress")
@role_required("student")
def get_progress():
    try:
        data = StudentPerformanceService.get_progress(g.current_user.id)
        return _response("Performance progress fetched successfully.", data)
    except Exception:
        return _server_error("Failed to fetch performance progress.")


@student_performance_bp.get("/test-history")
@role_required("student")
def get_test_history():
    try:
        data = StudentPerformanceService.get_test_history(g.current_user.id)
        return _response("Test history fetched successfully.", data)
    except Exception:
        return _server_error("Failed to fetch test history.")


@student_performance_bp.get("/physical")
@role_required("student")
def get_physical_performance():
    try:
        data = StudentPerformanceService.get_physical_performance(
            g.current_user.id
        )
        return _response("Physical performance fetched successfully.", data)
    except Exception:
        return _server_error("Failed to fetch physical performance.")
