import re

from marshmallow import Schema, ValidationError, fields, validate


class _StrictString(fields.String):

    def _deserialize(self, value, attr, data, **kwargs):
        if not isinstance(value, str):
            raise ValidationError("Not a valid string.")
        return super()._deserialize(value, attr, data, **kwargs)


class AIChatRequestSchema(Schema):
    message = _StrictString(
        required=True,
        validate=[
            validate.Length(min=1, max=2000),
            validate.Regexp(r".*\S.*", flags=re.DOTALL)
        ]
    )
    session_id = fields.UUID(
        required=False,
        allow_none=True
    )
