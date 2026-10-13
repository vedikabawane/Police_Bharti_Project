from flask import current_app

from app.repositories.user_repository import UserRepository
from app.utils.password import hash_password, check_password


class RegistrationUnavailableError(Exception):
    """Raised when direct registration is disabled outside local development."""


class AuthService:

    @staticmethod
    def register(data):
        if current_app.config.get("APP_ENV") != "development":
            raise RegistrationUnavailableError(
                "Registration verification is temporarily unavailable."
            )

        name = data["name"].strip()
        email = data["email"].strip().lower()
        mobile = data["mobile"].strip()
        password = data["password"]

        existing_email = UserRepository.find_by_email(email)
        if existing_email:
            raise ValueError("Email is already registered.")

        existing_mobile = UserRepository.find_by_mobile(mobile)
        if existing_mobile:
            raise ValueError("Mobile number is already registered.")

        password_hash = hash_password(password)
        return UserRepository.create(
            name=name,
            email=email,
            mobile=mobile,
            password_hash=password_hash,
            role="student",
        )

    @staticmethod
    def login(email: str, password: str):

        email = email.strip().lower()

        user = UserRepository.find_by_email(email)

        if not user:
            raise ValueError("Invalid email or password.")

        if not user.is_active:
            raise ValueError("Your account is inactive.")

        password_valid = check_password(
            password,
            user.password_hash
        )

        if not password_valid:
            raise ValueError("Invalid email or password.")

        return user
