from flask import Blueprint, current_app, request, send_file
from marshmallow import ValidationError
from werkzeug.utils import secure_filename

from app.middleware.rbac import role_required
from app.schemas.recruitment_notice_schema import (
    CreateRecruitmentNoticeSchema,
    UpdateRecruitmentNoticeSchema,
    UpdateRecruitmentNoticeStatusSchema,
)
from app.services.recruitment_notice_service import RecruitmentNoticeService


recruitment_notice_bp = Blueprint("recruitment_notice", __name__, url_prefix="/api")


def _request_data():
    if request.form:
        return request.form.to_dict()
    return request.get_json(silent=True) or {}


@recruitment_notice_bp.get("/admin/recruitment-notices")
@role_required("admin")
def list_admin_recruitment_notices():
    try:
        data = RecruitmentNoticeService.list_admin(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            notice_type_value=request.args.get("notice_type"),
            recruitment_year_value=request.args.get("recruitment_year"),
            department_value=request.args.get("department"),
            is_active_value=request.args.get("is_active"),
            published_date_value=request.args.get("published_date"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    return {
        "success": True,
        "message": "Recruitment notices fetched successfully.",
        "data": data,
    }, 200


@recruitment_notice_bp.post("/admin/recruitment-notices")
@role_required("admin")
def create_recruitment_notice():
    try:
        data = CreateRecruitmentNoticeSchema().load(_request_data())
        uploaded_pdf = request.files.get("pdf")
        if uploaded_pdf is not None and not uploaded_pdf.filename:
            uploaded_pdf = None
        notice = RecruitmentNoticeService.create(data, uploaded_pdf)
    except ValidationError as error:
        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages,
        }, 422
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except Exception:
        current_app.logger.exception("Failed to create recruitment notice.")
        return {"success": False, "message": "Unable to create recruitment notice."}, 500
    return {
        "success": True,
        "message": "Recruitment notice created successfully.",
        "data": RecruitmentNoticeService.serialize_admin(notice),
    }, 201


@recruitment_notice_bp.get("/admin/recruitment-notices/<int:notice_id>")
@role_required("admin")
def get_admin_recruitment_notice(notice_id):
    try:
        notice = RecruitmentNoticeService.get_admin(notice_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    return {
        "success": True,
        "message": "Recruitment notice fetched successfully.",
        "data": RecruitmentNoticeService.serialize_admin(notice),
    }, 200


@recruitment_notice_bp.patch("/admin/recruitment-notices/<int:notice_id>")
@role_required("admin")
def update_recruitment_notice(notice_id):
    try:
        data = UpdateRecruitmentNoticeSchema().load(_request_data())
        uploaded_pdf = request.files.get("pdf")
        if uploaded_pdf is not None and not uploaded_pdf.filename:
            uploaded_pdf = None
        notice = RecruitmentNoticeService.update(notice_id, data, uploaded_pdf)
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
        current_app.logger.exception("Failed to update recruitment notice.")
        return {"success": False, "message": "Unable to update recruitment notice."}, 500
    return {
        "success": True,
        "message": "Recruitment notice updated successfully.",
        "data": RecruitmentNoticeService.serialize_admin(notice),
    }, 200


@recruitment_notice_bp.patch("/admin/recruitment-notices/<int:notice_id>/status")
@role_required("admin")
def update_recruitment_notice_status(notice_id):
    try:
        data = UpdateRecruitmentNoticeStatusSchema().load(
            request.get_json(silent=True) or {}
        )
        notice = RecruitmentNoticeService.update_status(notice_id, data["is_active"])
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
        current_app.logger.exception("Failed to update recruitment notice status.")
        return {"success": False, "message": "Unable to update recruitment notice status."}, 500
    return {
        "success": True,
        "message": "Recruitment notice status updated successfully.",
        "data": RecruitmentNoticeService.serialize_admin(notice),
    }, 200


@recruitment_notice_bp.delete("/admin/recruitment-notices/<int:notice_id>")
@role_required("admin")
def delete_recruitment_notice(notice_id):
    try:
        RecruitmentNoticeService.delete(notice_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except Exception:
        current_app.logger.exception("Failed to delete recruitment notice.")
        return {"success": False, "message": "Unable to delete recruitment notice."}, 500
    return {"success": True, "message": "Recruitment notice deleted successfully."}, 200


@recruitment_notice_bp.get("/student/recruitment-notices")
@role_required("student")
def list_student_recruitment_notices():
    try:
        data = RecruitmentNoticeService.list_student(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            notice_type_value=request.args.get("notice_type"),
            recruitment_year_value=request.args.get("recruitment_year"),
            department_value=request.args.get("department"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    return {
        "success": True,
        "message": "Recruitment notices fetched successfully.",
        "data": data,
    }, 200


@recruitment_notice_bp.get("/student/recruitment-notices/<int:notice_id>")
@role_required("student")
def get_student_recruitment_notice(notice_id):
    try:
        notice = RecruitmentNoticeService.get_student(notice_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    return {
        "success": True,
        "message": "Recruitment notice fetched successfully.",
        "data": RecruitmentNoticeService.serialize_student(notice),
    }, 200


@recruitment_notice_bp.get("/student/recruitment-notices/<int:notice_id>/file")
@role_required("student")
def view_student_recruitment_notice_pdf(notice_id):
    try:
        notice, path = RecruitmentNoticeService.get_active_file(notice_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except ValueError:
        return {"success": False, "message": "Recruitment notice PDF not found."}, 404
    download_name = secure_filename(notice.pdf_original_filename or "") or "recruitment-notice.pdf"
    return send_file(
        path,
        mimetype="application/pdf",
        as_attachment=False,
        download_name=download_name,
        conditional=True,
    )


@recruitment_notice_bp.get("/student/recruitment-notices/<int:notice_id>/download")
@role_required("student")
def download_student_recruitment_notice_pdf(notice_id):
    try:
        notice, path = RecruitmentNoticeService.get_active_file(notice_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except ValueError:
        return {"success": False, "message": "Recruitment notice PDF not found."}, 404
    download_name = secure_filename(notice.pdf_original_filename or "") or "recruitment-notice.pdf"
    return send_file(
        path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=download_name,
        conditional=True,
    )
