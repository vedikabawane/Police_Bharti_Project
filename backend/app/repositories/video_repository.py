from sqlalchemy import or_
from sqlalchemy.orm import joinedload

from app.extensions import db
from app.models.video_model import Video


class VideoRepository:

    @staticmethod
    def get_by_topic_id(topic_id: int, active_only=False):
        query = Video.query.filter_by(topic_id=topic_id)
        if active_only:
            query = query.filter_by(is_active=True)
        return query.order_by(
            Video.id.desc()
        ).all()

    @staticmethod
    def get_admin_videos(search, subject_id, topic_id, is_active, page, per_page):
        query = Video.query.options(
            joinedload(Video.subject),
            joinedload(Video.topic),
        )
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(
                Video.title.ilike(pattern),
                Video.description.ilike(pattern),
            ))
        if subject_id is not None:
            query = query.filter(Video.subject_id == subject_id)
        if topic_id is not None:
            query = query.filter(Video.topic_id == topic_id)
        if is_active is not None:
            query = query.filter(Video.is_active == is_active)

        total = query.order_by(None).count()
        videos = query.order_by(
            Video.created_at.desc(), Video.id.desc()
        ).offset((page - 1) * per_page).limit(per_page).all()
        return total, videos

    @staticmethod
    def find_by_id(video_id: int):

        return db.session.get(
            Video,
            video_id
        )

    @staticmethod
    def create(
        subject_id: int,
        topic_id: int,
        data: dict
    ):

        video = Video(
            subject_id=subject_id,
            topic_id=topic_id,
            **data
        )

        try:
            db.session.add(video)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return video

    @staticmethod
    def update(video, data: dict):

        try:
            for key, value in data.items():
                setattr(video, key, value)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

        return video

    @staticmethod
    def delete(video):

        try:
            db.session.delete(video)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
