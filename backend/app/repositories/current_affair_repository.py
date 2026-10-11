from sqlalchemy import or_

from app.extensions import db
from app.models.current_affair_model import CurrentAffair


class CurrentAffairRepository:
    @staticmethod
    def find_by_id(current_affair_id):
        return db.session.get(CurrentAffair, current_affair_id)

    @staticmethod
    def list_current_affairs(search, category, is_active, published_date,
                             page, per_page, active_only=False, content_type=None):
        query = CurrentAffair.query
        if active_only:
            query = query.filter(CurrentAffair.is_active.is_(True))
        elif is_active is not None:
            query = query.filter(CurrentAffair.is_active.is_(is_active))
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(
                CurrentAffair.title.ilike(pattern),
                CurrentAffair.original_filename.ilike(pattern),
                CurrentAffair.summary.ilike(pattern),
                CurrentAffair.content.ilike(pattern),
            ))
        if category:
            query = query.filter(CurrentAffair.category == category)
        if published_date:
            query = query.filter(CurrentAffair.published_date == published_date)
        if content_type:
            query = query.filter(CurrentAffair.content_type == content_type)

        total = query.order_by(None).count()
        records = query.order_by(
            CurrentAffair.published_date.desc(),
            CurrentAffair.id.desc(),
        ).offset((page - 1) * per_page).limit(per_page).all()
        return total, records

    @staticmethod
    def create(data):
        current_affair = CurrentAffair(**data)
        try:
            db.session.add(current_affair)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return current_affair

    @staticmethod
    def update(current_affair, data):
        try:
            for key, value in data.items():
                setattr(current_affair, key, value)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return current_affair

    @staticmethod
    def update_status(current_affair, is_active):
        return CurrentAffairRepository.update(
            current_affair, {"is_active": is_active}
        )

    @staticmethod
    def delete(current_affair):
        try:
            db.session.delete(current_affair)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
