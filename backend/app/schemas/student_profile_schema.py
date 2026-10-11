from marshmallow import Schema, fields, validate


class StudentProfileSchema(Schema):

    district = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=100)
    )

    target_exam = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=150)
    )

    study_goal = fields.String(
        required=False,
        allow_none=True
    )

    physical_goal = fields.String(
        required=False,
        allow_none=True
    )

    education = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=150)
    )

    qualification = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=150)
    )

    category = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=50)
    )

    date_of_birth = fields.Date(
        required=False,
        allow_none=True
    )

    height = fields.Decimal(
        required=False,
        allow_none=True,
        as_string=True
    )

    chest = fields.Decimal(
        required=False,
        allow_none=True,
        as_string=True
    )

    weight = fields.Decimal(
        required=False,
        allow_none=True,
        as_string=True
    )

    profile_photo = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(max=500)
    )