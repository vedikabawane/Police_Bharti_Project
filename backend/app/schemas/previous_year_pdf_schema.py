from marshmallow import Schema, ValidationError, fields, pre_load, validate


class CreatePreviousYearPDFSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(max=200))
    exam_name = fields.String(required=True, validate=validate.Length(max=200))
    exam_year = fields.Integer(required=True)
    description = fields.String(required=False, allow_none=True)

    @pre_load
    def trim_required_text(self, data, **kwargs):
        if not isinstance(data, dict):
            return data
        data = dict(data)
        for field_name in ("title", "exam_name"):
            if isinstance(data.get(field_name), str):
                data[field_name] = data[field_name].strip()
                if not data[field_name]:
                    raise ValidationError({field_name: ["Must not be empty."]})
        return data


class UpdatePreviousYearPDFStatusSchema(Schema):
    is_active = fields.Boolean(required=True)
