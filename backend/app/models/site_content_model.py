from datetime import datetime

from app.extensions import db


class AboutPageContent(db.Model):
    __tablename__ = "about_page_content"

    id = db.Column(db.BigInteger().with_variant(db.Integer, "sqlite"), primary_key=True, autoincrement=True)
    hero_title = db.Column(db.String(200), nullable=False, default="")
    hero_subtitle = db.Column(db.String(500), nullable=False, default="")
    introduction = db.Column(db.Text, nullable=False, default="")
    purpose = db.Column(db.Text, nullable=False, default="")
    mission = db.Column(db.Text, nullable=False, default="")
    vision = db.Column(db.Text, nullable=False, default="")
    study_features = db.Column(db.Text, nullable=False, default="")
    test_features = db.Column(db.Text, nullable=False, default="")
    physical_training_info = db.Column(db.Text, nullable=False, default="")
    current_affairs_info = db.Column(db.Text, nullable=False, default="")
    recruitment_info = db.Column(db.Text, nullable=False, default="")
    ai_assistant_info = db.Column(db.Text, nullable=False, default="")
    performance_info = db.Column(db.Text, nullable=False, default="")
    free_platform_info = db.Column(db.Text, nullable=False, default="")
    contact_cta = db.Column(db.Text, nullable=False, default="")
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class ContactSettings(db.Model):
    __tablename__ = "contact_settings"

    id = db.Column(db.BigInteger().with_variant(db.Integer, "sqlite"), primary_key=True, autoincrement=True)
    heading = db.Column(db.String(200), nullable=False, default="Contact")
    description = db.Column(db.String(1000), nullable=False, default="")
    email = db.Column(db.String(255), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    address = db.Column(db.String(1000), nullable=True)
    working_hours = db.Column(db.String(300), nullable=True)
    support_note = db.Column(db.String(1000), nullable=True)
    map_url = db.Column(db.String(1000), nullable=True)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)


class ContactMessage(db.Model):
    __tablename__ = "contact_messages"
    __table_args__ = (db.Index("ix_contact_messages_created_status", "created_at", "status"),)

    id = db.Column(db.BigInteger().with_variant(db.Integer, "sqlite"), primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False, index=True)
    mobile = db.Column(db.String(20), nullable=True, index=True)
    subject = db.Column(db.String(200), nullable=False)
    message = db.Column(db.String(3000), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="NEW", index=True)
    admin_notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    read_at = db.Column(db.DateTime, nullable=True)
    replied_at = db.Column(db.DateTime, nullable=True)


class ContactRateLimit(db.Model):
    __tablename__ = "contact_rate_limits"

    client_key = db.Column(db.String(64), primary_key=True)
    attempts = db.Column(db.JSON, nullable=False, default=list)
    last_seen_at = db.Column(db.DateTime, nullable=False, index=True)


class WebsiteTeamMember(db.Model):
    __tablename__ = "website_team_members"
    __table_args__ = (
        db.Index("ix_website_team_members_active_order", "is_active", "display_order", "id"),
    )

    id = db.Column(db.BigInteger().with_variant(db.Integer, "sqlite"), primary_key=True, autoincrement=True)
    name = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(120), nullable=False)
    bio = db.Column(db.String(1000), nullable=False, default="")
    email = db.Column(db.String(255), nullable=True)
    mobile = db.Column(db.String(20), nullable=True)
    location = db.Column(db.String(255), nullable=True)
    photo_storage_key = db.Column(db.String(100), nullable=True)
    photo_original_filename = db.Column(db.String(255), nullable=True)
    photo_mime_type = db.Column(db.String(50), nullable=True)
    photo_file_size_bytes = db.Column(db.Integer, nullable=True)
    display_order = db.Column(db.Integer, nullable=False, default=0)
    is_active = db.Column(db.Boolean, nullable=False, default=True, index=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
