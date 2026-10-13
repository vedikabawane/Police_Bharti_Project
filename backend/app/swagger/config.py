"""Location and validation settings for the file-backed OpenAPI documents."""

from pathlib import Path


SWAGGER_ROOT = Path(__file__).resolve().parent
CONTROLLER_DOCUMENTS_DIR = SWAGGER_ROOT / "controllers"
COMMON_DOCUMENT_PATH = SWAGGER_ROOT / "schemas" / "common.json"
CONTROLLER_SOURCE_DIR = SWAGGER_ROOT.parent / "controllers"

OPENAPI_VERSION = "3.0.3"
SUPPORTED_COMPONENT_SECTIONS = {
    "schemas",
    "responses",
    "parameters",
    "examples",
    "requestBodies",
    "headers",
    "securitySchemes",
    "links",
    "callbacks",
}
SUPPORTED_METHODS = {"get", "put", "post", "delete", "options", "head", "patch", "trace"}
ROUTE_METHODS = SUPPORTED_METHODS - {"options", "head"}
