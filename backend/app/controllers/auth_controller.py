from flask import Blueprint, current_app, request
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity
)
from marshmallow import ValidationError

from app.schemas.auth_schema import (
    RegisterSchema,
    LoginSchema
)
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService


auth_bp = Blueprint(
    "auth",
    __name__,
    url_prefix="/api/auth"
)


@auth_bp.post("/register")
def register():

    try:
        json_data = request.get_json()

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        schema = RegisterSchema()
        data = schema.load(json_data)

        user = AuthService.register(data)

        return {
            "success": True,
            "message": "Student registered successfully.",
            "data": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "mobile": user.mobile,
                "role": user.role
            }
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

    except Exception as error:
        current_app.logger.exception("Registration failed.")
        response = {
            "success": False,
            "message": "Registration failed.",
        }
        if current_app.config.get("APP_ENV") != "production":
            response["error"] = str(error)
        return response, 500


@auth_bp.post("/login")
def login():

    try:
        json_data = request.get_json()

        if not json_data:
            return {
                "success": False,
                "message": "Request body is required."
            }, 400

        schema = LoginSchema()
        data = schema.load(json_data)

        user = AuthService.login(
            email=data["email"],
            password=data["password"]
        )

        # Create JWT tokens
        access_token = create_access_token(
            identity=str(user.id),
            additional_claims={
                "role": user.role
            }
        )

        refresh_token = create_refresh_token(
            identity=str(user.id)
        )

        return {
            "success": True,
            "message": "Login successful.",
            "data": {
                "user": {
                    "id": user.id,
                    "name": user.name,
                    "email": user.email,
                    "mobile": user.mobile,
                    "role": user.role
                },
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "Bearer"
            }
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
        }, 401

    except Exception as error:
        current_app.logger.exception("Login failed.")
        response = {
            "success": False,
            "message": "Login failed.",
        }
        if current_app.config.get("APP_ENV") != "production":
            response["error"] = str(error)
        return response, 500


@auth_bp.post("/refresh")
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()

    try:
        user_id = int(identity)
    except (TypeError, ValueError):
        return {
            "success": False,
            "message": "Invalid user identity."
        }, 401

    user = UserRepository.find_by_id(user_id)

    if not user:
        return {
            "success": False,
            "message": "User not found."
        }, 401

    if not user.is_active:
        return {
            "success": False,
            "message": "Your account is inactive."
        }, 403

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={
            "role": user.role
        }
    )

    return {
        "success": True,
        "message": "Access token refreshed successfully",
        "data": {
            "access_token": access_token
        }
    }, 200


@auth_bp.get("/me")
@jwt_required()
def me():

    user_id = get_jwt_identity()

    return {
        "success": True,
        "message": "Authenticated user.",
        "user_id": user_id
    }, 200
