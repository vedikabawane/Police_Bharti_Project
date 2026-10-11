from flask import current_app

from app.repositories.student_profile_repository import (
    StudentProfileRepository
)
from app.utils.profile_photo_storage import (
    delete_profile_photo,
    save_profile_photo,
)


class StudentProfileNotFoundError(LookupError):
    pass


class StudentProfileService:

    @staticmethod
    def get_profile(user_id: int):

        return StudentProfileRepository.find_by_user_id(
            user_id
        )

    @staticmethod
    def create_profile(user_id: int, data: dict):

        existing_profile = (
            StudentProfileRepository.find_by_user_id(user_id)
        )

        if existing_profile:
            raise ValueError(
                "Student profile already exists."
            )

        return StudentProfileRepository.create(
            user_id=user_id,
            data=data
        )

    @staticmethod
    def update_profile(user_id: int, data: dict):

        profile = StudentProfileRepository.find_by_user_id(
            user_id
        )

        if not profile:
            raise ValueError(
                "Student profile not found."
            )

        return StudentProfileRepository.update(
            profile=profile,
            data=data
        )

    @staticmethod
    def upload_profile_photo(user_id: int, uploaded_file):
        profile = StudentProfileRepository.find_by_user_id(user_id)
        if not profile:
            raise StudentProfileNotFoundError(
                "Student profile not found. Create your profile before uploading a photo."
            )

        profile_photo = save_profile_photo(uploaded_file, user_id)

        try:
            return StudentProfileRepository.update_profile_photo(
                profile=profile,
                profile_photo=profile_photo
            )
        except Exception:
            try:
                delete_profile_photo(profile_photo)
            except OSError:
                current_app.logger.exception(
                    "Failed to remove profile photo after database update failure."
                )
            raise