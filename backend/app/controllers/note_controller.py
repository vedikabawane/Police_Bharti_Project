from flask import Blueprint, request
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.schemas.note_schema import (
    CreateNoteSchema,
    UpdateNoteSchema
)
from app.services.note_service import NoteService


note_bp = Blueprint(
    "note",
    __name__,
    url_prefix="/api/notes"
)


@note_bp.get("/topic/<int:topic_id>")
@role_required("student", "admin")
def get_notes(topic_id):

    try:

        notes = NoteService.get_notes_by_topic(
            topic_id
        )

        data = []

        for note in notes:

            data.append({
                "id": note.id,
                "subject_id": note.subject_id,
                "topic_id": note.topic_id,
                "title": note.title,
                "content": note.content,
                "is_active": note.is_active
            })

        return {
            "success": True,
            "message": "Notes fetched successfully.",
            "data": data
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404


@note_bp.post("/subject/<int:subject_id>/topic/<int:topic_id>")
@role_required("admin")
def create_note(subject_id, topic_id):

    try:

        json_data = request.get_json()

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        data = CreateNoteSchema().load(
            json_data
        )

        note = NoteService.create_note(
            subject_id,
            topic_id,
            data
        )

        return {
            "success": True,
            "message": "Note created successfully.",
            "data": {
                "id": note.id,
                "subject_id": note.subject_id,
                "topic_id": note.topic_id,
                "title": note.title
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


@note_bp.patch("/<int:note_id>")
@role_required("admin")
def update_note(note_id):

    try:

        data = UpdateNoteSchema().load(
            request.get_json(),
            partial=True
        )

        note = NoteService.update_note(
            note_id,
            data
        )

        return {
            "success": True,
            "message": "Note updated successfully.",
            "data": {
                "id": note.id,
                "title": note.title,
                "content": note.content,
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


@note_bp.delete("/<int:note_id>")
@role_required("admin")
def delete_note(note_id):

    try:

        NoteService.delete_note(note_id)

        return {
            "success": True,
            "message": "Note deleted successfully."
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404