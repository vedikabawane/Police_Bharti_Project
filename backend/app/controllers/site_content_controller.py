from pathlib import Path

from flask import Blueprint, current_app, request, send_file
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.schemas.site_content_schema import AboutSchema, ContactSettingsSchema, ContactSubmissionSchema, ContactStatusSchema, ContactNotesSchema, TeamMemberSchema
from app.services.site_content_service import SiteContentService
from app.services.contact_rate_limit_service import ContactRateLimitService
from app.utils.team_member_photo_storage import get_team_member_photo_directory


site_content_bp = Blueprint("site_content", __name__, url_prefix="/api")


def _json(): return request.get_json(silent=True) or {}


def _validation(error): return {"success": False, "message": "Validation failed.", "errors": error.messages}, 422


@site_content_bp.get("/public/about")
def public_about():
    data = SiteContentService.get_about(public=True)
    if data is None: return {"success": False, "message": "About content is not available."}, 404
    return {"success": True, "data": data}, 200


@site_content_bp.get("/admin/about")
@role_required("admin")
def admin_about(): return {"success": True, "data": SiteContentService.get_about()}


@site_content_bp.post("/admin/about")
@site_content_bp.patch("/admin/about")
@role_required("admin")
def save_about():
    try: values = AboutSchema().load(_json())
    except ValidationError as error: return _validation(error)
    row = SiteContentService.save_about(values)
    return {"success": True, "message": "About content saved.", "data": SiteContentService.get_about()}, 200


@site_content_bp.patch("/admin/about/status")
@role_required("admin")
def about_status():
    try:
        active = _json()["is_active"]
        if not isinstance(active, bool): raise ValidationError({"is_active": ["Must be a boolean."]})
        row = SiteContentService.set_about_status(active)
    except ValidationError as error: return _validation(error)
    except LookupError as error: return {"success": False, "message": str(error)}, 404
    return {"success": True, "data": {"is_active": row.is_active}}, 200


@site_content_bp.get("/public/contact")
def public_contact():
    data = SiteContentService.get_contact_settings(public=True)
    if data is None: return {"success": False, "message": "Contact information is not available."}, 404
    return {"success": True, "data": data}, 200


@site_content_bp.get("/admin/contact-settings")
@role_required("admin")
def admin_contact_settings(): return {"success": True, "data": SiteContentService.get_contact_settings()}


@site_content_bp.post("/admin/contact-settings")
@site_content_bp.patch("/admin/contact-settings")
@role_required("admin")
def save_contact_settings():
    try: values = ContactSettingsSchema().load(_json())
    except ValidationError as error: return _validation(error)
    row = SiteContentService.save_contact_settings(values)
    return {"success": True, "message": "Contact settings saved.", "data": SiteContentService.get_contact_settings()}, 200


@site_content_bp.patch("/admin/contact-settings/status")
@role_required("admin")
def contact_settings_status():
    try:
        active = _json()["is_active"]
        if not isinstance(active, bool): raise ValidationError({"is_active": ["Must be a boolean."]})
        row = SiteContentService.set_contact_status(active)
    except ValidationError as error: return _validation(error)
    except LookupError as error: return {"success": False, "message": str(error)}, 404
    return {"success": True, "data": {"is_active": row.is_active}}, 200


@site_content_bp.post("/public/contact")
def submit_contact():
    if request.content_length and request.content_length > 12000:
        return {"success": False, "message": "Message is too large."}, 413
    try:
        allowed = ContactRateLimitService.record_attempt(request.remote_addr)
    except Exception:
        current_app.logger.exception("Contact form rate-limit storage failed.")
        return {"success": False, "message": "Contact form is temporarily unavailable."}, 503
    if not allowed:
        return {"success": False, "message": "Please try again in a little while."}, 429
    try: values = ContactSubmissionSchema().load(_json())
    except ValidationError as error: return _validation(error)
    try:
        SiteContentService.submit_contact(values)
    except Exception:
        current_app.logger.exception("Failed to store public contact message.")
        return {"success": False, "message": "Unable to submit your message right now."}, 500
    return {"success": True, "message": "Your message was sent successfully."}, 201


@site_content_bp.get("/admin/contact-messages")
@role_required("admin")
def list_contact_messages():
    status = request.args.get("status", "").strip().upper() or None
    try:
        data = SiteContentService.list_messages(request.args.get("search", ""), status, request.args.get("page", 1), request.args.get("per_page", 20))
    except ValueError as error: return {"success": False, "message": str(error)}, 400
    return {"success": True, "data": data}, 200


@site_content_bp.get("/admin/contact-messages/<int:message_id>")
@role_required("admin")
def get_contact_message(message_id):
    try: row = SiteContentService.get_message(message_id)
    except LookupError as error: return {"success": False, "message": str(error)}, 404
    return {"success": True, "data": SiteContentService.serialize_message(row)}, 200


@site_content_bp.patch("/admin/contact-messages/<int:message_id>/status")
@role_required("admin")
def update_contact_message_status(message_id):
    try:
        values = ContactStatusSchema().load(_json())
        row = SiteContentService.update_message_status(message_id, values["status"])
    except ValidationError as error: return _validation(error)
    except LookupError as error: return {"success": False, "message": str(error)}, 404
    return {"success": True, "data": SiteContentService.serialize_message(row)}, 200


