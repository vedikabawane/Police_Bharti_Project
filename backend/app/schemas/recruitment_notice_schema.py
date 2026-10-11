import re

from marshmallow import (
    Schema,
    ValidationError,
    fields,
    pre_load,
    validates,
    validates_schema,
    validate,
)

from app.schemas.current_affair_schema import validate_http_url


NOTICE_TYPES = (
    "RECRUITMENT",
    "ADVERTISEMENT",
    "EXAM_DATE",
    "ANSWER_KEY",
    "RESULT",
    "PHYSICAL_TEST",
    "DOCUMENT_VERIFICATION",
    "IMPORTANT_UPDATE",
    "OTHER",
)


class _RecruitmentNoticeSchema(Schema):
    title = fields.String(validate=validate.Length(min=1, max=200))
    summary = fields.String(allow_none=True, validate=validate.Length(max=1000))
    content = fields.String(allow_none=True, validate=validate.Length(max=50000))
    notice_type = fields.String(validate=validate.OneOf(NOTICE_TYPES))
    recruitment_year = fields.Integer(
        allow_none=True, validate=validate.Range(min=1900, max=2200)
    )
    department = fields.String(allow_none=True, validate=validate.Length(max=200))
    post_name = fields.String(allow_none=True, validate=validate.Length(max=200))
    vacancies = fields.Integer(allow_none=True, validate=validate.Range(min=0))
    application_start_date = fields.Date(allow_none=True, format="iso")
    application_end_date = fields.Date(allow_none=True, format="iso")
    exam_date = fields.Date(allow_none=True, format="iso")
    published_date = fields.Date(format="iso")
    official_source_name = fields.String(
        allow_none=True, validate=validate.Length(max=200)
    )
    official_source_url = fields.String(
        allow_none=True,
        validate=[validate.Length(max=500), validate_http_url],
    )

    @pre_load
    def normalize_form_values(self, data, **kwargs):
        if not isinstance(data, dict):
            return data
        data = dict(data)
        nullable_fields = {
            "summary", "content", "recruitment_year", "department", "post_name",
            "vacancies", "application_start_date", "application_end_date",
            "exam_date", "official_source_name", "official_source_url",
        }
        for field_name, value in data.items():
            if field_name in {"recruitment_year", "vacancies"} and value not in (None, ""):
                is_integer_text = isinstance(value, str) and re.fullmatch(r"-?\d+", value.strip())
                if isinstance(value, bool) or (
                    not isinstance(value, int) and not is_integer_text
                ):
                    raise ValidationError({field_name: ["Must be an integer."]})
            if not isinstance(value, str):
                continue
            value = value.strip()
            data[field_name] = None if not value and field_name in nullable_fields else value
        return data

    @validates("title")
    def validate_title_not_blank(self, value, **kwargs):
        if not value:
            raise ValidationError("title must not be empty.")

    @validates_schema
    def validate_application_dates(self, data, **kwargs):
        start_date = data.get("application_start_date")
        end_date = data.get("application_end_date")
        if start_date and end_date and start_date > end_date:
            raise ValidationError({
                "application_end_date": [
                    "application_end_date must be on or after application_start_date."
                ]
            })


class CreateRecruitmentNoticeSchema(_RecruitmentNoticeSchema):
    title = fields.String(required=True, validate=validate.Length(min=1, max=200))
    notice_type = fields.String(required=True, validate=validate.OneOf(NOTICE_TYPES))
    published_date = fields.Date(required=True, format="iso")


class UpdateRecruitmentNoticeSchema(_RecruitmentNoticeSchema):
    remove_pdf = fields.Boolean(load_default=False)


class UpdateRecruitmentNoticeStatusSchema(Schema):
    is_active = fields.Boolean(required=True)
