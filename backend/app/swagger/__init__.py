from flask import Blueprint

swagger_bp = Blueprint(
    "swagger",
    __name__,
    url_prefix="/api/docs",
    template_folder="templates",
    static_folder="static",
)

from app.swagger import routes  # noqa: E402,F401

__all__ = ["swagger_bp"]
