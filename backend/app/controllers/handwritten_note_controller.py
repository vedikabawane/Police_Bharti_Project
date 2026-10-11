from flask import Blueprint, request
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.schemas.handwritten_note_schema import (
    CreateHandwrittenNoteSchema,
    UpdateHandwrittenNoteSchema
)
from app.services.handwritten_note_service import (
    HandwrittenNoteService
)


handwritten_note_bp = Blueprint(
    "handwritten_note",
    __name__,
    url_prefix="/api/handwritten-notes"
)


@handwritten_note_bp.get("/topic/<int:topic_id>")
@role_required("student", "admin")
def get_notes(topic_id):

    try:

        notes = HandwrittenNoteService.get_by_topic(
            topic_id
        )

        data = []

        for note in notes:

            data.append({
                "id": note.id,
                "subject_id": note.subject_id,
                "topic_id": note.topic_id,
                "title": note.title,
                "file_url": note.file_url,
                "file_type": note.file_type,
                "description": note.description,
                "is_active": note.is_active
            })

        return {
            "success": True,
            "message": "Handwritten notes fetched successfully.",
            "data": data
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404


@handwritten_note_bp.post(
    "/subject/<int:subject_id>/topic/<int:topic_id>"
)
@role_required("admin")
def create_note(subject_id, topic_id):

    try:

        data = CreateHandwrittenNoteSchema().load(
            request.get_json()
        )

        note = HandwrittenNoteService.create(
            subject_id,
            topic_id,
            data
        )

        return {
            "success": True,
            "message": "Handwritten note created successfully.",
            "data": {
                "id": note.id,
                "title": note.title,
                "file_url": note.file_url
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


@handwritten_note_bp.patch("/<int:note_id>")
@role_required("admin")
def update_note(note_id):

    try:

        data = UpdateHandwrittenNoteSchema().load(
            request.get_json(),
            partial=True
        )

        note = HandwrittenNoteService.update(
            note_id,
            data
        )

        return {
            "success": True,
            "message": "Handwritten note updated successfully.",
            "data": {
                "id": note.id,
                "title": note.title,
                "file_url": note.file_url,
                "is_active": note.is_active
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


@handwritten_note_bp.delete("/<int:note_id>")
@role_required("admin")
def delete_note(note_id):

    try:

        HandwrittenNoteService.delete(note_id)

        return {
            "success": True,
            "message": "Handwritten note deleted successfully."
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404