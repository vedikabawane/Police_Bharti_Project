import inspect
import json
import re
import shutil
import tempfile
import unittest
from pathlib import Path

from app import create_app
from app.swagger.specification import (
    SwaggerDocumentationError,
    build_openapi_spec,
)


BACKEND_ROOT = Path(__file__).resolve().parents[1]
SWAGGER_ROOT = BACKEND_ROOT / "app" / "swagger"
CONTROLLER_SOURCE_DIR = BACKEND_ROOT / "app" / "controllers"
DOCS_DIR = SWAGGER_ROOT / "controllers"
SCHEMAS_DIR = SWAGGER_ROOT / "schemas"


class SwaggerSpecificationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.app = create_app()
        cls.client = cls.app.test_client()

    def _copy_documents(self):
        temporary = tempfile.TemporaryDirectory()
        root = Path(temporary.name)
        shutil.copytree(DOCS_DIR, root / "controllers")
        shutil.copytree(SCHEMAS_DIR, root / "schemas")
        self.addCleanup(temporary.cleanup)
        return root / "controllers"

    def _read_fragment(self, docs_dir, name):
        path = docs_dir / name
        return path, json.loads(path.read_text(encoding="utf-8"))

    def _write_fragment(self, path, fragment):
        path.write_text(json.dumps(fragment, indent=2) + "\n", encoding="utf-8")

    def test_every_controller_module_has_its_own_fragment(self):
        source_modules = {
            f"{path.stem}.json"
            for path in CONTROLLER_SOURCE_DIR.glob("*.py")
            if path.name != "__init__.py"
        }
        self.assertEqual(source_modules, {path.name for path in DOCS_DIR.glob("*.json")} - {"system_routes.json"})
        spec = build_openapi_spec(self.app)
        route_documents = set()
        for rule in self.app.url_map.iter_rules():
            if rule.endpoint.startswith(("static", "swagger.")):
                continue
            source = Path(inspect.getsourcefile(inspect.unwrap(self.app.view_functions[rule.endpoint]))).resolve()
            route_documents.add(
                f"{source.stem}.json" if source.parent == CONTROLLER_SOURCE_DIR.resolve() else "system_routes.json"
            )
        self.assertTrue(route_documents.issubset({path.name for path in DOCS_DIR.glob("*.json")}))
        self.assertIn("system_routes.json", route_documents)
        self.assertEqual(120, len(spec["paths"]))
        self.assertEqual(159, sum(len(path_item) for path_item in spec["paths"].values()))

    def test_merge_route_parity_ids_references_and_jwt_configuration(self):
        spec = build_openapi_spec(self.app)
        actual = set()
        for rule in self.app.url_map.iter_rules():
            if rule.endpoint.startswith(("static", "swagger.")):
                continue
            path = re.sub(r"<(?:(\w+):)?(\w+)>", r"{\2}", rule.rule)
            for method in rule.methods - {"HEAD", "OPTIONS"}:
                actual.add((path, method.lower()))
        documented = {
            (path, method)
            for path, path_item in spec["paths"].items()
            for method in path_item
        }
        self.assertEqual(actual, documented)
        operation_ids = [
            operation["operationId"]
            for path_item in spec["paths"].values()
            for operation in path_item.values()
        ]
        self.assertEqual(len(operation_ids), len(set(operation_ids)))
        operations = [
            operation
            for path_item in spec["paths"].values()
            for operation in path_item.values()
        ]
        self.assertTrue(all(operation.get("responses") for operation in operations))
        self.assertGreater(sum("requestBody" in operation for operation in operations), 0)
        self.assertGreater(
            sum("binary" in json.dumps(operation.get("responses", {})) for operation in operations),
            0,
        )
        tag_names = {tag["name"] for tag in spec["tags"]}
        self.assertTrue(
            all(
                tag in tag_names
                for path_item in spec["paths"].values()
                for operation in path_item.values()
                for tag in operation.get("tags", [])
            )
        )
        self.assertEqual(
            {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"},
            {
                key: spec["components"]["securitySchemes"]["bearerAuth"][key]
                for key in ("type", "scheme", "bearerFormat")
            },
        )
        self.assertEqual(
            "#/components/schemas/RegisterResponse",
            spec["paths"]["/api/auth/register"]["post"]["responses"]["201"]["content"]["application/json"]["schema"]["$ref"],
        )
        self.assertNotIn("/api/auth/registration-options", spec["paths"])
        self.assertNotIn("/api/auth/register/otp", spec["paths"])
        self.assertNotIn("/api/auth/register/otp/verify", spec["paths"])

        def check_references(value):
            if isinstance(value, dict):
                reference = value.get("$ref")
                if reference:
                    self.assertTrue(reference.startswith("#/"), reference)
                    cursor = spec
                    for part in reference[2:].split("/"):
                        cursor = cursor[part.replace("~1", "/").replace("~0", "~")]
                for child in value.values():
                    check_references(child)
            elif isinstance(value, list):
                for child in value:
                    check_references(child)

        check_references(spec)

    def test_specific_response_contracts_and_access_refresh_security(self):
        spec = build_openapi_spec(self.app)
        self.assertEqual(120, len(spec["paths"]))
        self.assertEqual(159, sum(len(item) for item in spec["paths"].values()))

        registration = spec["paths"]["/api/auth/register"]["post"]
        registration_schema = spec["components"]["schemas"]["Register"]
        self.assertEqual(
            {"name", "email", "mobile", "password"},
            set(registration_schema["required"]),
        )
        self.assertIn("APP_ENV=development", registration["description"])
        self.assertIn("503", registration["responses"])
        self.assertEqual(
            {"name", "email", "mobile", "password"},
            set(registration_schema["properties"]),
        )
        for schema_name in (
            "RegistrationOptionsResponse",
            "RegistrationOtpRequestResult",
            "RegistrationOtpVerificationResult",
            "OtpRequestResponse",
            "OtpVerificationResponse",
            "RegisterOtpRequest",
            "VerifyOtp",
        ):
            self.assertNotIn(schema_name, spec["components"]["schemas"])

        # Every serializer-backed JSON success response now has a typed schema.
        for path_item in spec["paths"].values():
            for operation in path_item.values():
                for status, response in operation.get("responses", {}).items():
                    if not status.startswith("2"):
                        continue
                    schema = response.get("content", {}).get("application/json", {}).get("schema", {})
                    self.assertNotEqual("#/components/schemas/GenericSuccess", schema.get("$ref"))

        self.assertEqual(
            "#/components/schemas/StudentTestsResponse",
            spec["paths"]["/api/student/tests"]["get"]["responses"]["200"]["content"]["application/json"]["schema"]["$ref"],
        )
        self.assertEqual(
            {"page", "per_page", "search", "test_type", "subject_id", "topic_id"},
            {item["name"] for item in spec["paths"]["/api/student/tests"]["get"]["parameters"]},
        )
        self.assertEqual(
            {"bearerAuth": []},
            spec["paths"]["/api/auth/me"]["get"]["security"][0],
        )
        self.assertEqual(
            {"refreshTokenAuth": []},
            spec["paths"]["/api/auth/refresh"]["post"]["security"][0],
        )
        self.assertNotIn("/api/auth/register/otp", spec["paths"])
        self.assertIn("422", spec["paths"]["/api/auth/me"]["get"]["responses"])
        self.assertNotIn("403", spec["paths"]["/api/auth/me"]["get"]["responses"])
        self.assertIn("422", spec["paths"]["/api/student/profile"]["get"]["responses"])
        self.assertEqual(
            {"application/json", "multipart/form-data"},
            set(spec["paths"]["/api/admin/site-content/team-members"]["post"]["requestBody"]["content"]),
        )
        self.assertEqual(
            "binary",
            spec["paths"]["/api/videos/{video_id}"]["patch"]["requestBody"]["content"]["multipart/form-data"]["schema"]["properties"]["video_file"]["format"],
        )
        request_schemas = spec["components"]["schemas"]
        self.assertEqual(
            {"title", "test_type", "duration_minutes", "question_ids"},
            set(request_schemas["AdminTest"]["required"]),
        )
        self.assertNotIn("is_active", request_schemas["Subject"]["properties"])
        self.assertNotIn("subject_id", request_schemas["Topic"]["properties"])
        self.assertNotIn("question_ids", request_schemas["Test"]["properties"])
        self.assertIn("options", request_schemas["UpdateQuestion"]["properties"])
        self.assertEqual(
            {"201"},
            {code for code in spec["paths"]["/api/auth/register"]["post"]["responses"] if code.startswith("2")},
        )

    def test_role_restrictions_match_registered_route_wrappers(self):
        spec = build_openapi_spec(self.app)
        checked = 0
        for rule in self.app.url_map.iter_rules():
            if rule.endpoint.startswith(("static", "swagger.")):
                continue
            stack = [self.app.view_functions[rule.endpoint]]
            visited = set()
            roles = None
            while stack:
                current = stack.pop()
                if id(current) in visited:
                    continue
                visited.add(id(current))
                code = getattr(current, "__code__", None)
                closure = getattr(current, "__closure__", None) or ()
                if code:
                    for name, cell in zip(code.co_freevars, closure):
                        try:
                            value = cell.cell_contents
                        except ValueError:
                            continue
                        if name == "allowed_roles" and isinstance(value, tuple):
                            roles = set(value)
                        if callable(value) and hasattr(value, "__code__"):
                            stack.append(value)
                wrapped = getattr(current, "__wrapped__", None)
                if callable(wrapped):
                    stack.append(wrapped)
            if roles is None:
                continue
            path = re.sub(r"<(?:(\w+):)?(\w+)>", r"{\2}", rule.rule)
            expected = " and ".join(role for role in ("student", "admin") if role in roles)
            for method in rule.methods - {"HEAD", "OPTIONS"}:
                description = spec["paths"][path][method.lower()]["description"]
                self.assertIn(f"Access: {expected}.", description, rule.endpoint)
            checked += 1
        self.assertGreater(checked, 0)

    def test_missing_controller_file_is_rejected(self):
        docs_dir = self._copy_documents()
        (docs_dir / "admin_controller.json").unlink()
        with self.assertRaisesRegex(SwaggerDocumentationError, "missing: admin_controller.json"):
            build_openapi_spec(self.app, docs_dir)

    def test_unregistered_fragment_is_rejected(self):
        docs_dir = self._copy_documents()
        (docs_dir / "made_up_controller.json").write_text(
            json.dumps({"x-source-module": "made_up_controller.py", "paths": {}}),
            encoding="utf-8",
        )
        with self.assertRaisesRegex(SwaggerDocumentationError, "unexpected: made_up_controller.json"):
            build_openapi_spec(self.app, docs_dir)

    def test_malformed_controller_file_is_rejected(self):
        docs_dir = self._copy_documents()
        (docs_dir / "admin_controller.json").write_text("{broken", encoding="utf-8")
        with self.assertRaisesRegex(SwaggerDocumentationError, "Unable to load Swagger document"):
            build_openapi_spec(self.app, docs_dir)

    def test_malformed_shared_document_is_rejected(self):
        docs_dir = self._copy_documents()
        (docs_dir.parent / "schemas" / "common.json").write_text("[]", encoding="utf-8")
        with self.assertRaisesRegex(SwaggerDocumentationError, "must be a JSON object"):
            build_openapi_spec(self.app, docs_dir)

    def test_duplicate_path_method_is_rejected(self):
        docs_dir = self._copy_documents()
        admin_path, admin = self._read_fragment(docs_dir, "admin_controller.json")
        auth_path, auth = self._read_fragment(docs_dir, "auth_controller.json")
        path, path_item = next(iter(admin["paths"].items()))
        method, operation = next(iter(path_item.items()))
        auth["paths"].setdefault(path, {})[method] = operation
        self._write_fragment(auth_path, auth)
        with self.assertRaisesRegex(SwaggerDocumentationError, "Duplicate documentation"):
            build_openapi_spec(self.app, docs_dir)

    def test_operation_cannot_be_moved_to_another_controller_fragment(self):
        docs_dir = self._copy_documents()
        auth_path, auth = self._read_fragment(docs_dir, "auth_controller.json")
        system_path, system = self._read_fragment(docs_dir, "system_routes.json")
        path, path_item = next(iter(auth["paths"].items()))
        method, operation = next(iter(path_item.items()))
        system["paths"][path] = {method: operation}
        del auth["paths"][path][method]
        if not auth["paths"][path]:
            del auth["paths"][path]
        self._write_fragment(auth_path, auth)
        self._write_fragment(system_path, system)
        with self.assertRaisesRegex(SwaggerDocumentationError, "belongs in 'auth_controller.json'"):
            build_openapi_spec(self.app, docs_dir)

    def test_component_name_collision_is_rejected(self):
        docs_dir = self._copy_documents()
        auth_path, auth = self._read_fragment(docs_dir, "auth_controller.json")
        auth["components"] = {"schemas": {"UserSummary": {"type": "object"}}}
        self._write_fragment(auth_path, auth)
        with self.assertRaisesRegex(SwaggerDocumentationError, "Component name collision"):
            build_openapi_spec(self.app, docs_dir)

    def test_unresolved_reference_is_rejected(self):
        docs_dir = self._copy_documents()
        auth_path, auth = self._read_fragment(docs_dir, "auth_controller.json")
        operation = next(iter(next(iter(auth["paths"].values())).values()))
        operation["x-invalid-reference"] = {"$ref": "#/components/schemas/NotDefined"}
        self._write_fragment(auth_path, auth)
        with self.assertRaisesRegex(SwaggerDocumentationError, "Unresolved OpenAPI reference"):
            build_openapi_spec(self.app, docs_dir)

    def test_swagger_endpoints_assets_and_disabled_behavior(self):
        ui = self.client.get("/api/docs")
        document = self.client.get("/api/docs/openapi.json")
        css = self.client.get("/api/docs/static/swagger-custom.css")
        self.addCleanup(ui.close)
        self.addCleanup(document.close)
        self.addCleanup(css.close)
        self.assertEqual(200, ui.status_code)
        self.assertTrue(ui.content_type.startswith("text/html"))
        self.assertEqual(200, document.status_code)
        self.assertTrue(document.content_type.startswith("application/json"))
        self.assertEqual("3.0.3", document.get_json()["openapi"])
        self.assertEqual(200, css.status_code)
        self.assertTrue(css.content_type.startswith("text/css"))
        html = ui.get_data(as_text=True)
        self.assertIn("swagger-ui-bundle.js", html)
        self.assertIn("/api/docs/openapi.json", html)
        self.assertIn("swagger-custom.css", html)

        self.app.config["SWAGGER_ENABLED"] = False
        for path in ("/api/docs", "/api/docs/openapi.json", "/api/docs/static/swagger-custom.css"):
            self.assertEqual(404, self.client.get(path).status_code)
        self.app.config["SWAGGER_ENABLED"] = True

    def test_examples_have_no_known_secret_or_real_data_markers(self):
        document = self.client.get("/api/docs/openapi.json").get_data(as_text=True)
        for marker in ("9876543210", "Asha Patil", "eyJhbGci", "sk_live_"):
            self.assertNotIn(marker, document)

    def test_controller_modules_contain_no_swagger_implementation(self):
        for source in CONTROLLER_SOURCE_DIR.glob("*.py"):
            if source.name == "__init__.py":
                continue
            contents = source.read_text(encoding="utf-8")
            self.assertNotIn("app.swagger", contents, source.name)


if __name__ == "__main__":
    unittest.main()
