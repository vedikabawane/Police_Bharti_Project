from flask import Blueprint, current_app, request, g
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.schemas.student_profile_schema import StudentProfileSchema
from app.services.student_profile_service import (
    StudentProfileNotFoundError,
    StudentProfileService,
)


student_profile_bp = Blueprint(
    "student_profile",
    __name__,
    url_prefix="/api/student/profile"
)


@student_profile_bp.get("")
@role_required("student")
def get_profile():

    user_id = g.current_user.id

    profile = StudentProfileService.get_profile(
        user_id
    )

    if not profile:
        return {
            "success": False,
            "message": "Student profile not found."
        }, 404

    return {
        "success": True,
        "message": "Student profile fetched successfully.",
        "data": {
            "id": profile.id,
            "user_id": profile.user_id,
            "district": profile.district,
            "target_exam": profile.target_exam,
            "study_goal": profile.study_goal,
            "physical_goal": profile.physical_goal,
            "education": profile.education,
            "qualification": profile.qualification,
            "category": profile.category,
            "date_of_birth": (
                profile.date_of_birth.isoformat()
                if profile.date_of_birth
                else None
            ),
            "height": (
                str(profile.height)
                if profile.height is not None
                else None
            ),
            "chest": (
                str(profile.chest)
                if profile.chest is not None
                else None
            ),
            "weight": (
                str(profile.weight)
                if profile.weight is not None
                else None
            ),
            "profile_photo": profile.profile_photo
        }
    }, 200


@student_profile_bp.post("")
@role_required("student")
def create_profile():

    try:
        json_data = request.get_json()

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        schema = StudentProfileSchema()

        data = schema.load(json_data)

        user_id = g.current_user.id

        profile = StudentProfileService.create_profile(
            user_id=user_id,
            data=data
        )

        return {
            "success": True,
            "message": "Student profile created successfully.",
            "data": {
                "id": profile.id,
                "user_id": profile.user_id
            }
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

    except Exception as error:
        current_app.logger.exception("Failed to create student profile.")
        response = {
            "success": False,
            "message": "Failed to create student profile.",
        }
        if current_app.config.get("APP_ENV") != "production":
            response["error"] = str(error)
        return response, 500


@student_profile_bp.patch("")
@role_required("student")
def update_profile():

    try:
        json_data = request.get_json()

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        schema = StudentProfileSchema()

        data = schema.load(
            json_data,
            partial=True
        )

        user_id = g.current_user.id

        profile = StudentProfileService.update_profile(
            user_id=user_id,
            data=data
        )

        return {
            "success": True,
            "message": "Student profile updated successfully.",
            "data": {
                "id": profile.id,
                "user_id": profile.user_id
            }
        }, 200

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
        }, 404

    except Exception as error:
        current_app.logger.exception("Failed to update student profile.")
        response = {
            "success": False,
            "message": "Failed to update student profile.",
        }
        if current_app.config.get("APP_ENV") != "production":
            response["error"] = str(error)
        return response, 500


@student_profile_bp.post("/photo")
@role_required("student")
def upload_profile_photo():
    uploaded_file = request.files.get("photo")
    if uploaded_file is None or not uploaded_file.filename:
        return {
            "success": False,
            "message": "An image file is required in the 'photo' field."
        }, 400

    try:
        profile = StudentProfileService.upload_profile_photo(
            user_id=g.current_user.id,
            uploaded_file=uploaded_file
        )

        return {
            "success": True,
            "message": "Profile photo uploaded successfully.",
            "data": {
                "profile_photo": profile.profile_photo
            }
        }, 200

    except StudentProfileNotFoundError as error:
        return {
            "success": False,
            "message": str(error)
        }, 404
    except ValueError as error:
        return {
            "success": False,
            "message": str(error)
        }, 400
    except Exception:
        current_app.logger.exception("Failed to upload profile photo.")
        return {
            "success": False,
            "message": "Failed to upload profile photo."
        }, 500
