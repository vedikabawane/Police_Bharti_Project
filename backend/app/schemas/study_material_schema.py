from marshmallow import Schema, fields, validate


class CreateStudyMaterialSchema(Schema):
    # multipart form values arrive as strings; Marshmallow converts validated IDs.
    subject_id = fields.Integer(required=True, validate=validate.Range(min=1))
    topic_id = fields.Integer(required=True, validate=validate.Range(min=1))
    title = fields.String(required=True, validate=validate.Length(min=1, max=200))


class UpdateStudyMaterialStatusSchema(Schema):
    is_active = fields.Boolean(required=True)
