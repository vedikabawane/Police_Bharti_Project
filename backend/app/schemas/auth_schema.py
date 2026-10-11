from marshmallow import Schema, fields, validate


class RegisterSchema(Schema):

    name = fields.String(
        required=True,
        validate=validate.Length(min=2, max=100)
    )

    email = fields.Email(
        required=True
    )

    mobile = fields.String(
        required=True,
        validate=validate.Regexp(
            r"^[6-9][0-9]{9}$",
            error="Enter a valid 10-digit mobile number."
        )
    )

    password = fields.String(
        required=True,
        load_only=True,
        validate=validate.Length(min=6, max=128)
    )


class LoginSchema(Schema):

    email = fields.Email(
        required=True
    )

    password = fields.String(
        required=True,
        load_only=True
    )