@site_content_bp.patch("/admin/contact-messages/<int:message_id>/notes")
@role_required("admin")
def update_contact_message_notes(message_id):
    try:
        values = ContactNotesSchema().load(_json())
        row = SiteContentService.update_message_notes(message_id, values["admin_notes"])
    except ValidationError as error: return _validation(error)
    except LookupError as error: return {"success": False, "message": str(error)}, 404
    return {"success": True, "data": SiteContentService.serialize_message(row)}, 200


def _team_member_values():
    source = request.form if request.mimetype == "multipart/form-data" else _json()
    return TeamMemberSchema().load(source)


@site_content_bp.get("/admin/site-content/team-members")
@role_required("admin")
def list_team_members():
    active_filter = request.args.get("is_active")
    if active_filter not in (None, "", "true", "false"):
        return {"success": False, "message": "is_active must be true or false."}, 400
    try:
        data = SiteContentService.list_team_members(
            request.args.get("search", ""),
            None if active_filter in (None, "") else active_filter == "true",
            request.args.get("role", ""), request.args.get("page", 1), request.args.get("per_page", 20),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    return {"success": True, "data": data}, 200


@site_content_bp.post("/admin/site-content/team-members")
@role_required("admin")
def create_team_member():
    max_size = current_app.config.get("TEAM_MEMBER_PHOTO_MAX_FILE_SIZE", 5 * 1024 * 1024)
    if request.content_length and request.content_length > max_size + 64 * 1024:
        return {"success": False, "message": "Photo upload is too large."}, 413
    try:
        values = _team_member_values()
        missing = [key for key in ("name", "role") if key not in values]
        if missing:
            raise ValidationError({key: ["This field is required."] for key in missing})
        row = SiteContentService.save_team_member(values, request.files.get("photo"))
    except ValidationError as error:
        return _validation(error)
    except ValueError as error:
        return {"success": False, "message": str(error)}, 422
    except Exception:
        current_app.logger.exception("Failed to create website team member.")
        return {"success": False, "message": "Unable to save team member."}, 500
    return {"success": True, "data": SiteContentService.serialize_team_member(row)}, 201


@site_content_bp.get("/admin/site-content/team-members/<int:member_id>")
@role_required("admin")
def get_admin_team_member(member_id):
    try:
        row = SiteContentService.get_team_member(member_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    return {"success": True, "data": SiteContentService.serialize_team_member(row)}, 200


@site_content_bp.patch("/admin/site-content/team-members/<int:member_id>")
@role_required("admin")
def update_team_member(member_id):
    max_size = current_app.config.get("TEAM_MEMBER_PHOTO_MAX_FILE_SIZE", 5 * 1024 * 1024)
    if request.content_length and request.content_length > max_size + 64 * 1024:
        return {"success": False, "message": "Photo upload is too large."}, 413
    try:
        row = SiteContentService.get_team_member(member_id)
        values = _team_member_values()
        SiteContentService.save_team_member(values, request.files.get("photo"), row)
        row = SiteContentService.get_team_member(member_id)
    except ValidationError as error:
        return _validation(error)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    except ValueError as error:
        return {"success": False, "message": str(error)}, 422
    except Exception:
        current_app.logger.exception("Failed to update website team member.")
        return {"success": False, "message": "Unable to save team member."}, 500
    return {"success": True, "data": SiteContentService.serialize_team_member(row)}, 200


@site_content_bp.patch("/admin/site-content/team-members/<int:member_id>/status")
@role_required("admin")
def team_member_status(member_id):
    try:
        active = _json()["is_active"]
        if not isinstance(active, bool):
            raise ValidationError({"is_active": ["Must be a boolean."]})
        row = SiteContentService.set_team_member_status(member_id, active)
    except ValidationError as error:
        return _validation(error)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    return {"success": True, "data": {"id": row.id, "is_active": row.is_active}}, 200


@site_content_bp.delete("/admin/site-content/team-members/<int:member_id>")
@role_required("admin")
def delete_team_member(member_id):
    try:
        SiteContentService.delete_team_member(member_id)
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    return {"success": True, "message": "Team member deleted."}, 200


@site_content_bp.get("/public/contact/team-members")
def public_team_members():
    data = SiteContentService.list_team_members(page=1, per_page=100, public=True)
    return {"success": True, "data": data["items"]}, 200


@site_content_bp.get("/public/team-members/<int:member_id>/photo")
def public_team_member_photo(member_id):
    try:
        row = SiteContentService.get_team_member(member_id)
    except LookupError:
        return {"success": False, "message": "Photo not found."}, 404
    if not row.is_active or not row.photo_storage_key:
        return {"success": False, "message": "Photo not found."}, 404
    directory = get_team_member_photo_directory().resolve()
    photo_path = (directory / row.photo_storage_key).resolve()
    if photo_path.parent != directory or not photo_path.is_file():
        return {"success": False, "message": "Photo not found."}, 404
    return send_file(photo_path, mimetype=row.photo_mime_type, conditional=True, max_age=3600)
