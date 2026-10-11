from math import ceil
import logging
from urllib.parse import urlsplit

from app.repositories.subject_repository import SubjectRepository
from app.repositories.topic_repository import TopicRepository
from app.repositories.video_repository import VideoRepository
from app.services.notification_service import NotificationService
from app.utils.video_storage import (
    delete_video_file,
    resolve_video_path,
    save_video_file,
)


logger = logging.getLogger(__name__)


class VideoService:

    DEFAULT_PAGE = 1
    DEFAULT_PER_PAGE = 20
    MAX_PER_PAGE = 100

    @classmethod
    def list_admin(
        cls,
        page_value=None,
        per_page_value=None,
        search_value=None,
        subject_id_value=None,
        topic_id_value=None,
        is_active_value=None,
    ):
        page = cls._positive_integer(page_value, "page", cls.DEFAULT_PAGE)
        per_page = cls._positive_integer(
            per_page_value, "per_page", cls.DEFAULT_PER_PAGE
        )
        if per_page > cls.MAX_PER_PAGE:
            raise ValueError(f"per_page must not exceed {cls.MAX_PER_PAGE}.")

        subject_id = cls._optional_positive_integer(subject_id_value, "subject_id")
        topic_id = cls._optional_positive_integer(topic_id_value, "topic_id")
        is_active = cls._boolean_filter(is_active_value)
        total, videos = VideoRepository.get_admin_videos(
            search=(search_value or "").strip(),
            subject_id=subject_id,
            topic_id=topic_id,
            is_active=is_active,
            page=page,
            per_page=per_page,
        )
        return {
            "videos": [cls.serialize_admin(video) for video in videos],
            "pagination": {
                "page": page,
                "per_page": per_page,
                "total": total,
                "pages": ceil(total / per_page),
            },
        }

    @staticmethod
    def _positive_integer(value, field_name, default):
        if value is None or value == "":
            return default
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            raise ValueError(f"{field_name} must be a positive integer.")
        if parsed < 1:
            raise ValueError(f"{field_name} must be a positive integer.")
        return parsed

    @classmethod
    def _optional_positive_integer(cls, value, field_name):
        if value is None or value == "":
            return None
        return cls._positive_integer(value, field_name, None)

    @staticmethod
    def _boolean_filter(value):
        if value is None:
            return None
        normalized = value.strip().lower()
        if normalized == "true":
            return True
        if normalized == "false":
            return False
        raise ValueError("is_active must be 'true' or 'false'.")

    @staticmethod
    def get_by_topic(topic_id: int, active_only=False):

        topic = TopicRepository.find_by_id(topic_id)

        if not topic:
            raise ValueError("Topic not found.")

        return VideoRepository.get_by_topic_id(
            topic_id,
            active_only=active_only,
        )

    @classmethod
    def create(cls, subject_id: int, topic_id: int, data: dict, video_file=None):

        subject = SubjectRepository.find_by_id(
            subject_id
        )

        if not subject:
            raise ValueError("Subject not found.")

        topic = TopicRepository.find_by_id(
            topic_id
        )

        if not topic:
            raise ValueError("Topic not found.")

        if topic.subject_id != subject_id:
            raise ValueError(
                "Topic does not belong to this subject."
            )

        video_url = data.get("video_url")
        if video_file and video_url:
            raise ValueError("Provide either a video URL or an uploaded video file, not both.")
        if not video_file and not video_url:
            raise ValueError("A video URL or uploaded video file is required.")

        create_data = dict(data)
        stored_file = None
        if video_file:
            stored_file = save_video_file(video_file)
            create_data.update({
                "video_url": None,
                "source_type": "UPLOAD",
                "storage_key": stored_file.storage_key,
                "original_filename": stored_file.original_filename,
                "mime_type": stored_file.mime_type,
                "file_size_bytes": stored_file.file_size_bytes,
            })
        else:
            cls._validate_external_url(video_url)
            create_data.update({
                "source_type": "URL",
                "storage_key": None,
                "original_filename": None,
                "mime_type": None,
                "file_size_bytes": None,
            })

        try:
            video = VideoRepository.create(subject_id, topic_id, create_data)
        except Exception:
            if stored_file:
                cls._cleanup_video_file(stored_file.storage_key)
            raise
        if video.is_active:
            NotificationService.try_automatic_notification(
                NotificationService.notify_students_about_video,
                title="नवीन व्हिडिओ उपलब्ध",
                message=f"नवीन अभ्यास व्हिडिओ उपलब्ध आहे: {video.title}",
                video_id=video.id,
            )
        return video

    @classmethod
    def update(cls, video_id: int, data: dict, video_file=None):

        video = VideoRepository.find_by_id(
            video_id
        )

        if not video:
            raise ValueError("Video not found.")

        update_data = dict(data)
        old_storage_key = video.storage_key
        stored_file = None
        if video_file and update_data.get("video_url"):
            raise ValueError("Provide either a video URL or an uploaded video file, not both.")
        if video_file:
            stored_file = save_video_file(video_file)
            update_data.update({
                "video_url": None,
                "source_type": "UPLOAD",
                "storage_key": stored_file.storage_key,
                "original_filename": stored_file.original_filename,
                "mime_type": stored_file.mime_type,
                "file_size_bytes": stored_file.file_size_bytes,
            })
        elif "video_url" in update_data:
            if not update_data["video_url"]:
                raise ValueError("A valid video URL is required.")
            cls._validate_external_url(update_data["video_url"])
            update_data.update({
                "source_type": "URL",
                "storage_key": None,
                "original_filename": None,
                "mime_type": None,
                "file_size_bytes": None,
            })

        was_active = video.is_active
        try:
            updated_video = VideoRepository.update(video, update_data)
        except Exception:
            if stored_file:
                cls._cleanup_video_file(stored_file.storage_key)
            raise
        if old_storage_key and old_storage_key != updated_video.storage_key:
            cls._cleanup_video_file(old_storage_key)
        if not was_active and updated_video.is_active:
            NotificationService.try_automatic_notification(
                NotificationService.notify_students_about_video,
                title="नवीन व्हिडिओ उपलब्ध",
                message=f"नवीन अभ्यास व्हिडिओ उपलब्ध आहे: {updated_video.title}",
                video_id=updated_video.id,
            )
        return updated_video

    @classmethod
    def delete(cls, video_id: int):

        video = VideoRepository.find_by_id(
            video_id
        )

        if not video:
            raise ValueError("Video not found.")

        storage_key = video.storage_key
        VideoRepository.delete(video)
        if storage_key:
            cls._cleanup_video_file(storage_key)

    @staticmethod
    def _validate_external_url(value):
        if not isinstance(value, str) or not value.strip() or len(value) > 500:
            raise ValueError("A valid HTTP or HTTPS video URL is required.")
        try:
            parsed = urlsplit(value.strip())
        except ValueError as error:
            raise ValueError("A valid HTTP or HTTPS video URL is required.") from error
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            raise ValueError("A valid HTTP or HTTPS video URL is required.")

    @staticmethod
    def _cleanup_video_file(storage_key):
        try:
            delete_video_file(storage_key)
        except (OSError, ValueError):
            logger.error("Unable to clean up a stored video file.")

    @staticmethod
    def get_file(video_id, active_only=True):
        video = VideoRepository.find_by_id(video_id)
        if not video or (active_only and not video.is_active):
            raise LookupError("Video not found.")
        if video.source_type != "UPLOAD" or not video.storage_key:
            raise LookupError("Uploaded video file not found.")
        try:
            path = resolve_video_path(video.storage_key)
        except ValueError as error:
            raise LookupError("Uploaded video file not found.") from error
        if not path.is_file():
            raise LookupError("Uploaded video file not found.")
        return path, video.mime_type, video.original_filename

    @staticmethod
    def update_status(video_id: int, is_active: bool):
        video = VideoRepository.find_by_id(video_id)
        if not video:
            raise LookupError("Video not found.")
        was_active = video.is_active
        updated_video = VideoRepository.update(video, {"is_active": is_active})
        if not was_active and updated_video.is_active:
            NotificationService.try_automatic_notification(
                NotificationService.notify_students_about_video,
                title="नवीन व्हिडिओ उपलब्ध",
                message=f"नवीन अभ्यास व्हिडिओ उपलब्ध आहे: {updated_video.title}",
                video_id=updated_video.id,
            )
        return updated_video

    @staticmethod
    def serialize_admin(video):
        return {
            "id": video.id,
            "subject_id": video.subject_id,
            "topic_id": video.topic_id,
            "subject": {
                "id": video.subject.id,
                "name": video.subject.name,
            } if video.subject else None,
            "topic": {
                "id": video.topic.id,
                "name": video.topic.name,
            } if video.topic else None,
            "title": video.title,
            "video_url": video.video_url,
            "source_type": video.source_type or "URL",
            "original_filename": video.original_filename,
            "file_size_bytes": video.file_size_bytes,
            "description": video.description,
            "duration": video.duration,
            "is_active": video.is_active,
            "created_at": video.created_at.isoformat() if video.created_at else None,
            "updated_at": video.updated_at.isoformat() if video.updated_at else None,
        }
