from math import ceil

from app.repositories.admin_student_repository import AdminStudentRepository
from app.services.student_performance_service import StudentPerformanceService


class AdminStudentService:
    DEFAULT_PAGE = 1
    DEFAULT_PER_PAGE = 20
    MAX_PER_PAGE = 100

    @staticmethod
    def get_student(student_id: int):
        user = AdminStudentRepository.find_student_by_id(student_id)
        if user is None:
            return None
        return {"student": AdminStudentService._serialize_student(user)}

    @staticmethod
    def get_student_performance(student_id: int):
        student = AdminStudentRepository.find_student_by_id(student_id)
        if student is None:
            return None
        return StudentPerformanceService.get_complete_performance(student_id)

    @staticmethod
    def update_student_status(student_id: int, is_active):
        if type(is_active) is not bool:
            raise ValueError("is_active must be a boolean.")
        user = AdminStudentRepository.update_student_status(student_id, is_active)
        if user is None:
            return None
        return {"student": AdminStudentService._serialize_student(user)}

    @classmethod
    def list_students(cls, page_value=None, per_page_value=None, search_value=None):
        page = cls._positive_integer(page_value, "page", cls.DEFAULT_PAGE)
        per_page = cls._positive_integer(
            per_page_value, "per_page", cls.DEFAULT_PER_PAGE
        )
        if per_page > cls.MAX_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_PER_PAGE}.")

        search = (search_value or "").strip()
        total, records = AdminStudentRepository.list_students(
            search=search,
            page=page,
            per_page=per_page,
        )
        students = [cls._serialize_student(user) for user in records]
        return {
            "students": students,
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": ceil(total / per_page),
            },
        }

    @staticmethod
    def _positive_integer(value, field_name, default):
        if value is None or value == "":
            return default
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            raise ValueError(f"{field_name} must be a positive integer.")
        if parsed < 1:
            raise ValueError(f"{field_name} must be a positive integer.")
        return parsed

    @staticmethod
    def _serialize_student(user):
        profile = user.student_profile
        return {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "mobile": user.mobile,
            "role": user.role,
            "is_active": user.is_active,
            "email_verified": user.email_verified,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
            "profile": (
                {
                    "district": profile.district,
                    "target_exam": profile.target_exam,
                    "study_goal": profile.study_goal,
                    "physical_goal": profile.physical_goal,
                    "education": profile.education,
                    "qualification": profile.qualification,
                    "category": profile.category,
                    "date_of_birth": (
                        profile.date_of_birth.isoformat()
                        if profile.date_of_birth else None
                    ),
                    "height": str(profile.height) if profile.height is not None else None,
                    "chest": str(profile.chest) if profile.chest is not None else None,
                    "weight": str(profile.weight) if profile.weight is not None else None,
                    "profile_photo": profile.profile_photo,
                }
                if profile else None
            ),
        }
