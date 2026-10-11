from flask import Blueprint, g, request, send_file
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.schemas.video_schema import (
    CreateVideoSchema,
    UpdateVideoSchema,
    UpdateVideoStatusSchema,
)
from app.services.video_service import VideoService
from app.utils.video_storage import VideoFileValidationError, get_video_max_size_bytes


video_bp = Blueprint(
    "video",
    __name__,
    url_prefix="/api/videos"
)

admin_video_bp = Blueprint("admin_video", __name__, url_prefix="/api/admin/videos")


def _video_payload_and_file():
    if request.mimetype == "multipart/form-data":
        max_size = get_video_max_size_bytes()
        if request.content_length and request.content_length > max_size + 1024 * 1024:
            return None, None, ("The uploaded video exceeds the configured size limit.", 413)
        return request.form.to_dict(), request.files.get("video_file"), None
    payload = request.get_json(silent=True)
    return (payload if isinstance(payload, dict) else {}), None, None


def _validate_video_source(payload, uploaded_file, partial=False):
    video_url = payload.get("video_url")
    has_url = isinstance(video_url, str) and bool(video_url.strip())
    has_file = uploaded_file is not None and bool(uploaded_file.filename)
    if has_url and has_file:
        return "Provide either a video URL or an uploaded video file, not both."
    if partial and "video_url" in payload and not has_url:
        return "A valid HTTP or HTTPS video URL is required."
    if not partial and not has_url and not has_file:
        return "A video URL or uploaded video file is required."
    return None


