from uuid import UUID

from flask import Blueprint, current_app, g, request
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.schemas.ai_assistant_schema import AIChatRequestSchema
from app.services.ai_assistant_service import PoliceBhartiAssistantService


ai_assistant_bp = Blueprint(
    "ai_assistant",
    __name__,
    url_prefix="/api/student/ai"
)


def _server_error(message):
    current_app.logger.exception(message)
    return {
        "success": False,
        "message": message
    }, 500


def _session_id_from_query():
    raw_session_id = request.args.get("session_id")
    if raw_session_id is None:
        return None
    try:
        return UUID(raw_session_id)
    except (TypeError, ValueError):
        raise ValueError("A valid session_id is required.")


@ai_assistant_bp.post("/chat")
@role_required("student")
def chat():
    try:
        json_data = request.get_json(silent=True)
        if not isinstance(json_data, dict):
            return {
                "success": False,
                "message": "A valid JSON request body is required."
            }, 400

        data = AIChatRequestSchema().load(json_data)
        message = data["message"].strip()
        if not message:
            return {
                "success": False,
                "message": "Message must not be empty."
            }, 400

        result = PoliceBhartiAssistantService.chat(
            user_id=g.current_user.id,
            message=message,
            session_id=data.get("session_id")
        )
        return {
            "success": True,
            "message": "Assistant response generated successfully.",
            "data": result
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
        return _server_error("Failed to generate assistant response.")


@ai_assistant_bp.get("/history")
@role_required("student")
def get_history():
    try:
        session_id = _session_id_from_query()
    except ValueError as error:
        return {
            "success": False,
            "message": str(error)
        }, 400

    try:
        data = PoliceBhartiAssistantService.get_history(
            user_id=g.current_user.id,
            session_id=session_id
        )
        return {
            "success": True,
            "message": "Chat history fetched successfully.",
            "data": data
        }, 200
    except ValueError as error:
        return {
            "success": False,
            "message": str(error)
        }, 404
    except Exception:
        return _server_error("Failed to fetch chat history.")


@ai_assistant_bp.delete("/history")
@role_required("student")
def delete_history():
    try:
        session_id = _session_id_from_query()
    except ValueError as error:
        return {
            "success": False,
            "message": str(error)
        }, 400

    try:
        data = PoliceBhartiAssistantService.delete_history(
            user_id=g.current_user.id,
            session_id=session_id
        )
        return {
            "success": True,
            "message": "Chat history deleted successfully.",
            "data": data
        }, 200
    except ValueError as error:
        return {
            "success": False,
            "message": str(error)
        }, 404
    except Exception:
        return _server_error("Failed to delete chat history.")
