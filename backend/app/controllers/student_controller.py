from flask import Blueprint, g

from app.middleware.rbac import role_required


student_bp = Blueprint(
    "student",
    __name__,
    url_prefix="/api/student"
)


@student_bp.get("/dashboard")
@role_required("student")
def dashboard():

    user = g.current_user

    return {
        "success": True,
        "message": "Student dashboard accessed successfully.",
        "data": {
            "user_id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role
        }
    }, 200