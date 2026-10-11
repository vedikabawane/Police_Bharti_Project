import re

from flask import Blueprint, current_app, g, request
from flask_jwt_extended import get_jwt_identity

from app.extensions import db
from app.middleware.rbac import role_required
from app.services.notification_service import NotificationService


student_notification_bp = Blueprint(
    "student_notification",
    __name__,
    url_prefix="/api/student/notifications",
)

admin_notification_bp = Blueprint(
    "admin_notification",
    __name__,
    url_prefix="/api/admin/notifications",
)


@student_notification_bp.get("")
@role_required("student")
def list_student_notifications():
    try:
        data = NotificationService.list_notifications(
            user_id=int(get_jwt_identity()),
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            unread_only_value=request.args.get("unread_only"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except Exception:
        current_app.logger.exception("Failed to list student notifications.")
        return {"success": False, "message": "Unable to fetch notifications."}, 500
    return {
        "success": True,
        "message": "Notifications fetched successfully.",
        "data": data,
    }, 200


@student_notification_bp.get("/unread-count")
@role_required("student")
def get_student_notification_unread_count():
    count = NotificationService.unread_count(int(get_jwt_identity()))
    return {
        "success": True,
        "message": "Unread notification count fetched successfully.",
        "data": {"unread_count": count},
    }, 200


@student_notification_bp.patch("/<int:notification_id>/read")
@role_required("student")
def mark_student_notification_read(notification_id):
    user_id = int(get_jwt_identity())
    try:
        data = NotificationService.mark_read(user_id, notification_id)
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    except Exception:
        current_app.logger.exception("Failed to mark student notification read.")
        return {"success": False, "message": "Unable to update notification."}, 500
    if data is None:
        return {"success": False, "message": "Notification not found."}, 404
    return {
        "success": True,
        "message": "Notification marked as read.",
        "data": data,
    }, 200


@student_notification_bp.patch("/read-all")
@role_required("student")
def mark_all_student_notifications_read():
    try:
        data = NotificationService.mark_all_read(int(get_jwt_identity()))
    except Exception:
        current_app.logger.exception("Failed to mark student notifications read.")
        return {"success": False, "message": "Unable to update notifications."}, 500
    return {
        "success": True,
        "message": "All notifications marked as read.",
        "data": data,
    }, 200


@student_notification_bp.get("/preferences/sms")
@role_required("student")
def get_student_sms_preference():
    return {
        "success": True,
        "data": {"sms_enabled": bool(g.current_user.sms_notifications_enabled)},
    }, 200


@student_notification_bp.patch("/preferences/sms")
@role_required("student")
def update_student_sms_preference():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or set(payload) != {"sms_enabled"}:
        return {"success": False, "message": "Only sms_enabled is supported."}, 422
    enabled = payload.get("sms_enabled")
    if not isinstance(enabled, bool):
        return {"success": False, "message": "sms_enabled must be a boolean."}, 422
    g.current_user.sms_notifications_enabled = enabled
    db.session.commit()
    return {
        "success": True,
        "data": {"sms_enabled": enabled},
    }, 200


@admin_notification_bp.post("")
@role_required("admin")
def send_admin_notification():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return {"success": False, "message": "Request body is required."}, 400
    unknown_fields = set(payload) - {"title", "message", "recipient_type", "send_sms"}
    if unknown_fields:
        return {
            "success": False,
            "message": "Only title, message, recipient_type, and send_sms are supported.",
        }, 422
    send_sms = payload.get("send_sms", False)
    if not isinstance(send_sms, bool):
        return {"success": False, "message": "send_sms must be a boolean."}, 422
    idempotency_key = request.headers.get("Idempotency-Key", "")
    if send_sms and not re.fullmatch(r"[A-Za-z0-9_-]{16,80}", idempotency_key):
        return {
            "success": False,
            "message": "A valid Idempotency-Key header is required when SMS is selected.",
        }, 422
    try:
        data = NotificationService.send_admin_announcement(
            title=payload.get("title"),
            message=payload.get("message"),
            recipient_type=payload.get("recipient_type"),
            send_sms=send_sms,
            idempotency_key=idempotency_key if send_sms else None,
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 422
    except Exception:
        current_app.logger.exception(
            "Admin %s failed to send a notification.", g.current_user.id
        )
        return {"success": False, "message": "Unable to send notification."}, 500
    return {
        "success": True,
        "message": "Announcement sent successfully.",
        "data": data,
    }, 201
