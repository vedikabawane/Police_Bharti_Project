from urllib.parse import urlsplit

from marshmallow import Schema, ValidationError, fields, pre_load, validate, validates


CATEGORIES = (
    "महाराष्ट्र",
    "भारत",
    "आंतरराष्ट्रीय",
    "क्रीडा",
    "पुरस्कार",
    "विज्ञान",
    "अर्थव्यवस्था",
    "संरक्षण",
    "शासन / योजना",
    "महत्त्वाच्या घडामोडी",
)


def validate_http_url(value):
    if value in (None, ""):
        return
    if any(character.isspace() for character in value):
        raise ValidationError("source_url must be a valid HTTP(S) URL.")
    try:
        parsed = urlsplit(value)
        valid_host = bool(parsed.hostname)
        has_credentials = bool(parsed.username or parsed.password)
        parsed.port  # Accessing port also rejects malformed ports.
    except ValueError as error:
        raise ValidationError("source_url must be a valid HTTP(S) URL.") from error
    if parsed.scheme.lower() not in {"http", "https"} or not valid_host or has_credentials:
        raise ValidationError("source_url must be a valid HTTP(S) URL.")


class _CurrentAffairContentSchema(Schema):
    title = fields.String(validate=validate.Length(min=1, max=200))
    summary = fields.String(allow_none=True, validate=validate.Length(max=1000))
    content = fields.String(allow_none=True, validate=validate.Length(min=1, max=50000))
    category = fields.String(validate=validate.OneOf(CATEGORIES))
    published_date = fields.Date(format="iso")
    source_name = fields.String(allow_none=True, validate=validate.Length(max=200))
    source_url = fields.String(
        allow_none=True,
        validate=[validate.Length(max=500), validate_http_url],
    )

    @pre_load
    def trim_text(self, data, **kwargs):
        if not isinstance(data, dict):
            return data
        data = dict(data)
        for field_name in ("title", "summary", "content", "category", "source_name", "source_url"):
            value = data.get(field_name)
            if isinstance(value, str):
                value = value.strip()
                data[field_name] = value or (None if field_name in {"summary", "source_name", "source_url"} else value)
        return data

    @validates("title")
    def validate_title_not_blank(self, value, **kwargs):
        if not value:
            raise ValidationError("title must not be empty.")

    @validates("content")
    def validate_content_not_blank(self, value, **kwargs):
        if value is not None and not value:
            raise ValidationError("content must not be empty.")


class CreateCurrentAffairSchema(_CurrentAffairContentSchema):
    title = fields.String(required=True, validate=validate.Length(min=1, max=200))
    content = fields.String(required=True, validate=validate.Length(min=1, max=50000))
    category = fields.String(
        load_default="महाराष्ट्र",
        validate=validate.OneOf(CATEGORIES),
    )
    published_date = fields.Date(required=True, format="iso")


class UpdateCurrentAffairSchema(_CurrentAffairContentSchema):
    pass


class UpdateCurrentAffairStatusSchema(Schema):
    is_active = fields.Boolean(required=True)
