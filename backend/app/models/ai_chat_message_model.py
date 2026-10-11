from datetime import datetime

from app.extensions import db


class AIChatMessage(db.Model):
    __tablename__ = "ai_chat_messages"
    __table_args__ = (
        db.CheckConstraint(
            "role IN ('user', 'assistant')",
            name="ck_ai_chat_message_role"
        ),
    )

    id = db.Column(
        db.BigInteger().with_variant(db.Integer, "sqlite"),
        primary_key=True,
        autoincrement=True
    )
    chat_session_id = db.Column(
        db.BigInteger,
        db.ForeignKey("ai_chat_sessions.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    role = db.Column(db.String(9), nullable=False)
    message = db.Column(db.Text, nullable=False)
    created_at = db.Column(
        db.DateTime,
        nullable=False,
        default=datetime.utcnow
    )

    session = db.relationship(
        "AIChatSession",
        back_populates="messages"
    )


__all__ = ["AIChatMessage"]
