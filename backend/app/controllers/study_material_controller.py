from flask import Blueprint, current_app, request, send_file
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.schemas.study_material_schema import (
    CreateStudyMaterialSchema,
    UpdateStudyMaterialStatusSchema,
)
from app.services.study_material_service import StudyMaterialService


study_material_bp = Blueprint("study_material", __name__, url_prefix="/api")


@study_material_bp.post("/admin/study-materials")
@role_required("admin")
def create_study_material():
    try:
        data = CreateStudyMaterialSchema().load(request.form.to_dict())
        uploaded_file = request.files.get("file")
        if uploaded_file is None or not uploaded_file.filename:
            return {"success": False, "message": "A PDF file is required."}, 400
        material = StudyMaterialService.create(data, uploaded_file)
        return {
            "success": True,
            "message": "Study material uploaded successfully.",
            "data": StudyMaterialService.serialize_admin(material),
        }, 201
    except ValidationError as error:
        return {"success": False, "message": "Validation failed.", "errors": error.messages}, 422
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except Exception:
        current_app.logger.exception("Failed to create study material.")
        return {"success": False, "message": "Unable to save study material."}, 500


@study_material_bp.get("/admin/study-materials")
@role_required("admin")
def list_admin_study_materials():
    try:
        data = StudyMaterialService.list_admin(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            subject_id_value=request.args.get("subject_id"),
            topic_id_value=request.args.get("topic_id"),
            is_active_value=request.args.get("is_active"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    return {"success": True, "message": "Study materials fetched successfully.", "data": data}, 200


@study_material_bp.patch("/admin/study-materials/<int:material_id>/status")
@role_required("admin")
def update_study_material_status(material_id):
    try:
        data = UpdateStudyMaterialStatusSchema().load(request.get_json(silent=True) or {})
        material = StudyMaterialService.update_status(material_id, data["is_active"])
    except ValidationError as error:
        return {"success": False, "message": "Validation failed.", "errors": error.messages}, 422
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except Exception:
        current_app.logger.exception("Failed to update study material status.")
        return {"success": False, "message": "Unable to update study material status."}, 500
    return {
        "success": True,
        "message": "Study material status updated successfully.",
        "data": StudyMaterialService.serialize_admin(material),
    }, 200


@study_material_bp.delete("/admin/study-materials/<int:material_id>")
@role_required("admin")
def delete_study_material(material_id):
    try:
        StudyMaterialService.delete(material_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except Exception:
        current_app.logger.exception("Failed to delete study material.")
        return {"success": False, "message": "Unable to delete study material."}, 500
    return {"success": True, "message": "Study material deleted successfully."}, 200


@study_material_bp.get("/student/study-materials/topic/<int:topic_id>")
@role_required("student")
def list_student_study_materials(topic_id):
    try:
        materials = StudyMaterialService.list_active_for_topic(topic_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    return {
        "success": True,
        "message": "Study materials fetched successfully.",
        "data": [StudyMaterialService.serialize_student(item) for item in materials],
    }, 200


@study_material_bp.get("/student/study-materials/<int:material_id>/file")
@role_required("student")
def get_student_study_material_file(material_id):
    try:
        material, path = StudyMaterialService.get_active_file(material_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except ValueError:
        return {"success": False, "message": "Study material file not found."}, 404
    return send_file(
        path,
        mimetype="application/pdf",
        as_attachment=False,
        download_name=material.original_filename,
        conditional=True,
    )


@study_material_bp.get("/student/study-materials/<int:material_id>/download")
@role_required("student")
def download_student_study_material_file(material_id):
    try:
        material, path = StudyMaterialService.get_active_file(material_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except ValueError:
        return {"success": False, "message": "Study material file not found."}, 404
    return send_file(
        path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=material.original_filename,
        conditional=True,
    )
