from datetime import datetime

from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"
    __table_args__ = (
        db.Index("ix_notifications_user_created_at", "user_id", "created_at"),
    )

    id = db.Column(
        db.BigInteger().with_variant(db.Integer, "sqlite"),
        primary_key=True,
        autoincrement=True,
    )
    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.String(2000), nullable=False)
    notification_type = db.Column(db.String(30), nullable=False, default="SYSTEM")
    related_entity_type = db.Column(db.String(40), nullable=True)
    related_entity_id = db.Column(db.BigInteger, nullable=True)
    is_read = db.Column(db.Boolean, nullable=False, default=False, index=True)
    created_at = db.Column(
        db.DateTime, nullable=False, default=datetime.utcnow, index=True
    )
    read_at = db.Column(db.DateTime, nullable=True)

    user = db.relationship(
        "User",
        backref=db.backref("notifications", lazy=True),
    )

    def __repr__(self):
        return f"<Notification {self.id} user={self.user_id}>"
