from app.repositories.student_profile_repository import (
    StudentProfileRepository
)


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