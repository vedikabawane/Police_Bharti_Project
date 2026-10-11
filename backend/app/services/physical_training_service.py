from app.repositories.physical_training_repository import (
    PhysicalTrainingRepository
)


class PhysicalTrainingService:

    @staticmethod
    def create_record(user_id: int, data: dict):
        return PhysicalTrainingRepository.create(
            user_id=user_id,
            data=data
        )

    @staticmethod
    def get_student_records(user_id: int):
        return PhysicalTrainingRepository.get_student_records(user_id)

    @staticmethod
    def get_record(user_id: int, record_id: int):
        record = PhysicalTrainingRepository.get_by_id(record_id)

        if not record or record.user_id != user_id:
            raise ValueError("Physical training record not found.")

        return record

    @staticmethod
    def update_record(user_id: int, record_id: int, data: dict):
        record = PhysicalTrainingService.get_record(user_id, record_id)

        return PhysicalTrainingRepository.update(
            record=record,
            data=data
        )

    @staticmethod
    def delete_record(user_id: int, record_id: int):
        record = PhysicalTrainingService.get_record(user_id, record_id)
        PhysicalTrainingRepository.delete(record)

    @staticmethod
    def get_latest_record(user_id: int):
        return PhysicalTrainingRepository.get_latest_record(user_id)
