"""Load and validate the controller-owned OpenAPI fragments."""

import inspect
import json
import re
from pathlib import Path

from flask import Flask

from app.swagger.config import (
    CONTROLLER_DOCUMENTS_DIR,
    CONTROLLER_SOURCE_DIR,
    OPENAPI_VERSION,
    ROUTE_METHODS,
    SUPPORTED_COMPONENT_SECTIONS,
    SUPPORTED_METHODS,
)


class SwaggerDocumentationError(RuntimeError):
    """Raised when file-backed API documentation is incomplete or inconsistent."""


def _unique_object(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise SwaggerDocumentationError(f"Duplicate JSON object key: {key}")
        result[key] = value
    return result


def _read_json(path):
    try:
        with path.open("r", encoding="utf-8") as document_file:
            return json.load(document_file, object_pairs_hook=_unique_object)
    except SwaggerDocumentationError:
        raise
    except (OSError, json.JSONDecodeError) as error:
        raise SwaggerDocumentationError(
            f"Unable to load Swagger document '{path.name}': {error}"
        ) from error


def _normalized_path(rule):
    return re.sub(r"<(?:(\w+):)?(\w+)>", r"{\2}", rule)


def _document_for_view(view):
    try:
        source_path = Path(inspect.getsourcefile(inspect.unwrap(view))).resolve()
    except (OSError, TypeError) as error:
        raise SwaggerDocumentationError(
            f"Cannot identify the source module for registered route '{view.__name__}'."
        ) from error

    if source_path.parent == CONTROLLER_SOURCE_DIR.resolve():
        return f"{source_path.stem}.json"
    return "system_routes.json"


def _registered_operations(app):
    operations = {}
    controllers_with_routes = set()

    for rule in app.url_map.iter_rules():
        if rule.endpoint.startswith(("static", "swagger.")):
            continue
        document_name = _document_for_view(app.view_functions[rule.endpoint])
        if document_name != "system_routes.json":
            controllers_with_routes.add(document_name)
        path = _normalized_path(rule.rule)

        for method in sorted(item.lower() for item in rule.methods):
            if method not in ROUTE_METHODS:
                continue
            operation_key = (path, method)
            if operation_key in operations:
                previous = operations[operation_key]["endpoint"]
                raise SwaggerDocumentationError(
                    f"Registered route collision at {method} {path}: "
                    f"'{previous}' and '{rule.endpoint}'."
                )
            operations[operation_key] = {
                "endpoint": rule.endpoint,
                "document": document_name,
            }

    source_documents = {
        f"{source.stem}.json"
        for source in CONTROLLER_SOURCE_DIR.glob("*.py")
        if source.name != "__init__.py"
    }
    missing_route_modules = source_documents - controllers_with_routes
    if missing_route_modules:
        raise SwaggerDocumentationError(
            "Controller modules have no registered documented routes: "
            + ", ".join(sorted(missing_route_modules))
        )
    return operations, source_documents


def _json_pointer(document, pointer):
    if pointer == "#":
        return document
    if not pointer.startswith("#/"):
        raise KeyError(pointer)
    value = document
    for raw_part in pointer[2:].split("/"):
        part = raw_part.replace("~1", "/").replace("~0", "~")
        if isinstance(value, list):
            value = value[int(part)]
        else:
            value = value[part]
    return value


def _validate_references(document):
    def visit(value):
        if isinstance(value, dict):
            reference = value.get("$ref")
            if reference is not None:
                if not isinstance(reference, str) or not reference.startswith("#"):
                    raise SwaggerDocumentationError(
                        f"Unsupported external or malformed OpenAPI reference: {reference!r}"
                    )
                try:
                    _json_pointer(document, reference)
                except (KeyError, IndexError, ValueError, TypeError) as error:
                    raise SwaggerDocumentationError(
                        f"Unresolved OpenAPI reference: {reference}"
                    ) from error
            for child in value.values():
                visit(child)
        elif isinstance(value, list):
            for child in value:
                visit(child)

    visit(document)


def _merge_components(target, incoming, source_name):
    if not isinstance(incoming, dict):
        raise SwaggerDocumentationError(
            f"The components section in '{source_name}' must be an object."
        )
    for section, entries in incoming.items():
        if section not in SUPPORTED_COMPONENT_SECTIONS:
            raise SwaggerDocumentationError(
                f"Unsupported OpenAPI components section '{section}' in '{source_name}'."
            )
        if not isinstance(entries, dict):
            raise SwaggerDocumentationError(
                f"The '{section}' component section in '{source_name}' must be an object."
            )
        target_section = target.setdefault(section, {})
        collisions = set(target_section).intersection(entries)
        if collisions:
            raise SwaggerDocumentationError(
                f"Component name collision in '{section}' from '{source_name}': "
                + ", ".join(sorted(collisions))
            )
        target_section.update(entries)


def build_openapi_spec(app: Flask, documentation_root=None):
    """Merge shared definitions and per-controller path fragments.

    The optional root exists to let tests validate malformed, missing, and
    conflicting fragment sets without changing the checked-in documentation.
    """
    documents_dir = Path(documentation_root or CONTROLLER_DOCUMENTS_DIR).resolve()
    common_path = documents_dir.parent / "schemas" / "common.json"
    common = _read_json(common_path)
    if not isinstance(common, dict):
        raise SwaggerDocumentationError("Shared OpenAPI document must be a JSON object.")
    if common.get("openapi") != OPENAPI_VERSION:
        raise SwaggerDocumentationError(
            f"Shared OpenAPI version must be {OPENAPI_VERSION}."
        )
    if not isinstance(common.get("info"), dict) or not isinstance(common["info"].get("title"), str) or not isinstance(common["info"].get("version"), str):
        raise SwaggerDocumentationError(
            "Shared OpenAPI document must include info.title and info.version strings."
        )
    if not isinstance(common.get("servers"), list):
        raise SwaggerDocumentationError("Shared OpenAPI document must include a servers array.")
    if not isinstance(common.get("components"), dict):
        raise SwaggerDocumentationError("Shared OpenAPI document must include a components object.")

    registered, controller_documents = _registered_operations(app)
    expected_documents = set(controller_documents)
    if any(info["document"] == "system_routes.json" for info in registered.values()):
        expected_documents.add("system_routes.json")
    if not documents_dir.is_dir():
        raise SwaggerDocumentationError(
            f"Controller documentation directory is missing: {documents_dir}"
        )

    actual_documents = {path.name for path in documents_dir.glob("*.json")}
    missing_documents = expected_documents - actual_documents
    extra_documents = actual_documents - expected_documents
    if missing_documents or extra_documents:
        details = []
        if missing_documents:
            details.append("missing: " + ", ".join(sorted(missing_documents)))
        if extra_documents:
            details.append("unexpected: " + ", ".join(sorted(extra_documents)))
        raise SwaggerDocumentationError(
            "Controller documentation files do not match registered source modules ("
            + "; ".join(details)
            + ")."
        )

    components = {}
    _merge_components(components, common["components"], common_path.name)
    paths = {}
    documented_operations = {}

    for document_name in sorted(expected_documents):
        document_path = documents_dir / document_name
        fragment = _read_json(document_path)
        if not isinstance(fragment, dict) or not isinstance(fragment.get("paths"), dict):
            raise SwaggerDocumentationError(
                f"Controller fragment '{document_name}' must contain a paths object."
            )
        expected_label = (
            "Flask application factory routes"
            if document_name == "system_routes.json"
            else document_name.removesuffix(".json") + ".py"
        )
        if fragment.get("x-source-module") != expected_label:
            raise SwaggerDocumentationError(
                f"Controller fragment '{document_name}' has an inconsistent x-source-module."
            )
        if "components" in fragment:
            _merge_components(components, fragment["components"], document_name)

        for path, path_item in fragment["paths"].items():
            if not isinstance(path, str) or not path.startswith("/"):
                raise SwaggerDocumentationError(
                    f"Invalid OpenAPI path key in '{document_name}': {path!r}."
                )
            if not isinstance(path_item, dict):
                raise SwaggerDocumentationError(
                    f"Path item '{path}' in '{document_name}' must be an object."
                )
            operations_in_path = {
                key: value for key, value in path_item.items() if key.lower() in SUPPORTED_METHODS
            }
            if not operations_in_path:
                raise SwaggerDocumentationError(
                    f"Path item '{path}' in '{document_name}' has no HTTP operations."
                )
            merged_item = paths.setdefault(path, {})
            for method, operation in operations_in_path.items():
                method = method.lower()
                if method not in ROUTE_METHODS:
                    continue
                if method in merged_item:
                    raise SwaggerDocumentationError(
                        f"Duplicate documentation for {method.upper()} {path} "
                        f"in '{document_name}'."
                    )
                merged_item[method] = operation
                documented_operations[(path, method)] = document_name

    missing_operations = set(registered) - set(documented_operations)
    unexpected_operations = set(documented_operations) - set(registered)
    if missing_operations or unexpected_operations:
        details = []
        if missing_operations:
            details.append(
                "missing: "
                + ", ".join(f"{method.upper()} {path}" for path, method in sorted(missing_operations))
            )
        if unexpected_operations:
            details.append(
                "unregistered: "
                + ", ".join(f"{method.upper()} {path}" for path, method in sorted(unexpected_operations))
            )
        raise SwaggerDocumentationError(
            "Controller documentation does not match Flask routes (" + "; ".join(details) + ")."
        )

    operation_ids = set()
    for key, route_info in registered.items():
        path, method = key
        operation = paths[path][method]
        expected_id = route_info["endpoint"].replace(".", "_") + "_" + method
        operation_id = operation.get("operationId")
        if operation_id != expected_id:
            raise SwaggerDocumentationError(
                f"Operation ID mismatch for {method.upper()} {path}: "
                f"expected '{expected_id}', found {operation_id!r}."
            )
        if operation_id in operation_ids:
            raise SwaggerDocumentationError(f"Duplicate operationId: {operation_id}")
        operation_ids.add(operation_id)
        documented_source = documented_operations[key]
        if documented_source != route_info["document"]:
            raise SwaggerDocumentationError(
                f"{method.upper()} {path} belongs in '{route_info['document']}', "
                f"not '{documented_source}'."
            )

    spec = {
        "openapi": common["openapi"],
        "info": common["info"],
        "servers": common["servers"],
        "tags": [
            {"name": tag}
            for tag in sorted(
                {
                    tag
                    for item in paths.values()
                    for operation in item.values()
                    for tag in operation.get("tags", [])
                    if isinstance(tag, str)
                }
            )
        ],
        "paths": paths,
        "components": components,
    }
    _validate_references(spec)
    return spec
