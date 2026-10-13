from marshmallow import Schema, ValidationError, fields, validate


MAX_DECIMAL_VALUE = 999999.99


def _validate_two_decimal_places(value):
    if value.as_tuple().exponent < -2:
        raise ValidationError("Must have at most 2 decimal places.")


def _decimal_metric_field():
    return fields.Decimal(
        required=False,
        allow_none=True,
        as_string=True,
        validate=[
            validate.Range(min=0, max=MAX_DECIMAL_VALUE),
            _validate_two_decimal_places
        ]
    )


class PhysicalTrainingSchema(Schema):
    date = fields.Date(
        required=True,
        allow_none=False
    )

    running = _decimal_metric_field()
    run_100m = _decimal_metric_field()
    run_1600m = _decimal_metric_field()
    run_800m = _decimal_metric_field()
    shot_put = _decimal_metric_field()

    push_ups = fields.Integer(
        required=False,
        allow_none=True,
        validate=validate.Range(min=0, max=2147483647)
    )

    running_distance = _decimal_metric_field()
    running_time = _decimal_metric_field()
    weight = _decimal_metric_field()
