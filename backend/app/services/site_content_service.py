from datetime import datetime
from math import ceil
from urllib.parse import urlparse

from app.models.site_content_model import AboutPageContent, ContactMessage, ContactSettings, WebsiteTeamMember
from app.repositories.site_content_repository import SiteContentRepository
from app.utils.team_member_photo_storage import delete_team_member_photo


class SiteContentService:
    STATUSES = {"NEW", "READ", "IN_PROGRESS", "REPLIED", "ARCHIVED"}

    @staticmethod
    def _public(record, keys): return {key: getattr(record, key) for key in keys}

    @classmethod
    def get_about(cls, public=False):
        row = SiteContentRepository.about()
        if row is None or (public and not row.is_active): return None
        keys = ["hero_title", "hero_subtitle", "introduction", "purpose", "mission", "vision", "study_features", "test_features", "physical_training_info", "current_affairs_info", "recruitment_info", "ai_assistant_info", "performance_info", "free_platform_info", "contact_cta"]
        if not public: keys += ["id", "is_active", "created_at", "updated_at"]
        return cls._public(row, keys)

    @classmethod
    def save_about(cls, values):
        row = SiteContentRepository.save(AboutPageContent, SiteContentRepository.about(), values)
        return row

    @classmethod
    def set_about_status(cls, active):
        row = SiteContentRepository.about()
        if row is None: raise LookupError("About content has not been created.")
        row.is_active = active
        SiteContentRepository.commit()
        return row

    @classmethod
    def get_contact_settings(cls, public=False):
        row = SiteContentRepository.contact_settings()
        if row is None or (public and not row.is_active): return None
        keys = ["heading", "description", "email", "phone", "address", "working_hours", "support_note"]
        if row.map_url and urlparse(row.map_url).scheme == "https": keys.append("map_url")
        if not public: keys += ["id", "is_active", "created_at", "updated_at", "map_url"]
        return cls._public(row, list(dict.fromkeys(keys)))

    @classmethod
    def save_contact_settings(cls, values): return SiteContentRepository.save(ContactSettings, SiteContentRepository.contact_settings(), values)

    @classmethod
    def set_contact_status(cls, active):
        row = SiteContentRepository.contact_settings()
        if row is None: raise LookupError("Contact settings have not been created.")
        row.is_active = active
        SiteContentRepository.commit()
        return row

    @staticmethod
    def submit_contact(values):
        for key in ("name", "email", "mobile", "subject", "message"):
            values[key] = values.get(key, "").strip()
        values["status"] = "NEW"
        return SiteContentRepository.submit(values)

    @classmethod
    def list_messages(cls, search, status, page, per_page):
        if status and status not in cls.STATUSES: raise ValueError("status is invalid.")
        try: page = max(1, int(page or 1)); per_page = int(per_page or 20)
        except (TypeError, ValueError) as error: raise ValueError("page and per_page must be integers.") from error
        if per_page < 1 or per_page > 100: raise ValueError("per_page must be between 1 and 100.")
        total, rows = SiteContentRepository.list_messages((search or "").strip()[:200], status, page, per_page)
        return {"items": [cls.serialize_message(row, detail=False) for row in rows], "pagination": {"page": page, "per_page": per_page, "total": total, "pages": ceil(total / per_page)}}

    @staticmethod
    def serialize_message(row, detail=True):
        fields = ["id", "name", "email", "mobile", "subject", "message", "status", "created_at", "read_at", "replied_at"]
        if detail: fields += ["admin_notes", "updated_at"]
        return {key: getattr(row, key) for key in fields}

    @classmethod
    def get_message(cls, message_id):
        row = SiteContentRepository.message(message_id)
        if row is None: raise LookupError("Contact message not found.")
        return row

    @classmethod
    def update_message_status(cls, message_id, status):
        row = cls.get_message(message_id)
        row.status = status
        now = datetime.utcnow()
        if status == "READ" and row.read_at is None: row.read_at = now
        if status == "REPLIED" and row.replied_at is None: row.replied_at = now
        SiteContentRepository.commit()
        return row

    @classmethod
    def update_message_notes(cls, message_id, notes):
        row = cls.get_message(message_id)
        row.admin_notes = notes
        SiteContentRepository.commit()
        return row

    @classmethod
    def list_team_members(cls, search="", is_active=None, role="", page=1, per_page=20, public=False):
        try:
            page = max(1, int(page or 1))
            per_page = int(per_page or (100 if public else 20))
        except (TypeError, ValueError) as error:
            raise ValueError("page and per_page must be integers.") from error
        if per_page < 1 or per_page > (100 if public else 100):
            raise ValueError("per_page must be between 1 and 100.")
        total, rows = SiteContentRepository.list_team_members(
            (search or "").strip()[:200], is_active, (role or "").strip()[:120], page, per_page, public
        )
        return {
            "items": [cls.serialize_team_member(row, public=public) for row in rows],
            "pagination": {"page": page, "per_page": per_page, "total": total, "pages": ceil(total / per_page)},
        }

    @staticmethod
    def serialize_team_member(row, public=False):
        data = {
            "id": row.id, "name": row.name, "role": row.role, "bio": row.bio,
            "email": row.email, "mobile": row.mobile, "location": row.location,
            "photo_url": f"/api/public/team-members/{row.id}/photo" if row.photo_storage_key else None,
            "display_order": row.display_order,
        }
        if not public:
            data.update({"is_active": row.is_active, "created_at": row.created_at, "updated_at": row.updated_at, "photo_original_filename": row.photo_original_filename, "photo_mime_type": row.photo_mime_type, "photo_file_size_bytes": row.photo_file_size_bytes})
        return data

    @staticmethod
    def get_team_member(member_id):
        row = SiteContentRepository.team_member(member_id)
        if row is None:
            raise LookupError("Team member not found.")
        return row

    @classmethod
    def save_team_member(cls, values, photo=None, member=None):
        from app.utils.team_member_photo_storage import save_team_member_photo

        for key in ("name", "role", "bio", "email", "mobile", "location"):
            if key in values and isinstance(values[key], str):
                values[key] = values[key].strip() or (None if key in ("email", "mobile", "location") else "")
        old_storage_key = member.photo_storage_key if member else None
        new_storage_key = None
        if photo:
            new_storage_key, original_filename, mime_type, size = save_team_member_photo(photo)
            values.update({
                "photo_storage_key": new_storage_key,
                "photo_original_filename": original_filename,
                "photo_mime_type": mime_type,
                "photo_file_size_bytes": size,
            })
        if member is None:
            values.setdefault("bio", "")
            values.setdefault("email", None)
            values.setdefault("mobile", None)
            values.setdefault("location", None)
            values.setdefault("display_order", 0)
        try:
            row = SiteContentRepository.save_team_member(member, values)
        except Exception:
            if new_storage_key:
                delete_team_member_photo(new_storage_key)
            raise
        if new_storage_key and old_storage_key:
            delete_team_member_photo(old_storage_key)
        return row

    @staticmethod
    def set_team_member_status(member_id, active):
        row = SiteContentService.get_team_member(member_id)
        row.is_active = active
        SiteContentRepository.commit()
        return row

    @classmethod
    def delete_team_member(cls, member_id):
        row = cls.get_team_member(member_id)
        storage_key = row.photo_storage_key
        SiteContentRepository.delete_team_member(row)
        if storage_key:
            delete_team_member_photo(storage_key)
