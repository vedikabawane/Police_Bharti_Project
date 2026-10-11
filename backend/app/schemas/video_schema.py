from marshmallow import Schema, fields, pre_load, validate


class _VideoInputSchema(Schema):
    @pre_load
    def normalize_values(self, data, **kwargs):
        if not isinstance(data, dict):
            return data
        data = dict(data)
        for key in ("title", "video_url"):
            if isinstance(data.get(key), str):
                data[key] = data[key].strip()
        if data.get("video_url") == "":
            data["video_url"] = None
        # Duration is stored as text but clients may submit the numeric example.
        duration = data.get("duration")
        if isinstance(duration, (int, float)) and not isinstance(duration, bool):
            data["duration"] = str(duration)
        return data


class CreateVideoSchema(_VideoInputSchema):
    subject_id = fields.Integer(required=True, validate=validate.Range(min=1))
    topic_id = fields.Integer(required=True, validate=validate.Range(min=1))
    title = fields.String(
        required=True,
        validate=[validate.Length(min=1, max=200), validate.Regexp(r".*\S.*")],
    )
    video_url = fields.String(
        required=False,
        allow_none=True,
        validate=[
            validate.Length(min=1, max=500),
            validate.URL(schemes={"http", "https"}),
        ],
    )
    description = fields.String(required=False, allow_none=True)
    duration = fields.String(
        required=False, allow_none=True, validate=validate.Length(max=20)
    )
    is_active = fields.Boolean(required=False, load_default=True)


class UpdateVideoSchema(_VideoInputSchema):
    title = fields.String(
        required=False,
        validate=[validate.Length(min=1, max=200), validate.Regexp(r".*\S.*")],
    )
    video_url = fields.String(
        required=False,
        allow_none=True,
        validate=[
            validate.Length(min=1, max=500),
            validate.URL(schemes={"http", "https"}),
        ],
    )
    description = fields.String(required=False, allow_none=True)
    duration = fields.String(required=False, allow_none=True)
    is_active = fields.Boolean(required=False)


class UpdateVideoStatusSchema(Schema):
    is_active = fields.Boolean(required=True)
