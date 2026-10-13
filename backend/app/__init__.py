from uuid import uuid4

from flask import Flask, current_app, g, jsonify, request, send_from_directory
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from werkzeug.middleware.proxy_fix import ProxyFix

from app.config.config import (
    Config,
    validate_production_config,
    validate_sms_config,
)
from app.extensions import db, migrate, jwt
from app.logging_config import configure_logging
from app.models import User

from app.controllers.auth_controller import auth_bp
from app.controllers.student_controller import student_bp
from app.controllers.admin_controller import admin_bp
from app.controllers.student_profile_controller import (student_profile_bp)
from app.controllers.subject_controller import subject_bp
from app.controllers.topic_controller import topic_bp
from app.controllers.note_controller import note_bp
from app.controllers.handwritten_note_controller import (handwritten_note_bp)
from app.controllers.video_controller import admin_video_bp, video_bp
from app.controllers.study_material_controller import study_material_bp
from app.controllers.previous_year_pdf_controller import previous_year_pdf_bp
from app.controllers.question_controller import question_bp
from app.controllers.test_controller import student_test_bp, test_bp
from app.controllers.physical_training_controller import physical_training_bp
from app.controllers.student_performance_controller import (
    student_performance_bp
)
from app.controllers.ai_assistant_controller import ai_assistant_bp
from app.controllers.notification_controller import (
    admin_notification_bp,
    student_notification_bp,
)
from app.controllers.current_affair_controller import current_affair_bp
from app.controllers.recruitment_notice_controller import recruitment_notice_bp
from app.controllers.site_content_controller import site_content_bp
from app.utils.profile_photo_storage import get_profile_photo_directory
from app.swagger import swagger_bp


@jwt.unauthorized_loader
def _log_missing_jwt(reason):
    current_app.logger.info("JWT authorization rejected: credentials missing or invalid.")
    return jsonify(msg=reason), 401


@jwt.invalid_token_loader
def _log_invalid_jwt(reason):
    current_app.logger.info("JWT authorization rejected: token invalid.")
    return jsonify(msg=reason), 422


@jwt.expired_token_loader
def _log_expired_jwt(_jwt_header, _jwt_payload):
    current_app.logger.info("JWT authorization rejected: token expired.")
    return jsonify(msg="Token has expired"), 401


@jwt.revoked_token_loader
def _log_revoked_jwt(_jwt_header, _jwt_payload):
    current_app.logger.info("JWT authorization rejected: token revoked.")
    return jsonify(msg="Token has been revoked"), 401


@jwt.needs_fresh_token_loader
def _log_non_fresh_jwt(_jwt_header, _jwt_payload):
    current_app.logger.info("JWT authorization rejected: fresh token required.")
    return jsonify(msg="Fresh token required"), 401


def create_app():

    app = Flask(__name__)

    # Configuration
    app.config.from_object(Config)
    configure_logging(app)
    validate_production_config(app.config)
    validate_sms_config(app.config)

    trusted_proxy_hops = app.config["TRUSTED_PROXY_HOPS"]
    if trusted_proxy_hops < 0:
        raise ValueError("TRUSTED_PROXY_HOPS must not be negative.")
    if trusted_proxy_hops:
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=trusted_proxy_hops)

    @app.before_request
    def assign_request_id():
        request_id = uuid4().hex
        g.request_id = request_id
        request.environ["police_bharti.request_id"] = request_id

    @app.after_request
    def attach_request_id(response):
        response.headers["X-Request-ID"] = getattr(g, "request_id", "-")
        return response

    @app.errorhandler(Exception)
    def handle_unexpected_exception(error):
        if isinstance(error, HTTPException):
            return error
        current_app.logger.exception("Unhandled request exception.")
        return jsonify(
            success=False,
            message="An unexpected server error occurred.",
        ), 500

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Development defaults are local Vite only; production origins must be explicit.
    CORS(
        app,
        origins=app.config["CORS_ORIGINS"],
        expose_headers=["X-Request-ID"],
        allow_headers=[
            "Accept",
            "Authorization",
            "Content-Type",
            "X-Upload-Request-ID",
        ],
        methods=["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        supports_credentials=False,
        vary_header=True,
    )

    # Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(student_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(student_profile_bp)
    app.register_blueprint(subject_bp)
    app.register_blueprint(topic_bp)
    app.register_blueprint(note_bp)
    app.register_blueprint(handwritten_note_bp)
    app.register_blueprint(video_bp)
    app.register_blueprint(admin_video_bp)
    app.register_blueprint(study_material_bp)
    app.register_blueprint(previous_year_pdf_bp)
    app.register_blueprint(question_bp)
    app.register_blueprint(test_bp)
    app.register_blueprint(student_test_bp)
    app.register_blueprint(physical_training_bp)
    app.register_blueprint(student_performance_bp)
    app.register_blueprint(ai_assistant_bp)
    app.register_blueprint(student_notification_bp)
    app.register_blueprint(admin_notification_bp)
    app.register_blueprint(current_affair_bp)
    app.register_blueprint(recruitment_notice_bp)
    app.register_blueprint(site_content_bp)
    if app.config.get("SWAGGER_ENABLED", False):
        app.register_blueprint(swagger_bp)

    @app.get("/uploads/profile_photos/<filename>")
    def serve_profile_photo(filename):
        return send_from_directory(
            get_profile_photo_directory(),
            filename
        )

    @app.get("/")
    def home():
        return {
            "success": True,
            "message": "Police Bharti Platform API is running"
        }

    @app.get("/api")
    def api_home():
        return {
            "success": True,
            "message": "Police Bharti Platform API",
            "version": "1.0.0"
        }

    return app