def _send_video_file(video_id, active_only):
    try:
        path, mime_type, original_filename = VideoService.get_file(
            video_id, active_only=active_only
        )
    except LookupError:
        return {"success": False, "message": "Video file not found."}, 404
    except OSError:
        return {"success": False, "message": "Unable to read the video file."}, 500
    response = send_file(
        path,
        mimetype=mime_type,
        as_attachment=False,
        download_name=original_filename,
        conditional=True,
        max_age=0,
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    return response


@video_bp.get("/topic/<int:topic_id>")
@role_required("student", "admin")
def get_videos(topic_id):

    try:

        videos = VideoService.get_by_topic(
            topic_id,
            active_only=g.current_user.role == "student",
        )

        data = []

        for video in videos:

            data.append({
                "id": video.id,
                "subject_id": video.subject_id,
                "topic_id": video.topic_id,
                "title": video.title,
                "video_url": video.video_url,
                "source_type": video.source_type or "URL",
                "description": video.description,
                "duration": video.duration,
                "is_active": video.is_active
            })

        return {
            "success": True,
            "message": "Videos fetched successfully.",
            "data": data
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404


@admin_video_bp.get("")
@role_required("admin")
def list_admin_videos():
    try:
        data = VideoService.list_admin(
            page_value=request.args.get("page"),
            per_page_value=request.args.get("per_page"),
            search_value=request.args.get("search"),
            subject_id_value=request.args.get("subject_id"),
            topic_id_value=request.args.get("topic_id"),
            is_active_value=request.args.get("is_active"),
        )
    except ValueError as error:
        return {"success": False, "message": str(error)}, 400
    return {
        "success": True,
        "message": "Videos fetched successfully.",
        "data": data,
    }, 200


@video_bp.get("/<int:video_id>/file")
@role_required("student")
def get_student_video_file(video_id):
    return _send_video_file(video_id, active_only=True)


@admin_video_bp.get("/<int:video_id>/file")
@role_required("admin")
def get_admin_video_file(video_id):
    return _send_video_file(video_id, active_only=False)


@admin_video_bp.post("")
@role_required("admin")
def create_admin_video():
    try:
        payload, uploaded_file, request_error = _video_payload_and_file()
        if request_error:
            return {"success": False, "message": request_error[0]}, request_error[1]
        source_error = _validate_video_source(payload, uploaded_file)
        if source_error:
            error_field = "video_file" if uploaded_file else "video_url"
            return {
                "success": False,
                "message": source_error,
                "errors": {error_field: [source_error]},
            }, 422
        data = CreateVideoSchema().load(payload)
        subject_id = data.pop("subject_id")
        topic_id = data.pop("topic_id")
        video = VideoService.create(subject_id, topic_id, data, uploaded_file)
    except ValidationError as error:
        return {"success": False, "message": "Validation failed.", "errors": error.messages}, 422
    except VideoFileValidationError as error:
        return {"success": False, "message": str(error)}, 422
    except ValueError as error:
        return {"success": False, "message": str(error)}, 404
    except OSError:
        return {"success": False, "message": "Unable to store the uploaded video."}, 500
    return {
        "success": True,
        "message": "Video created successfully.",
        "data": VideoService.serialize_admin(video),
    }, 201


@admin_video_bp.patch("/<int:video_id>")
@role_required("admin")
def update_admin_video(video_id):
    try:
        payload, uploaded_file, request_error = _video_payload_and_file()
        if request_error:
            return {"success": False, "message": request_error[0]}, request_error[1]
        source_error = _validate_video_source(payload, uploaded_file, partial=True)
        if source_error:
            error_field = "video_file" if uploaded_file else "video_url"
            return {
                "success": False,
                "message": source_error,
                "errors": {error_field: [source_error]},
            }, 422
        data = UpdateVideoSchema().load(payload, partial=True)
        video = VideoService.update(video_id, data, uploaded_file)
    except ValidationError as error:
        return {"success": False, "message": "Validation failed.", "errors": error.messages}, 422
    except VideoFileValidationError as error:
        return {"success": False, "message": str(error)}, 422
    except ValueError as error:
        return {"success": False, "message": str(error)}, 404
    except OSError:
        return {"success": False, "message": "Unable to store the uploaded video."}, 500
    return {
        "success": True,
        "message": "Video updated successfully.",
        "data": VideoService.serialize_admin(video),
    }, 200


@admin_video_bp.patch("/<int:video_id>/status")
@role_required("admin")
def update_admin_video_status(video_id):
    try:
        data = UpdateVideoStatusSchema().load(request.get_json(silent=True) or {})
        video = VideoService.update_status(video_id, data["is_active"])
    except ValidationError as error:
        return {"success": False, "message": "Validation failed.", "errors": error.messages}, 422
    except LookupError as error:
        return {"success": False, "message": str(error)}, 404
    return {
        "success": True,
        "message": "Video status updated successfully.",
        "data": VideoService.serialize_admin(video),
    }, 200


@admin_video_bp.delete("/<int:video_id>")
@role_required("admin")
def delete_admin_video(video_id):
    try:
        VideoService.delete(video_id)
    except ValueError as error:
        return {"success": False, "message": str(error)}, 404
    return {"success": True, "message": "Video deleted successfully."}, 200


@video_bp.post(
    "/subject/<int:subject_id>/topic/<int:topic_id>"
)
@role_required("admin")
def create_video(subject_id, topic_id):

    try:

        payload = request.get_json(silent=True) or {}
        payload = dict(payload)
        payload["subject_id"] = subject_id
        payload["topic_id"] = topic_id
        data = CreateVideoSchema().load(payload)
        data.pop("subject_id")
        data.pop("topic_id")

        video = VideoService.create(
            subject_id,
            topic_id,
            data
        )

        return {
            "success": True,
            "message": "Video created successfully.",
            "data": {
                "id": video.id,
                "title": video.title,
                "video_url": video.video_url
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


@video_bp.patch("/<int:video_id>")
@role_required("admin")
def update_video(video_id):

    try:

        payload, uploaded_file, request_error = _video_payload_and_file()
        if request_error:
            return {"success": False, "message": request_error[0]}, request_error[1]
        source_error = _validate_video_source(payload, uploaded_file, partial=True)
        if source_error:
            error_field = "video_file" if uploaded_file else "video_url"
            return {
                "success": False,
                "message": source_error,
                "errors": {error_field: [source_error]},
            }, 422
        data = UpdateVideoSchema().load(payload, partial=True)

        video = VideoService.update(
            video_id,
            data,
            uploaded_file,
        )

        return {
            "success": True,
            "message": "Video updated successfully.",
            "data": {
                "id": video.id,
                "title": video.title,
                "video_url": video.video_url,
                "is_active": video.is_active
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

    except OSError:
        return {"success": False, "message": "Unable to store the uploaded video."}, 500


@video_bp.delete("/<int:video_id>")
@role_required("admin")
def delete_video(video_id):

    try:

        VideoService.delete(video_id)

        return {
            "success": True,
            "message": "Video deleted successfully."
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404
