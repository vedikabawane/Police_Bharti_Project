from functools import wraps

from flask import g
from flask_jwt_extended import (
    jwt_required,
    get_jwt_identity
)

from app.repositories.user_repository import UserRepository


def role_required(*allowed_roles):

    def decorator(function):

        @wraps(function)
        @jwt_required()
        def wrapper(*args, **kwargs):

            # Get user ID from JWT
            user_id = get_jwt_identity()

            try:
                user_id = int(user_id)
            except (TypeError, ValueError):
                return {
                    "success": False,
                    "message": "Invalid user identity."
                }, 401

            # Get user from database
            user = UserRepository.find_by_id(user_id)

            if not user:
                return {
                    "success": False,
                    "message": "User not found."
                }, 401

            # Check account status
            if not user.is_active:
                return {
                    "success": False,
                    "message": "Your account is inactive."
                }, 403

            # Check role
            if user.role not in allowed_roles:
                return {
                    "success": False,
                    "message": "You do not have permission to access this resource."
                }, 403

            # Store authenticated user
            g.current_user = user

            return function(*args, **kwargs)

        return wrapper

    return decorator