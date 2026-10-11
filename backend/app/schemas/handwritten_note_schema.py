from marshmallow import Schema, fields, validate


class CreateHandwrittenNoteSchema(Schema):

    title = fields.String(
        required=True,
        validate=validate.Length(
            min=2,
            max=200
        )
    )

    file_url = fields.String(
        required=True,
        validate=validate.Length(
            min=1,
            max=500
        )
    )

    file_type = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=50
        )
    )

    description = fields.String(
        required=False,
        allow_none=True
    )


class UpdateHandwrittenNoteSchema(Schema):

    title = fields.String(
        required=False,
        validate=validate.Length(
            min=2,
            max=200
        )
    )

    file_url = fields.String(
        required=False,
        validate=validate.Length(
            max=500
        )
    )

    file_type = fields.String(
        required=False,
        allow_none=True
    )

    description = fields.String(
        required=False,
        allow_none=True
    )

    is_active = fields.Boolean(
        required=False
    )