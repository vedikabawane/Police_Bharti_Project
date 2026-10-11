from datetime import datetime

from app.extensions import db
from app.models.notification_model import Notification
from app.models.user_model import User
from app.models.test_attempt_model import TestAttempt


class NotificationRepository:
    @staticmethod
    def test_ids_for_attempts(attempt_ids):
        if not attempt_ids:
            return {}
        rows = db.session.query(TestAttempt.id, TestAttempt.test_id).filter(
            TestAttempt.id.in_(set(attempt_ids))
        ).all()
        db.session.commit()
        return dict(rows)

    @staticmethod
    def list_active_student_emails(user_ids):
        if not user_ids:
            return {}
        recipients = db.session.query(User.id, User.email).filter(
            User.id.in_(set(user_ids)),
            User.role == "student",
            User.is_active.is_(True),
        ).all()
        # End the read transaction before opening SMTP connections.
        db.session.commit()
        return {user_id: email for user_id, email in recipients}

    @staticmethod
    def list_active_student_ids():
        return [row[0] for row in db.session.query(User.id).filter(
            User.role == "student",
            User.is_active.is_(True),
        ).order_by(User.id.asc()).all()]

    @staticmethod
    def find_active_student_ids(student_ids):
        if not student_ids:
            return []
        return [row[0] for row in db.session.query(User.id).filter(
            User.id.in_(student_ids),
            User.role == "student",
            User.is_active.is_(True),
        ).all()]

    @staticmethod
    def create_many(user_ids, title, message, notification_type,
                    related_entity_type=None, related_entity_id=None):
        notifications = [
            Notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                related_entity_type=related_entity_type,
                related_entity_id=related_entity_id,
            )
            for user_id in user_ids
        ]
        try:
            db.session.add_all(notifications)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return notifications

    @staticmethod
    def create_many_once(user_ids, title, message, notification_type,
                         related_entity_type, related_entity_id):
        """Create one notification per recipient and entity, even on retries."""
        if not user_ids:
            return []
        user_ids = sorted(set(user_ids))
        try:
            # Lock recipients in a stable order so concurrent dispatches for the
            # same entity serialize without requiring a schema change.
            active_ids = [row[0] for row in db.session.query(User.id).filter(
                User.id.in_(user_ids),
                User.role == "student",
                User.is_active.is_(True),
            ).order_by(User.id.asc()).with_for_update().all()]
            if not active_ids:
                db.session.commit()
                return []
            existing_ids = {row[0] for row in db.session.query(
                Notification.user_id
            ).filter(
                Notification.user_id.in_(active_ids),
                Notification.notification_type == notification_type,
                Notification.related_entity_type == related_entity_type,
                Notification.related_entity_id == related_entity_id,
            ).with_for_update().all()}
            notifications = [Notification(
                user_id=user_id,
                title=title,
                message=message,
                notification_type=notification_type,
                related_entity_type=related_entity_type,
                related_entity_id=related_entity_id,
            ) for user_id in active_ids if user_id not in existing_ids]
            if notifications:
                db.session.add_all(notifications)
            db.session.commit()
            return notifications
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def list_for_user(user_id, page, per_page, unread_only=False):
        query = Notification.query.filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read.is_(False))
        total = query.count()
        notifications = query.order_by(
            Notification.created_at.desc(), Notification.id.desc()
        ).offset((page - 1) * per_page).limit(per_page).all()
        return total, notifications

    @staticmethod
    def count_unread(user_id):
        return Notification.query.filter(
            Notification.user_id == user_id,
            Notification.is_read.is_(False),
        ).count()

    @staticmethod
    def mark_read(user_id, notification_id):
        notification = Notification.query.filter(
            Notification.id == notification_id,
            Notification.user_id == user_id,
        ).with_for_update().first()
        if not notification:
            return None
        if not notification.is_read:
            notification.is_read = True
            notification.read_at = datetime.utcnow()
            db.session.commit()
        return notification

    @staticmethod
    def mark_all_read(user_id):
        now = datetime.utcnow()
        try:
            updated = Notification.query.filter(
                Notification.user_id == user_id,
                Notification.is_read.is_(False),
            ).update(
                {Notification.is_read: True, Notification.read_at: now},
                synchronize_session=False,
            )
            db.session.commit()
            return updated
        except Exception:
            db.session.rollback()
            raise
