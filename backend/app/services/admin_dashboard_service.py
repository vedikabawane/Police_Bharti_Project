from datetime import datetime, timedelta

from app.repositories.admin_dashboard_repository import (
    AdminDashboardRepository,
)


class AdminDashboardService:
    RECENT_LIMIT = 10
    RECENT_STUDENT_DAYS = 30

    @staticmethod
    def _isoformat(value):
        return value.isoformat() if value else None

    @staticmethod
    def _number(value):
        return float(value) if value is not None else None

    @classmethod
    def get_dashboard(cls, admin):
        now = datetime.utcnow()
        recent_since = now - timedelta(days=cls.RECENT_STUDENT_DAYS)
        counts = AdminDashboardRepository.get_counts(recent_since)
        recent_students = AdminDashboardRepository.get_recent_students(
            limit=cls.RECENT_LIMIT
        )
        recent_attempts = AdminDashboardRepository.get_recent_test_attempts(
            limit=cls.RECENT_LIMIT
        )

        return {
            "admin": {
                "id": admin.id,
                "name": admin.name,
                "email": admin.email,
                "role": admin.role,
            },
            "students": {
                "total": counts["students_total"],
                "active": counts["students_active"],
                "inactive": counts["students_inactive"],
                "recent_30_days": counts["students_recent"],
                "recent": [
                    {
                        "id": student.id,
                        "name": student.name,
                        "email": student.email,
                        "created_at": cls._isoformat(student.created_at),
                        "is_active": student.is_active,
                    }
                    for student in recent_students
                ],
            },
            "content": {
                "subjects": counts["subjects"],
                "topics": counts["topics"],
                "study_materials": counts["study_materials"],
                "notes": counts["notes"],
                "handwritten_notes": counts["handwritten_notes"],
                "videos": counts["videos"],
                "questions": counts["questions"],
                "pyq": counts["pyq"],
            },
            "tests": {
                "total": counts["tests_total"],
                "active": counts["tests_active"],
                "inactive": counts["tests_inactive"],
                "attempts": counts["attempts_total"],
                "completed_attempts": counts["attempts_completed"],
            },
            "physical": {
                "training_records": counts["physical_training_records"],
            },
            "ai": {
                "chat_sessions": counts["ai_chat_sessions"],
                "chat_messages": counts["ai_chat_messages"],
            },
            "recent_activity": {
                "students": [
                    {
                        "id": student.id,
                        "name": student.name,
                        "email": student.email,
                        "created_at": cls._isoformat(student.created_at),
                        "is_active": student.is_active,
                    }
                    for student in recent_students
                ],
                "test_attempts": [
                    {
                        "attempt_id": attempt.id,
                        "student_id": attempt.student_id,
                        "student_name": attempt.student_name,
                        "test_id": attempt.test_id,
                        "test_name": attempt.test_name,
                        "score": cls._number(attempt.score),
                        "percentage": cls._number(attempt.percentage),
                        "attempted_at": cls._isoformat(attempt.attempted_at),
                        "submitted_at": cls._isoformat(attempt.submitted_at),
                        "status": attempt.status,
                    }
                    for attempt in recent_attempts
                ],
            },
            "meta": {
                "recent_limit": cls.RECENT_LIMIT,
                "recent_student_window_days": cls.RECENT_STUDENT_DAYS,
            },
        }


__all__ = ["AdminDashboardService"]
