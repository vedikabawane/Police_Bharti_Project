from sqlalchemy import or_

from app.extensions import db
from app.models.site_content_model import AboutPageContent, ContactMessage, ContactSettings, WebsiteTeamMember


class SiteContentRepository:
    @staticmethod
    def about(): return AboutPageContent.query.order_by(AboutPageContent.id).first()

    @staticmethod
    def contact_settings(): return ContactSettings.query.order_by(ContactSettings.id).first()

    @staticmethod
    def save(model, record, values):
        try:
            if record is None:
                record = model(**values)
                db.session.add(record)
            else:
                for key, value in values.items(): setattr(record, key, value)
            db.session.commit()
            return record
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def submit(values):
        record = ContactMessage(**values)
        try:
            db.session.add(record)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise
        return record

    @staticmethod
    def list_messages(search, status, page, per_page):
        query = ContactMessage.query
        if status: query = query.filter(ContactMessage.status == status)
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(ContactMessage.name.ilike(pattern), ContactMessage.email.ilike(pattern), ContactMessage.mobile.ilike(pattern), ContactMessage.subject.ilike(pattern), ContactMessage.message.ilike(pattern)))
        total = query.order_by(None).count()
        rows = query.order_by(ContactMessage.created_at.desc(), ContactMessage.id.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return total, rows

    @staticmethod
    def message(message_id): return db.session.get(ContactMessage, message_id)

    @staticmethod
    def team_member(member_id): return db.session.get(WebsiteTeamMember, member_id)

    @staticmethod
    def list_team_members(search, is_active, role, page, per_page, public=False):
        query = WebsiteTeamMember.query
        if public:
            query = query.filter(WebsiteTeamMember.is_active.is_(True))
        elif is_active is not None:
            query = query.filter(WebsiteTeamMember.is_active.is_(is_active))
        if role:
            query = query.filter(WebsiteTeamMember.role.ilike(f"%{role}%"))
        if search:
            pattern = f"%{search}%"
            query = query.filter(or_(WebsiteTeamMember.name.ilike(pattern), WebsiteTeamMember.role.ilike(pattern), WebsiteTeamMember.bio.ilike(pattern)))
        total = query.order_by(None).count()
        rows = query.order_by(WebsiteTeamMember.display_order.asc(), WebsiteTeamMember.id.asc()).offset((page - 1) * per_page).limit(per_page).all()
        return total, rows

    @staticmethod
    def save_team_member(member, values):
        try:
            if member is None:
                member = WebsiteTeamMember(**values)
                db.session.add(member)
            else:
                for key, value in values.items():
                    setattr(member, key, value)
            db.session.commit()
            return member
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def delete_team_member(member):
        try:
            db.session.delete(member)
            db.session.commit()
        except Exception:
            db.session.rollback()
            raise

    @staticmethod
    def commit():
        db.session.commit()
