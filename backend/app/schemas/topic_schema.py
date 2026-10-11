from marshmallow import Schema, fields, validate


class CreateTopicSchema(Schema):

    name = fields.String(
        required=True,
        validate=validate.Length(
            min=2,
            max=150
        )
    )

    description = fields.String(
        required=False,
        allow_none=True
    )

    is_active = fields.Boolean(required=False)


class UpdateTopicSchema(Schema):

    subject_id = fields.Integer(required=False, validate=validate.Range(min=1))

    name = fields.String(
        required=False,
        validate=validate.Length(
            min=2,
            max=150
        )
    )

    description = fields.String(
        required=False,
        allow_none=True
    )

    is_active = fields.Boolean(
        required=False
    )
