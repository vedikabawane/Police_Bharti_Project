from flask import Blueprint, request
from marshmallow import ValidationError

from app.middleware.rbac import role_required
from app.schemas.question_schema import (
    CreateQuestionSchema,
    UpdateQuestionSchema
)
from app.services.question_service import QuestionService


question_bp = Blueprint(
    "question",
    __name__,
    url_prefix="/api/questions"
)


def serialize_question(question, include_admin_metadata=False):

    serialized = {
        "id": question.id,
        "subject_id": question.subject_id,
        "topic_id": question.topic_id,
        "exam_name": question.exam_name,
        "exam_year": question.exam_year,
        "question_text": question.question_text,
        "correct_option": question.correct_option,
        "explanation": question.explanation,
        "difficulty": question.difficulty,
        "marks": str(question.marks),
        "is_pyq": question.is_pyq,
        "is_active": question.is_active,
        "options": [
            {
                "id": option.id,
                "option_label": option.option_label,
                "option_text": option.option_text
            }
            for option in question.options
        ]
    }

    if include_admin_metadata:
        serialized.update({
            "created_at": question.created_at.isoformat() if question.created_at else None,
            "updated_at": question.updated_at.isoformat() if question.updated_at else None,
            "subject": {
                "id": question.subject.id,
                "name": question.subject.name,
            },
            "topic": {
                "id": question.topic.id,
                "name": question.topic.name,
            },
        })

    return serialized


@question_bp.get("/topic/<int:topic_id>")
@role_required("student", "admin")
def get_questions(topic_id):

    try:

        questions = QuestionService.get_questions_by_topic(
            topic_id
        )

        return {
            "success": True,
            "message": "Questions fetched successfully.",
            "data": [
                serialize_question(question)
                for question in questions
            ]
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404


@question_bp.get("/pyq")
@role_required("student", "admin")
def get_pyq():

    try:

        subject_id = request.args.get(
            "subject_id",
            type=int
        )

        topic_id = request.args.get(
            "topic_id",
            type=int
        )

        exam_year = request.args.get(
            "exam_year",
            type=int
        )

        questions = QuestionService.get_pyq(
            subject_id=subject_id,
            topic_id=topic_id,
            exam_year=exam_year
        )

        return {
            "success": True,
            "message": "PYQ questions fetched successfully.",
            "data": [
                serialize_question(question)
                for question in questions
            ]
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404


@question_bp.post(
    "/subject/<int:subject_id>/topic/<int:topic_id>"
)
@role_required("admin")
def create_question(
    subject_id,
    topic_id
):

    try:

        json_data = request.get_json()

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        data = CreateQuestionSchema().load(
            json_data
        )

        question = QuestionService.create_question(
            subject_id,
            topic_id,
            data
        )

        return {
            "success": True,
            "message": "Question created successfully.",
            "data": serialize_question(question)
        }, 201

    except ValidationError as error:

        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages
        }, 422

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 409


@question_bp.patch("/<int:question_id>")
@role_required("admin")
def update_question(question_id):

    try:

        json_data = request.get_json()

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        data = UpdateQuestionSchema().load(
            json_data,
            partial=True
        )

        question = QuestionService.update_question(
            question_id,
            data
        )

        return {
            "success": True,
            "message": "Question updated successfully.",
            "data": serialize_question(question)
        }, 200

    except ValidationError as error:

        return {
            "success": False,
            "message": "Validation failed.",
            "errors": error.messages
        }, 422

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404


@question_bp.delete("/<int:question_id>")
@role_required("admin")
def delete_question(question_id):

    try:

        result = QuestionService.delete_question(
            question_id
        )

        return {
            "success": True,
            "message": (
                "Question deactivated to preserve test history."
                if result["archived"] else "Question deleted successfully."
            ),
            "data": result,
        }, 200

    except ValueError as error:

        return {
            "success": False,
            "message": str(error)
        }, 404
