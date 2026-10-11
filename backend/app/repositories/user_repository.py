from app.extensions import db
from app.models.user_model import User


class UserRepository:

    @staticmethod
    def find_by_id(user_id: int):
        return db.session.get(User, user_id)

    @staticmethod
    def find_by_email(email: str):
        return User.query.filter_by(email=email).first()

    @staticmethod
    def find_by_mobile(mobile: str):
        return User.query.filter_by(mobile=mobile).first()

    @staticmethod
    def create(
        name: str,
        email: str,
        mobile: str,
        password_hash: str,
        role: str = "student"
    ):
        user = User(
            name=name,
            email=email,
            mobile=mobile,
            password_hash=password_hash,
            role=role
        )

        db.session.add(user)
        db.session.commit()

        return user