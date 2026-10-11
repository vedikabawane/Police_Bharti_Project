from datetime import datetime

from app.extensions import db


class StudentProfile(db.Model):
    __tablename__ = "student_profiles"

    id = db.Column(
        db.BigInteger,
        primary_key=True,
        autoincrement=True
    )

    user_id = db.Column(
        db.BigInteger,
        db.ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )

    district = db.Column(
        db.String(100),
        nullable=True
    )

    target_exam = db.Column(
        db.String(150),
        nullable=True
    )

    study_goal = db.Column(
        db.Text,
        nullable=True
    )

    physical_goal = db.Column(
        db.Text,
        nullable=True
    )

    education = db.Column(
        db.String(150),
        nullable=True
    )

    qualification = db.Column(
        db.String(150),
        nullable=True
    )

    category = db.Column(
        db.String(50),
        nullable=True
    )

    date_of_birth = db.Column(
        db.Date,
        nullable=True
    )

    height = db.Column(
        db.Numeric(5, 2),
        nullable=True
    )

    chest = db.Column(
        db.Numeric(5, 2),
        nullable=True
    )

    weight = db.Column(
        db.Numeric(5, 2),
        nullable=True
    )

    profile_photo = db.Column(
        db.String(500),
        nullable=True
    )

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

    user = db.relationship(
        "User",
        backref=db.backref(
            "student_profile",
            uselist=False
        )
    )

    def __repr__(self):
        return f"<StudentProfile user_id={self.user_id}>"