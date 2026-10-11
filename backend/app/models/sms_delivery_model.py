from datetime import datetime

from app.extensions import db


class SmsDelivery(db.Model):
    __tablename__ = "sms_deliveries"
    __table_args__ = (
        db.UniqueConstraint("user_id", "event_key", name="uq_sms_delivery_user_event"),
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
    event_key = db.Column(db.String(128), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="PROCESSING")
    attempt_count = db.Column(db.Integer, nullable=False, default=0)
    last_error_code = db.Column(db.String(40), nullable=True)
    accepted_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
    )

    def __repr__(self):
        return f"<SmsDelivery {self.id} user={self.user_id} status={self.status}>"
