from math import ceil
import logging
from flask import current_app

from app.repositories.notification_repository import NotificationRepository
from app.services.email_service import EmailService
from app.services.email_templates import safe_application_link
from app.services.sms_service import SmsService


logger = logging.getLogger(__name__)


class NotificationService:
    NOTIFICATION_TYPES = {
        "ANNOUNCEMENT", "TEST", "STUDY_MATERIAL", "VIDEO", "RESULT", "SYSTEM"
    }
    DEFAULT_PAGE = 1
    DEFAULT_PER_PAGE = 20
    MAX_PER_PAGE = 100

    @staticmethod
    def _positive_integer(value, field_name, default=None):
        if value is None or value == "":
            if default is not None:
                return default
            raise ValueError(f"{field_name} is required.")
        try:
            parsed = int(value)
        except (TypeError, ValueError) as error:
            raise ValueError(f"{field_name} must be a positive integer.") from error
        if parsed < 1:
            raise ValueError(f"{field_name} must be a positive integer.")
        return parsed

    @staticmethod
    def _unread_only(value):
        if value in (None, "", False, "false", "0", 0):
            return False
        if value in (True, "true", "1", 1):
            return True
        raise ValueError("unread_only must be true or false.")

    @classmethod
    def _content(cls, title, message, notification_type, related_entity_type,
                 related_entity_id):
        if not isinstance(title, str) or not title.strip():
            raise ValueError("title is required.")
        if len(title.strip()) > 200:
            raise ValueError("title must not exceed 200 characters.")
        if not isinstance(message, str) or not message.strip():
            raise ValueError("message is required.")
        if len(message.strip()) > 2000:
            raise ValueError("message must not exceed 2000 characters.")

        kind = str(notification_type or "SYSTEM").strip().upper()
        if kind not in cls.NOTIFICATION_TYPES:
            raise ValueError("notification_type is invalid.")

        entity_type = None
        if related_entity_type not in (None, ""):
            entity_type = str(related_entity_type).strip().upper()
            if entity_type not in {"TEST", "STUDY_MATERIAL", "VIDEO", "RESULT"}:
                raise ValueError("related_entity_type is invalid.")
        entity_id = None
        if related_entity_id not in (None, ""):
            entity_id = cls._positive_integer(related_entity_id, "related_entity_id")
            if not entity_type:
                raise ValueError("related_entity_type is required with related_entity_id.")
        return title.strip(), message.strip(), kind, entity_type, entity_id

    @staticmethod
    def serialize(notification):
        return {
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "notification_type": notification.notification_type,
            "related_entity_type": notification.related_entity_type,
            "related_entity_id": notification.related_entity_id,
            "is_read": notification.is_read,
            "created_at": notification.created_at.isoformat() if notification.created_at else None,
            "read_at": notification.read_at.isoformat() if notification.read_at else None,
        }

    @classmethod
    def list_notifications(cls, user_id, page_value=None, per_page_value=None,
                           unread_only_value=None):
        page = cls._positive_integer(page_value, "page", cls.DEFAULT_PAGE)
        per_page = cls._positive_integer(
            per_page_value, "per_page", cls.DEFAULT_PER_PAGE
        )
        if per_page > cls.MAX_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_PER_PAGE}.")
        unread_only = cls._unread_only(unread_only_value)
        total, notifications = NotificationRepository.list_for_user(
            user_id, page, per_page, unread_only
        )
        return {
            "notifications": [cls.serialize(row) for row in notifications],
            "unread_count": NotificationRepository.count_unread(user_id),
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": ceil(total / per_page) if total else 0,
            },
        }

    @staticmethod
    def unread_count(user_id):
        return NotificationRepository.count_unread(user_id)

    @classmethod
    def mark_read(cls, user_id, notification_id):
        notification_id = cls._positive_integer(notification_id, "notification_id")
        notification = NotificationRepository.mark_read(user_id, notification_id)
        if not notification:
            return None
        return {
            "notification": cls.serialize(notification),
            "unread_count": NotificationRepository.count_unread(user_id),
        }

    @staticmethod
    def mark_all_read(user_id):
        updated = NotificationRepository.mark_all_read(user_id)
        return {"updated_count": updated, "unread_count": 0}

    @classmethod
    def _create_for_students(cls, student_ids, title, message,
                             notification_type, related_entity_type=None,
                             related_entity_id=None):
        title, message, kind, entity_type, entity_id = cls._content(
            title, message, notification_type,
            related_entity_type, related_entity_id,
        )
        normalized_ids = []
        for student_id in student_ids:
            normalized_ids.append(cls._positive_integer(student_id, "student_id"))
        normalized_ids = list(dict.fromkeys(normalized_ids))
        valid_ids = set(NotificationRepository.find_active_student_ids(normalized_ids))
        invalid_ids = [student_id for student_id in normalized_ids if student_id not in valid_ids]
        if invalid_ids:
            raise ValueError("One or more recipient IDs are not active students.")
        rows = NotificationRepository.create_many_once(
            normalized_ids, title, message, kind, entity_type, entity_id
        )
        cls._send_emails_best_effort(rows)
        cls._send_sms_best_effort(rows)
        return rows

    @classmethod
    def _notification_link(cls, notification, test_ids_by_attempt=None):
        routes = {
            "TEST": f"/student/tests/{notification.related_entity_id}",
            "STUDY_MATERIAL": "/student/study",
            # Videos are accessed through student study topics in the current UI.
            "VIDEO": "/student/study",
        }
        if notification.notification_type == "RESULT":
            test_id = (test_ids_by_attempt or {}).get(
                notification.related_entity_id
            )
            if test_id:
                routes["RESULT"] = (
                    f"/student/tests/{test_id}/result/"
                    f"{notification.related_entity_id}"
                )
            else:
                routes["RESULT"] = "/student/tests/history"
        route = routes.get(notification.notification_type)
        if not route:
            return None
        return safe_application_link(
            current_app.config.get("FRONTEND_BASE_URL", ""),
            route,
        )

    @classmethod
    def _send_emails_best_effort(cls, notifications):
        if not notifications:
            return
        try:
            if not current_app.config.get("MAIL_ENABLED", False):
                return
            recipient_emails = NotificationRepository.list_active_student_emails(
                [row.user_id for row in notifications]
            )
            result_attempt_ids = {
                row.related_entity_id for row in notifications
                if row.notification_type == "RESULT" and row.related_entity_id
            }
            test_ids_by_attempt = NotificationRepository.test_ids_for_attempts(
                result_attempt_ids
            )
            for row in notifications:
                recipient = recipient_emails.get(row.user_id)
                if not recipient:
                    continue
                try:
                    EmailService.send_notification(
                        recipient=recipient,
                        notification_type=row.notification_type,
                        title=row.title,
                        message=row.message,
                        link=cls._notification_link(row, test_ids_by_attempt),
                    )
                except Exception:
                    # Keep both automatic business operations and announcement
                    # APIs successful when an email provider is unavailable.
                    logger.exception("Best-effort notification email dispatch failed.")
        except Exception:
            logger.exception("Unable to prepare best-effort notification emails.")

    @staticmethod
    def _send_sms_best_effort(notifications, event_key=None):
        if not notifications:
            return
        try:
            SmsService.dispatch_notifications(notifications, event_key=event_key)
        except Exception:
            # SMS availability must not change in-app or email notification behavior.
            logger.exception("Best-effort SMS notification dispatch failed.")

    @staticmethod
    def try_automatic_notification(notification_callable, **kwargs):
        """Keep notification failures from changing the business operation result."""
        try:
            return notification_callable(**kwargs)
        except Exception:
            logger.exception("Automatic notification dispatch failed.")
            return []

    @classmethod
    def send_admin_announcement(cls, title, message, recipient_type,
                                send_sms=False, idempotency_key=None):
        normalized_recipient_type = str(recipient_type or "").strip().upper()
        if normalized_recipient_type != "ALL_STUDENTS":
            raise ValueError("recipient_type must be ALL_STUDENTS.")
        if send_sms and (
            not isinstance(idempotency_key, str)
            or not idempotency_key
            or len(idempotency_key) > 80
        ):
            raise ValueError("idempotency_key is required when SMS is selected.")
        title, message, kind, entity_type, entity_id = cls._content(
            title, message, "ANNOUNCEMENT", None, None
        )
        student_ids = NotificationRepository.list_active_student_ids()
        notifications = NotificationRepository.create_many(
            student_ids, title, message, kind, entity_type, entity_id
        )
        cls._send_emails_best_effort(notifications)
        if send_sms:
            cls._send_sms_best_effort(
                notifications,
                event_key=f"admin-announcement:{idempotency_key}",
            )
        return {"recipient_count": len(notifications)}

    @classmethod
    def notify_students_about_test(cls, title, message, test_id, student_ids=None):
        recipients = student_ids if student_ids is not None else NotificationRepository.list_active_student_ids()
        return cls._create_for_students(
            recipients, title, message, "TEST", "TEST", test_id
        )

    @classmethod
    def notify_students_about_study_material(
        cls, title, message, material_id, student_ids=None
    ):
        recipients = student_ids if student_ids is not None else NotificationRepository.list_active_student_ids()
        return cls._create_for_students(
            recipients, title, message, "STUDY_MATERIAL", "STUDY_MATERIAL", material_id
        )

    @classmethod
    def notify_students_about_video(cls, title, message, video_id, student_ids=None):
        recipients = student_ids if student_ids is not None else NotificationRepository.list_active_student_ids()
        return cls._create_for_students(
            recipients, title, message, "VIDEO", "VIDEO", video_id
        )

    @classmethod
    def notify_student_about_result(cls, student_id, title, message, attempt_id):
        return cls._create_for_students(
            [student_id], title, message, "RESULT", "RESULT", attempt_id
        )
