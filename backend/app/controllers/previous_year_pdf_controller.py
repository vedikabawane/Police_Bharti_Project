from flask import Blueprint, current_app, request, send_file
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.schemas.previous_year_pdf_schema import (
    CreatePreviousYearPDFSchema,
    UpdatePreviousYearPDFStatusSchema,
)
from app.services.previous_year_pdf_service import PreviousYearPDFService


previous_year_pdf_bp = Blueprint("previous_year_pdf", __name__, url_prefix="/api")


@previous_year_pdf_bp.post("/admin/previous-year-pdfs")
@role_required("admin")
def create_previous_year_pdf():
    try:
        data = CreatePreviousYearPDFSchema().load(request.form.to_dict())
        uploaded_file = request.files.get("pdf")
        if uploaded_file is None or not uploaded_file.filename:
            return {"success": False, "message": "A PDF file is required."}, 400
        pdf = PreviousYearPDFService.create(data, uploaded_file)
        return {
            "success": True,
            "message": "Previous Year PDF uploaded successfully.",
            "data": PreviousYearPDFService.serialize_admin(pdf),
        }, 201
    except ValidationError as error:
        return {"success": False, "message": "Validation failed.", "errors": error.messages}, 422
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except Exception:
        current_app.logger.exception("Failed to create Previous Year PDF.")
        return {"success": False, "message": "Unable to save Previous Year PDF."}, 500


@previous_year_pdf_bp.get("/admin/previous-year-pdfs")
@role_required("admin")
def list_admin_previous_year_pdfs():
    try:
        data = PreviousYearPDFService.list_admin(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            exam_name_value=request.args.get("exam_name"),
            exam_year_value=request.args.get("exam_year"),
            is_active_value=request.args.get("is_active"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    return {
        "success": True,
        "message": "Previous Year PDFs fetched successfully.",
        "data": data,
    }, 200


@previous_year_pdf_bp.patch("/admin/previous-year-pdfs/<int:pdf_id>/status")
@role_required("admin")
def update_previous_year_pdf_status(pdf_id):
    try:
        payload = UpdatePreviousYearPDFStatusSchema().load(request.get_json(silent=True) or {})
        pdf = PreviousYearPDFService.update_status(pdf_id, payload["is_active"])
    except ValidationError as error:
        return {"success": False, "message": "Validation failed.", "errors": error.messages}, 422
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except Exception:
        current_app.logger.exception("Failed to update Previous Year PDF status.")
        return {"success": False, "message": "Unable to update Previous Year PDF status."}, 500
    return {
        "success": True,
        "message": "Previous Year PDF status updated successfully.",
        "data": PreviousYearPDFService.serialize_admin(pdf),
    }, 200


@previous_year_pdf_bp.delete("/admin/previous-year-pdfs/<int:pdf_id>")
@role_required("admin")
def delete_previous_year_pdf(pdf_id):
    try:
        PreviousYearPDFService.delete(pdf_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except Exception:
        current_app.logger.exception("Failed to delete Previous Year PDF.")
        return {"success": False, "message": "Unable to delete Previous Year PDF."}, 500
    return {"success": True, "message": "Previous Year PDF deleted successfully."}, 200


@previous_year_pdf_bp.get("/student/previous-year-pdfs")
@role_required("student")
def list_student_previous_year_pdfs():
    try:
        data = PreviousYearPDFService.list_student(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            exam_name_value=request.args.get("exam_name"),
            exam_year_value=request.args.get("exam_year"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    return {
        "success": True,
        "message": "Previous Year PDFs fetched successfully.",
        "data": data,
    }, 200


@previous_year_pdf_bp.get("/student/previous-year-pdfs/<int:pdf_id>/file")
@role_required("student")
def get_student_previous_year_pdf_file(pdf_id):
    try:
        pdf, path = PreviousYearPDFService.get_active_file(pdf_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except ValueError:
        return {"success": False, "message": "Previous Year PDF file not found."}, 404
    return send_file(
        path,
        mimetype="application/pdf",
        as_attachment=False,
        download_name=pdf.original_filename,
        conditional=True,
    )


@previous_year_pdf_bp.get("/student/previous-year-pdfs/<int:pdf_id>/download")
@role_required("student")
def download_student_previous_year_pdf(pdf_id):
    try:
        pdf, path = PreviousYearPDFService.get_active_file(pdf_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except ValueError:
        return {"success": False, "message": "Previous Year PDF file not found."}, 404
    return send_file(
        path,
        mimetype="application/pdf",
        as_attachment=True,
        download_name=pdf.original_filename,
        conditional=True,
    )
