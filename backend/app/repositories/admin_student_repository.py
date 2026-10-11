from sqlalchemy import or_
from sqlalchemy.orm import contains_eager

from app.extensions import db
from app.models import User


class AdminStudentRepository:
    @staticmethod
    def find_student_by_id(student_id: int):
        return db.session.query(User).outerjoin(
            User.student_profile,
        ).options(contains_eager(User.student_profile)).filter(
            User.id == student_id,
            User.role == "student",
        ).first()

    @staticmethod
    def update_student_status(student_id: int, is_active: bool):
        student = AdminStudentRepository.find_student_by_id(student_id)
        if student is None:
            return None

        student.is_active = is_active
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return student

    @staticmethod
    def list_students(search: str, page: int, per_page: int):
        query = db.session.query(User).outerjoin(
            User.student_profile,
        ).options(contains_eager(User.student_profile)).filter(
            User.role == "student"
        )

        if search:
            pattern = f"%{search}%"
            query = query.filter(
                or_(
                    User.name.ilike(pattern),
                    User.email.ilike(pattern),
                    User.mobile.ilike(pattern),
                )
            )

        total = query.order_by(None).count()
        records = query.order_by(
            User.created_at.desc(),
            User.id.desc(),
        ).offset((page - 1) * per_page).limit(per_page).all()
        return total, records
