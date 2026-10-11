from app.extensions import db
from app.models.physical_training_model import PhysicalTraining


class PhysicalTrainingRepository:

    @staticmethod
    def create(user_id: int, data: dict):
        record = PhysicalTraining(
            user_id=user_id,
            **data
        )

        db.session.add(record)
        db.session.commit()

        return record

    @staticmethod
    def get_by_id(record_id: int):
        return db.session.get(PhysicalTraining, record_id)

    @staticmethod
    def get_student_records(user_id: int):
        return PhysicalTraining.query.filter_by(
            user_id=user_id
        ).order_by(
            PhysicalTraining.date.desc(),
            PhysicalTraining.id.desc()
        ).all()

    @staticmethod
    def update(record, data: dict):
        for key, value in data.items():
            setattr(record, key, value)

        db.session.commit()

        return record

    @staticmethod
    def delete(record):
        db.session.delete(record)
        db.session.commit()

    @staticmethod
    def get_latest_record(user_id: int):
        return PhysicalTraining.query.filter_by(
            user_id=user_id
        ).order_by(
            PhysicalTraining.date.desc(),
            PhysicalTraining.id.desc()
        ).first()
