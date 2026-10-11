from marshmallow import Schema, fields, validate


class CreateSubjectSchema(Schema):

    name = fields.String(
        required=True,
        validate=validate.Length(
            min=2,
            max=100
        )
    )

    description = fields.String(
        required=False,
        allow_none=True
    )


class UpdateSubjectSchema(Schema):

    name = fields.String(
        required=False,
        validate=validate.Length(
            min=2,
            max=100
        )
    )

    description = fields.String(
        required=False,
        allow_none=True
    )

    is_active = fields.Boolean(
        required=False
    )