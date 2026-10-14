from marshmallow import Schema, ValidationError, fields, validate, validates_schema


TEST_TYPES = [
    "subject", "topic", "mixed", "full_mock", "daily", "weekly", "previous_year",
    "SUBJECT", "TOPIC", "MIXED", "FULL_MOCK", "DAILY", "WEEKLY", "PREVIOUS_YEAR",
]


class AdminTestQuestionOptionSchema(Schema):
    option_label = fields.String(
        required=True,
        validate=validate.OneOf(["A", "B", "C", "D"]),
    )
    option_text = fields.String(
        required=True,
        validate=validate.Length(min=1),
    )


class AdminTestQuestionSchema(Schema):
    id = fields.Integer(required=False, validate=validate.Range(min=1))
    subject_id = fields.Integer(required=False, allow_none=True, validate=validate.Range(min=1))
    topic_id = fields.Integer(required=False, allow_none=True, validate=validate.Range(min=1))
    exam_name = fields.String(required=False, allow_none=True, validate=validate.Length(max=200))
    exam_year = fields.Integer(required=False, allow_none=True, validate=validate.Range(min=2000, max=2100))
    question_text = fields.String(required=True, validate=validate.Length(min=1))
    correct_option = fields.String(required=True, validate=validate.OneOf(["A", "B", "C", "D"]))
    explanation = fields.String(required=False, allow_none=True)
    difficulty = fields.String(
        required=False,
        load_default="medium",
        validate=validate.OneOf(["easy", "medium", "hard"]),
    )
    marks = fields.Decimal(
        required=False,
        load_default="1",
        as_string=True,
        validate=validate.Range(min=0.01),
    )
    is_pyq = fields.Boolean(required=False, load_default=False)
    options = fields.List(
        fields.Nested(AdminTestQuestionOptionSchema),
        required=True,
        validate=validate.Length(equal=4),
    )

    @validates_schema
    def validate_options(self, data, **kwargs):
        options = data.get("options", [])
        labels = [option["option_label"] for option in options]
        if set(labels) != {"A", "B", "C", "D"}:
            raise ValidationError("Options must contain A, B, C and D exactly once.")
        if data.get("correct_option") not in labels:
            raise ValidationError("Correct option must exist in the options.")


class CreateAdminTestSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=1, max=200))
    description = fields.String(required=False, allow_none=True)
    instructions = fields.String(required=False, allow_none=True)
    test_type = fields.String(required=True, validate=validate.OneOf(TEST_TYPES))
    subject_id = fields.Integer(required=False, allow_none=True, validate=validate.Range(min=1))
    topic_id = fields.Integer(required=False, allow_none=True, validate=validate.Range(min=1))
    duration_minutes = fields.Integer(required=True, validate=validate.Range(min=1, max=600))
    question_ids = fields.List(
        fields.Integer(validate=validate.Range(min=1)),
        required=False,
        allow_none=True,
        validate=validate.Length(min=1),
    )
    questions = fields.List(
        fields.Nested(AdminTestQuestionSchema),
        required=False,
        validate=validate.Length(min=1),
    )
    # Legacy compatibility input: accepted from older clients and ignored.
    negative_marks = fields.Raw(load_only=True)
    is_active = fields.Boolean(required=False, load_default=True)


class UpdateAdminTestSchema(Schema):
    title = fields.String(required=False, validate=validate.Length(min=1, max=200))
    description = fields.String(required=False, allow_none=True)
    instructions = fields.String(required=False, allow_none=True)
    test_type = fields.String(required=False, validate=validate.OneOf(TEST_TYPES))
    subject_id = fields.Integer(required=False, allow_none=True, validate=validate.Range(min=1))
    topic_id = fields.Integer(required=False, allow_none=True, validate=validate.Range(min=1))
    duration_minutes = fields.Integer(required=False, validate=validate.Range(min=1, max=600))
    question_ids = fields.List(
        fields.Integer(validate=validate.Range(min=1)),
        required=False,
        allow_none=True,
        validate=validate.Length(min=1),
    )
    questions = fields.List(
        fields.Nested(AdminTestQuestionSchema),
        required=False,
        validate=validate.Length(min=1),
    )
    is_active = fields.Boolean(required=False)
    # Legacy compatibility input: accepted from older clients and ignored.
    negative_marks = fields.Raw(load_only=True)


class TestStatusSchema(Schema):
    # Raw preserves the distinction between a JSON boolean and strings like "false".
    is_active = fields.Raw(required=True)


class CreateTestSchema(Schema):
    title = fields.String(
        required=True,
        validate=validate.Length(min=2, max=200)
    )

    description = fields.String(
        required=False,
        allow_none=True
    )

    test_type = fields.String(
        required=True,
        validate=validate.OneOf([
            "subject",
            "topic",
            "mixed",
            "full_mock",
            "daily",
            "weekly",
            "previous_year"
        ])
    )

    subject_id = fields.Integer(
        required=False,
        allow_none=True
    )

    topic_id = fields.Integer(
        required=False,
        allow_none=True
    )

    duration_minutes = fields.Integer(
        required=False,
        load_default=30,
        validate=validate.Range(min=1, max=600)
    )

    # Legacy compatibility input: accepted from older clients and ignored.
    negative_marks = fields.Raw(load_only=True)


class AddTestQuestionSchema(Schema):
    question_id = fields.Integer(
        required=True
    )

    question_order = fields.Integer(
        required=False,
        allow_none=True,
        validate=validate.Range(min=1)
    )


class TestAnswerInputSchema(Schema):
    question_id = fields.Integer(
        required=True
    )

    selected_option = fields.String(
        required=False,
        allow_none=True,
        validate=validate.OneOf(
            ["A", "B", "C", "D", None]
        )
    )

    time_taken_seconds = fields.Integer(
        required=False,
        load_default=0,
        validate=validate.Range(min=0)
    )


class SubmitTestSchema(Schema):
    answers = fields.List(
        fields.Nested(TestAnswerInputSchema),
        required=True
    )
