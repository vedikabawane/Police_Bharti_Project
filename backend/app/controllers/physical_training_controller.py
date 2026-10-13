from flask import Blueprint, current_app, g, request
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.schemas.physical_training_schema import PhysicalTrainingSchema
from app.services.physical_training_service import (
    PhysicalTrainingService
)


physical_training_bp = Blueprint(
    "physical_training",
    __name__,
    url_prefix="/api/student/physical-training"
)


def serialize_record(record):
    return {
        "id": record.id,
        "user_id": record.user_id,
        "date": record.date.isoformat(),
        "running": str(record.running) if record.running is not None else None,
        "run_100m": str(record.run_100m) if record.run_100m is not None else None,
        "run_1600m": str(record.run_1600m) if record.run_1600m is not None else None,
        "run_800m": str(record.run_800m) if record.run_800m is not None else None,
        "shot_put": str(record.shot_put) if record.shot_put is not None else None,
        "push_ups": record.push_ups,
        "running_distance": (
            str(record.running_distance)
            if record.running_distance is not None
            else None
        ),
        "running_time": (
            str(record.running_time)
            if record.running_time is not None
            else None
        ),
        "weight": str(record.weight) if record.weight is not None else None,
        "created_at": record.created_at.isoformat() if record.created_at else None,
        "updated_at": record.updated_at.isoformat() if record.updated_at else None
    }


def _server_error(message):
    current_app.logger.exception(message)
    return {
        "success": False,
        "message": message
    }, 500


@physical_training_bp.post("")
@role_required("student")
def create_record():
    try:
        json_data = request.get_json(silent=True)

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        data = PhysicalTrainingSchema().load(json_data)
        record = PhysicalTrainingService.create_record(
            user_id=g.current_user.id,
            data=data
        )

        return {
            "success": True,
            "message": "Physical training record created successfully.",
            "data": serialize_record(record)
        }, 201

    except ValidationError as error:
        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages
        }, 422
    except Exception:
        return _server_error("Failed to create physical training record.")


@physical_training_bp.get("")
@role_required("student")
def get_student_records():
    try:
        records = PhysicalTrainingService.get_student_records(
            g.current_user.id
        )

        return {
            "success": True,
            "message": "Physical training records fetched successfully.",
            "data": [serialize_record(record) for record in records]
        }, 200

    except Exception:
        return _server_error("Failed to fetch physical training records.")


@physical_training_bp.get("/latest")
@role_required("student")
def get_latest_record():
    try:
        record = PhysicalTrainingService.get_latest_record(
            g.current_user.id
        )

        if not record:
            return {
                "success": False,
                "message": "Physical training record not found."
            }, 404

        return {
            "success": True,
            "message": "Latest physical training record fetched successfully.",
            "data": serialize_record(record)
        }, 200

    except Exception:
        return _server_error("Failed to fetch latest physical training record.")


@physical_training_bp.get("/<int:record_id>")
@role_required("student")
def get_record(record_id):
    try:
        record = PhysicalTrainingService.get_record(
            user_id=g.current_user.id,
            record_id=record_id
        )

        return {
            "success": True,
            "message": "Physical training record fetched successfully.",
            "data": serialize_record(record)
        }, 200

    except ValueError as error:
        return {
            "success": False,
            "message": str(error)
        }, 404
    except Exception:
        return _server_error("Failed to fetch physical training record.")


@physical_training_bp.patch("/<int:record_id>")
@role_required("student")
def update_record(record_id):
    try:
        json_data = request.get_json(silent=True)

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        data = PhysicalTrainingSchema().load(
            json_data,
            partial=True
        )
        if not data:
            return {
                "success": False,
                "message": "At least one field is required."
            }, 400

        record = PhysicalTrainingService.update_record(
            user_id=g.current_user.id,
            record_id=record_id,
            data=data
        )

        return {
            "success": True,
            "message": "Physical training record updated successfully.",
            "data": serialize_record(record)
        }, 200

    except ValidationError as error:
        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages
        }, 422
    except ValueError as error:
        return {
            "success": False,
            "message": str(error)
        }, 404
    except Exception:
        return _server_error("Failed to update physical training record.")


@physical_training_bp.delete("/<int:record_id>")
@role_required("student")
def delete_record(record_id):
    try:
        PhysicalTrainingService.delete_record(
            user_id=g.current_user.id,
            record_id=record_id
        )

        return {
            "success": True,
            "message": "Physical training record deleted successfully.",
            "data": {
                "id": record_id
            }
        }, 200

    except ValueError as error:
        return {
            "success": False,
            "message": str(error)
        }, 404
    except Exception:
        return _server_error("Failed to delete physical training record.")
