import re
from urllib.parse import urlparse
from marshmallow import Schema, ValidationError, fields, validate, validates_schema


ABOUT_LIMITS = {
    "hero_title": 200, "hero_subtitle": 500, "introduction": 5000,
    "purpose": 3000, "mission": 3000, "vision": 3000,
    "study_features": 3000, "test_features": 3000,
    "physical_training_info": 3000, "current_affairs_info": 3000,
    "recruitment_info": 3000, "ai_assistant_info": 3000,
    "performance_info": 3000, "free_platform_info": 3000, "contact_cta": 1000,
}
CONTACT_FIELDS = ("heading", "description", "email", "phone", "address", "working_hours", "support_note", "map_url")


class AboutSchema(Schema):
    hero_title = fields.String(required=True, validate=validate.Length(max=200))
    hero_subtitle = fields.String(required=True, validate=validate.Length(max=500))
    introduction = fields.String(required=True, validate=validate.Length(max=5000))
    purpose = fields.String(required=True, validate=validate.Length(max=3000))
    mission = fields.String(required=True, validate=validate.Length(max=3000))
    vision = fields.String(required=True, validate=validate.Length(max=3000))
    study_features = fields.String(required=True, validate=validate.Length(max=3000))
    test_features = fields.String(required=True, validate=validate.Length(max=3000))
    physical_training_info = fields.String(required=True, validate=validate.Length(max=3000))
    current_affairs_info = fields.String(required=True, validate=validate.Length(max=3000))
    recruitment_info = fields.String(required=True, validate=validate.Length(max=3000))
    ai_assistant_info = fields.String(required=True, validate=validate.Length(max=3000))
    performance_info = fields.String(required=True, validate=validate.Length(max=3000))
    free_platform_info = fields.String(required=True, validate=validate.Length(max=3000))
    contact_cta = fields.String(required=True, validate=validate.Length(max=1000))


class ContactSettingsSchema(Schema):
    heading = fields.String(required=True, validate=validate.Length(min=1, max=200))
    description = fields.String(required=True, validate=validate.Length(max=1000))
    email = fields.String(allow_none=True, validate=validate.Length(max=255))
    phone = fields.String(allow_none=True, validate=validate.Length(max=20))
    address = fields.String(allow_none=True, validate=validate.Length(max=1000))
    working_hours = fields.String(allow_none=True, validate=validate.Length(max=300))
    support_note = fields.String(allow_none=True, validate=validate.Length(max=1000))
    map_url = fields.String(allow_none=True, validate=validate.Length(max=1000))

    @validates_schema
    def validate_settings(self, data, **kwargs):
        email = data.get("email")
        if email and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
            raise ValidationError({"email": ["Enter a valid email address."]})
        map_url = data.get("map_url")
        if map_url:
            parsed = urlparse(map_url)
            if parsed.scheme.lower() != "https" or not parsed.hostname or parsed.username or parsed.password:
                raise ValidationError({"map_url": ["Enter a valid HTTPS map URL."]})


class ContactSubmissionSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=100))
    email = fields.String(required=True, validate=[validate.Length(min=3, max=255), validate.Regexp(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")])
    mobile = fields.String(load_default="", validate=validate.Length(max=20))
    subject = fields.String(required=True, validate=validate.Length(min=1, max=200))
    message = fields.String(required=True, validate=validate.Length(min=1, max=3000))

    @validates_schema
    def validate_not_blank(self, data, **kwargs):
        errors = {key: ["This field cannot be blank."] for key in ("name", "email", "subject", "message") if not data.get(key, "").strip()}
        mobile = data.get("mobile", "").strip()
        if mobile and not re.fullmatch(r"[+0-9(). -]{5,20}", mobile):
            errors["mobile"] = ["Enter a valid phone number."]
        if errors:
            raise ValidationError(errors)


class ContactStatusSchema(Schema):
    status = fields.String(required=True, validate=validate.OneOf(["NEW", "READ", "IN_PROGRESS", "REPLIED", "ARCHIVED"]))


class ContactNotesSchema(Schema):
    admin_notes = fields.String(required=True, validate=validate.Length(max=5000))


class TeamMemberSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=120))
    role = fields.String(validate=validate.Length(min=1, max=120))
    bio = fields.String(validate=validate.Length(max=1000))
    email = fields.String(allow_none=True, validate=validate.Length(max=255))
    mobile = fields.String(allow_none=True, validate=validate.Length(max=20))
    location = fields.String(allow_none=True, validate=validate.Length(max=255))
    display_order = fields.Integer(validate=validate.Range(min=0))

    @validates_schema
    def validate_team_member(self, data, **kwargs):
        errors = {}
        email = data.get("email")
        if email and not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
            errors["email"] = ["Enter a valid email address."]
        mobile = data.get("mobile")
        if mobile and not re.fullmatch(r"[+0-9(). -]{5,20}", mobile):
            errors["mobile"] = ["Enter a valid phone number."]
        for key in ("name", "role"):
            if key in data and not data[key].strip():
                errors[key] = ["This field cannot be blank."]
        if errors:
            raise ValidationError(errors)
