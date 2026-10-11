from marshmallow import Schema, fields, validate


class CreateNoteSchema(Schema):

    title = fields.String(
        required=True,
        validate=validate.Length(
            min=2,
            max=200
        )
    )

    content = fields.String(
        required=True
    )


class UpdateNoteSchema(Schema):

    title = fields.String(
        required=False,
        validate=validate.Length(
            min=2,
            max=200
        )
    )

    content = fields.String(
        required=False
    )

    is_active = fields.Boolean(
        required=False
    )