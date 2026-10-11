from flask import Blueprint, request
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.schemas.topic_schema import (
    CreateTopicSchema,
    UpdateTopicSchema
)
from app.services.topic_service import TopicService


topic_bp = Blueprint(
    "topic",
    __name__,
    url_prefix="/api/topics"
)


@topic_bp.get("/subject/<int:subject_id>")
@role_required("student", "admin")
def get_topics(subject_id):

    try:

        topics = TopicService.get_topics_by_subject(
            subject_id
        )

        data = []

        for topic in topics:

            data.append({
                "id": topic.id,
                "subject_id": topic.subject_id,
                "name": topic.name,
                "description": topic.description,
                "is_active": topic.is_active
            })

        return {
            "success": True,
            "message": "Topics fetched successfully.",
            "data": data
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404


@topic_bp.post("/subject/<int:subject_id>")
@role_required("admin")
def create_topic(subject_id):

    try:

        json_data = request.get_json()

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        schema = CreateTopicSchema()

        data = schema.load(json_data)

        topic = TopicService.create_topic(
            subject_id,
            data
        )

        return {
            "success": True,
            "message": "Topic created successfully.",
            "data": {
                "id": topic.id,
                "subject_id": topic.subject_id,
                "name": topic.name,
                "description": topic.description
            }
        }, 201

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
        }, 409


@topic_bp.patch("/<int:topic_id>")
@role_required("admin")
def update_topic(topic_id):

    try:

        json_data = request.get_json()

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        schema = UpdateTopicSchema()

        data = schema.load(
            json_data,
            partial=True
        )

        topic = TopicService.update_topic(
            topic_id,
            data
        )

        return {
            "success": True,
            "message": "Topic updated successfully.",
            "data": {
                "id": topic.id,
                "subject_id": topic.subject_id,
                "name": topic.name,
                "description": topic.description,
                "is_active": topic.is_active
            }
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


@topic_bp.delete("/<int:topic_id>")
@role_required("admin")
def delete_topic(topic_id):

    try:

        result = TopicService.delete_topic(topic_id)

        return {
            "success": True,
            "message": (
                "Topic deactivated because it has dependent content."
                if result["archived"] else "Topic deleted successfully."
            ),
            "data": result,
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404
