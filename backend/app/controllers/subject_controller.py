from flask import Blueprint, request
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.schemas.subject_schema import (
    CreateSubjectSchema,
    UpdateSubjectSchema
)
from app.services.subject_service import SubjectService


subject_bp = Blueprint(
    "subject",
    __name__,
    url_prefix="/api/subjects"
)


@subject_bp.get("")
@role_required("student", "admin")
def get_subjects():

    subjects = SubjectService.get_all_subjects()

    data = []

    for subject in subjects:

        data.append({
            "id": subject.id,
            "name": subject.name,
            "description": subject.description,
            "is_active": subject.is_active
        })

    return {
        "success": True,
        "message": "Subjects fetched successfully.",
        "data": data
    }, 200


@subject_bp.post("")
@role_required("admin")
def create_subject():

    try:

        json_data = request.get_json()

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        schema = CreateSubjectSchema()

        data = schema.load(json_data)

        subject = SubjectService.create_subject(data)

        return {
            "success": True,
            "message": "Subject created successfully.",
            "data": {
                "id": subject.id,
                "name": subject.name,
                "description": subject.description
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


@subject_bp.patch("/<int:subject_id>")
@role_required("admin")
def update_subject(subject_id):

    try:

        json_data = request.get_json()

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        schema = UpdateSubjectSchema()

        data = schema.load(
            json_data,
            partial=True
        )

        subject = SubjectService.update_subject(
            subject_id,
            data
        )

        return {
            "success": True,
            "message": "Subject updated successfully.",
            "data": {
                "id": subject.id,
                "name": subject.name,
                "description": subject.description,
                "is_active": subject.is_active
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


@subject_bp.delete("/<int:subject_id>")
@role_required("admin")
def delete_subject(subject_id):

    try:

        result = SubjectService.delete_subject(subject_id)

        return {
            "success": True,
            "message": (
                "Subject deactivated because it has dependent content."
                if result["archived"] else "Subject deleted successfully."
            ),
            "data": result,
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404
