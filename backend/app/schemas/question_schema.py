from marshmallow import (
    Schema,
    fields,
    validate,
    validates_schema,
    ValidationError
)


class QuestionOptionInputSchema(Schema):

    option_label = fields.String(
        required=True,
        validate=validate.OneOf(
            ["A", "B", "C", "D"]
        )
    )

    option_text = fields.String(
        required=True,
        validate=validate.Length(
            min=1
        )
    )


class CreateQuestionSchema(Schema):

    exam_name = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=200
        )
    )

    exam_year = fields.Integer(
        required=False,
        allow_none=True,
        validate=validate.Range(
            min=2000,
            max=2100
        )
    )

    question_text = fields.String(
        required=True,
        validate=validate.Length(
            min=1
        )
    )

    correct_option = fields.String(
        required=True,
        validate=validate.OneOf(
            ["A", "B", "C", "D"]
        )
    )

    explanation = fields.String(
        required=False,
        allow_none=True
    )

    difficulty = fields.String(
        required=False,
        load_default="medium",
        validate=validate.OneOf(
            ["easy", "medium", "hard"]
        )
    )

    marks = fields.Decimal(
        required=False,
        load_default=1.0,
        as_string=True,
        validate=validate.Range(min=0),
    )

    # Legacy compatibility input: accepted from older clients and ignored.
    negative_marks = fields.Raw(load_only=True)

    is_pyq = fields.Boolean(
        required=False,
        load_default=False
    )

    is_active = fields.Boolean(
        required=False,
        load_default=True
    )

    options = fields.List(
        fields.Nested(QuestionOptionInputSchema),
        required=True,
        validate=validate.Length(
            equal=4
        )
    )

    @validates_schema
    def validate_options(self, data, **kwargs):

        options = data.get("options", [])

        labels = [
            option["option_label"]
            for option in options
        ]

        if len(set(labels)) != 4:
            raise ValidationError(
                "Options must contain A, B, C and D exactly once."
            )

        correct_option = data["correct_option"]

        if correct_option not in labels:
            raise ValidationError(
                "Correct option must exist in the options."
            )


class UpdateQuestionSchema(Schema):

    exam_name = fields.String(
        required=False,
        allow_none=True,
        validate=validate.Length(
            max=200
        )
    )

    exam_year = fields.Integer(
        required=False,
        allow_none=True,
        validate=validate.Range(
            min=2000,
            max=2100
        )
    )

    question_text = fields.String(
        required=False
    )

    correct_option = fields.String(
        required=False,
        validate=validate.OneOf(
            ["A", "B", "C", "D"]
        )
    )

    explanation = fields.String(
        required=False,
        allow_none=True
    )

    difficulty = fields.String(
        required=False,
        validate=validate.OneOf(
            ["easy", "medium", "hard"]
        )
    )

    marks = fields.Decimal(
        required=False,
        as_string=True,
        validate=validate.Range(min=0),
    )

    # Legacy compatibility input: accepted from older clients and ignored.
    negative_marks = fields.Raw(load_only=True)

    is_pyq = fields.Boolean(
        required=False
    )

    is_active = fields.Boolean(
        required=False
    )

    options = fields.List(
        fields.Nested(QuestionOptionInputSchema),
        required=False,
        validate=validate.Length(
            equal=4
        )
    )

    @validates_schema
    def validate_options(self, data, **kwargs):
        options = data.get("options")
        if options is None:
            return

        labels = [option["option_label"] for option in options]
        if set(labels) != {"A", "B", "C", "D"}:
            raise ValidationError(
                "Options must contain A, B, C and D exactly once."
            )
