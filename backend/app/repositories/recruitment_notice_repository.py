from sqlalchemy import or_

from app.extensions import db
from app.models.recruitment_notice_model import RecruitmentNotice


class RecruitmentNoticeRepository:
    @staticmethod
    def find_by_id(notice_id):
        return db.session.get(RecruitmentNotice, notice_id)

    @staticmethod
    def list_notices(search, notice_type, recruitment_year, department,
                     is_active, published_date, page, per_page, active_only=False):
        query = RecruitmentNotice.query
        if active_only:
            query = query.filter(RecruitmentNotice.is_active.is_(True))
        elif is_active is not None:
            query = query.filter(RecruitmentNotice.is_active.is_(is_active))
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(
                RecruitmentNotice.title.ilike(pattern),
                RecruitmentNotice.summary.ilike(pattern),
                RecruitmentNotice.content.ilike(pattern),
                RecruitmentNotice.post_name.ilike(pattern),
                RecruitmentNotice.department.ilike(pattern),
            ))
        if notice_type:
            query = query.filter(RecruitmentNotice.notice_type == notice_type)
        if recruitment_year is not None:
            query = query.filter(RecruitmentNotice.recruitment_year == recruitment_year)
        if department:
            query = query.filter(RecruitmentNotice.department.ilike(department))
        if published_date:
            query = query.filter(RecruitmentNotice.published_date == published_date)

        total = query.order_by(None).count()
        notices = query.order_by(
            RecruitmentNotice.published_date.desc(),
            RecruitmentNotice.id.desc(),
        ).offset((page - 1) * per_page).limit(per_page).all()
        return total, notices

    @staticmethod
    def create(data):
        notice = RecruitmentNotice(**data)
        try:
            db.session.add(notice)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return notice

    @staticmethod
    def update(notice, data):
        try:
            for key, value in data.items():
                setattr(notice, key, value)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return notice

    @staticmethod
    def update_status(notice, is_active):
        return RecruitmentNoticeRepository.update(notice, {"is_active": is_active})

    @staticmethod
    def delete(notice):
        try:
            db.session.delete(notice)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
