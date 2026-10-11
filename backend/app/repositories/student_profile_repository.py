from app.extensions import db
from app.models.student_profile_model import StudentProfile


class StudentProfileRepository:

    @staticmethod
    def find_by_user_id(user_id: int):
        return StudentProfile.query.filter_by(
            user_id=user_id
        ).first()

    @staticmethod
    def create(user_id: int, data: dict):

        profile = StudentProfile(
            user_id=user_id,
            **data
        )

        db.session.add(profile)
        db.session.commit()

        return profile

    @staticmethod
    def update(profile, data: dict):

        for key, value in data.items():
            setattr(profile, key, value)

        db.session.commit()

        return profile

    @staticmethod
    def update_profile_photo(profile, profile_photo: str):
        profile.profile_photo = profile_photo

        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return profile