from datetime import datetime

from app.extensions import db


class AIChatSession(db.Model):
    __tablename__ = "ai_chat_sessions"
    __table_args__ = (
        db.UniqueConstraint(
            "user_id",
            "session_id",
            name="uq_ai_chat_session_user_session"
        ),
    )

    id = db.Column(
        db.BigInteger().with_variant(db.Integer, "sqlite"),
        primary_key=True,
        autoincrement=True
    )
    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    session_id = db.Column(db.String(36), nullable=False, index=True)
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )
    updated_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    messages = db.relationship(
        "AIChatMessage",
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="AIChatMessage.created_at.asc()"
    )


__all__ = ["AIChatSession"]
