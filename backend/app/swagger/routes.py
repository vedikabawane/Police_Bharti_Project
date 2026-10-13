from flask import abort, current_app, jsonify, render_template

from app.swagger import swagger_bp
from app.swagger.specification import build_openapi_spec


@swagger_bp.before_request
def require_swagger_enabled():
    if not current_app.config.get("SWAGGER_ENABLED", False):
        abort(404)


@swagger_bp.get("")
def swagger_ui():
    return render_template("swagger_ui.html", spec_url="/api/docs/openapi.json")


@swagger_bp.get("/openapi.json")
def openapi_document():
    return jsonify(build_openapi_spec(current_app))
