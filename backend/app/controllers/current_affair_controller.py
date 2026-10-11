from flask import Blueprint, current_app, request, send_file
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.schemas.current_affair_schema import (
    CreateCurrentAffairSchema,
    UpdateCurrentAffairSchema,
    UpdateCurrentAffairStatusSchema,
)
from app.services.current_affair_service import CurrentAffairService
from app.utils.current_affair_image_storage import resolve_current_affair_image_path
from app.utils.previous_year_pdf_storage import resolve_previous_year_pdf_path


current_affair_bp = Blueprint("current_affair", __name__, url_prefix="/api")


@current_affair_bp.get("/admin/current-affairs")
@role_required("admin")
def list_admin_current_affairs():
    try:
        data = CurrentAffairService.list_admin(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            category_value=request.args.get("category"),
            is_active_value=request.args.get("is_active"),
            published_date_value=request.args.get("published_date"),
            content_type_value=request.args.get("content_type"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    return {
        "success": True,
        "message": "Current affairs fetched successfully.",
        "data": data,
    }, 200


@current_affair_bp.post("/admin/current-affairs")
@role_required("admin")
def create_current_affair():
    try:
        data = CreateCurrentAffairSchema().load(request.get_json(silent=True) or {})
        current_affair = CurrentAffairService.create(data)
    except ValidationError as error:
        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages,
        }, 422
    except Exception:
        current_app.logger.exception("Failed to create current affair.")
        return {"success": False, "message": "Unable to create current affair."}, 500
    return {
        "success": True,
        "message": "Current affair created successfully.",
        "data": CurrentAffairService.serialize_admin(current_affair),
    }, 201


@current_affair_bp.post("/admin/current-affairs/media")
@role_required("admin")
def upload_current_affair_media():
    try:
        current_affair = CurrentAffairService.upload_media(
            request.files.get("file"), request.form.get("content_type"),
            upload_request_id=request.headers.get("X-Upload-Request-ID"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except Exception:
        current_app.logger.exception("Failed to upload Current Affairs media.")
        return {"success": False, "message": "Unable to upload current affair media."}, 500
    return {
        "success": True,
        "message": "Current affair media uploaded successfully.",
        "data": CurrentAffairService.serialize_admin(current_affair),
    }, 201


@current_affair_bp.get("/admin/current-affairs/<int:current_affair_id>")
@role_required("admin")
def get_admin_current_affair(current_affair_id):
    try:
        current_affair = CurrentAffairService.get_admin(current_affair_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    return {
        "success": True,
        "message": "Current affair fetched successfully.",
        "data": CurrentAffairService.serialize_admin(current_affair),
    }, 200


@current_affair_bp.patch("/admin/current-affairs/<int:current_affair_id>")
@role_required("admin")
def update_current_affair(current_affair_id):
    try:
        data = UpdateCurrentAffairSchema().load(request.get_json(silent=True) or {})
        current_affair = CurrentAffairService.update(current_affair_id, data)
    except ValidationError as error:
        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages,
        }, 422
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except Exception:
        current_app.logger.exception("Failed to update current affair.")
        return {"success": False, "message": "Unable to update current affair."}, 500
    return {
        "success": True,
        "message": "Current affair updated successfully.",
        "data": CurrentAffairService.serialize_admin(current_affair),
    }, 200


@current_affair_bp.put("/admin/current-affairs/<int:current_affair_id>/media")
@role_required("admin")
def replace_current_affair_media(current_affair_id):
    try:
        current_affair = CurrentAffairService.upload_media(
            request.files.get("file"), request.form.get("content_type"),
            current_affair_id=current_affair_id,
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except Exception:
        current_app.logger.exception("Failed to replace Current Affairs media.")
        return {"success": False, "message": "Unable to replace current affair media."}, 500
    return {
        "success": True,
        "message": "Current affair media replaced successfully.",
        "data": CurrentAffairService.serialize_admin(current_affair),
    }, 200


def _send_current_affair_media(current_affair, as_attachment=False):
    if not current_affair.media_storage_key or current_affair.content_type not in {"IMAGE", "PDF"}:
        return {"success": False, "message": "Current affair media not found."}, 404
    try:
        path = (
            resolve_current_affair_image_path(current_affair.media_storage_key)
            if current_affair.content_type == "IMAGE"
            else resolve_previous_year_pdf_path(current_affair.media_storage_key)
        )
    except ValueError:
        return {"success": False, "message": "Current affair media not found."}, 404
    if not path.is_file():
        return {"success": False, "message": "Current affair media not found."}, 404
    response = send_file(
        path,
        mimetype=current_affair.mime_type,
        as_attachment=as_attachment,
        download_name=current_affair.original_filename or current_affair.title,
        conditional=True,
    )
    response.headers["Cache-Control"] = "private, no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@current_affair_bp.get("/admin/current-affairs/<int:current_affair_id>/media")
@role_required("admin")
def get_admin_current_affair_media(current_affair_id):
    try:
        current_affair = CurrentAffairService.get_admin(current_affair_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    return _send_current_affair_media(current_affair)


@current_affair_bp.patch("/admin/current-affairs/<int:current_affair_id>/status")
@role_required("admin")
def update_current_affair_status(current_affair_id):
    try:
        data = UpdateCurrentAffairStatusSchema().load(
            request.get_json(silent=True) or {}
        )
        current_affair = CurrentAffairService.update_status(
            current_affair_id, data["is_active"]
        )
    except ValidationError as error:
        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages,
        }, 422
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except Exception:
        current_app.logger.exception("Failed to update current affair status.")
        return {"success": False, "message": "Unable to update current affair status."}, 500
    return {
        "success": True,
        "message": "Current affair status updated successfully.",
        "data": CurrentAffairService.serialize_admin(current_affair),
    }, 200


@current_affair_bp.delete("/admin/current-affairs/<int:current_affair_id>")
@role_required("admin")
def delete_current_affair(current_affair_id):
    try:
        CurrentAffairService.delete(current_affair_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except Exception:
        current_app.logger.exception("Failed to delete current affair.")
        return {"success": False, "message": "Unable to delete current affair."}, 500
    return {"success": True, "message": "Current affair deleted successfully."}, 200


@current_affair_bp.get("/student/current-affairs")
@role_required("student")
def list_student_current_affairs():
    try:
        data = CurrentAffairService.list_student(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            category_value=request.args.get("category"),
            published_date_value=(
                request.args.get("published_date") or request.args.get("date")
            ),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    return {
        "success": True,
        "message": "Current affairs fetched successfully.",
        "data": data,
    }, 200


@current_affair_bp.get("/student/current-affairs/<int:current_affair_id>")
@role_required("student")
def get_student_current_affair(current_affair_id):
    try:
        current_affair = CurrentAffairService.get_student(current_affair_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    return {
        "success": True,
        "message": "Current affair fetched successfully.",
        "data": CurrentAffairService.serialize_student(current_affair),
    }, 200


@current_affair_bp.get("/student/current-affairs/<int:current_affair_id>/media")
@role_required("student")
def get_student_current_affair_media(current_affair_id):
    try:
        current_affair = CurrentAffairService.get_student(current_affair_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    return _send_current_affair_media(current_affair)


@current_affair_bp.get("/student/current-affairs/<int:current_affair_id>/download")
@role_required("student")
def download_student_current_affair_pdf(current_affair_id):
    try:
        current_affair = CurrentAffairService.get_student(current_affair_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    if current_affair.content_type != "PDF":
        return {"success": False, "message": "Current affair PDF not found."}, 404
    return _send_current_affair_media(current_affair, as_attachment=True)
