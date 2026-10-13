# Swagger documentation guide

The API is served from one Swagger UI at `/api/docs` and one combined OpenAPI document at `/api/docs/openapi.json`. The source documentation is split into controller JSON fragments under `backend/app/swagger/controllers/`; all shared components live in `backend/app/swagger/schemas/common.json`.

## Controller fragment map

Each fragment owns the paths and operations implemented by routes registered from the corresponding controller module. Route groups in the final UI use the operation tags shown below.

| Controller module | Swagger file | API area |
| --- | --- | --- |
| `admin_controller.py` | `admin_controller.json` | Administration |
| `ai_assistant_controller.py` | `ai_assistant_controller.json` | AI Assistant |
| `auth_controller.py` | `auth_controller.json` | Authentication, including registration OTP |
| `current_affair_controller.py` | `current_affair_controller.json` | Current Affairs |
| `handwritten_note_controller.py` | `handwritten_note_controller.json` | Handwritten Notes |
| `note_controller.py` | `note_controller.json` | Notes |
| `notification_controller.py` | `notification_controller.json` | Notifications |
| `physical_training_controller.py` | `physical_training_controller.json` | Physical Training |
| `previous_year_pdf_controller.py` | `previous_year_pdf_controller.json` | Previous Year PDFs |
| `question_controller.py` | `question_controller.json` | Questions |
| `recruitment_notice_controller.py` | `recruitment_notice_controller.json` | Recruitment Notices |
| `site_content_controller.py` | `site_content_controller.json` | Site Content and public contact routes |
| `student_controller.py` | `student_controller.json` | Student |
| `student_performance_controller.py` | `student_performance_controller.json` | Performance |
| `student_profile_controller.py` | `student_profile_controller.json` | Student Profile |
| `study_material_controller.py` | `study_material_controller.json` | Study Materials |
| `subject_controller.py` | `subject_controller.json` | Subjects |
| `test_controller.py` | `test_controller.json` | Tests and Student Tests |
| `topic_controller.py` | `topic_controller.json` | Topics |
| `video_controller.py` | `video_controller.json` | Videos and Video Administration |
| Flask application factory routes | `system_routes.json` | General (home, API index, profile photo serving) |

## Updating API documentation

1. Update the relevant controller fragment when a registered route changes. The fragment name is the controller module basename with a `.json` extension.
2. Keep each fragment's top-level `x-source-module` value equal to the controller filename. The application factory routes use the label `Flask application factory routes` in `system_routes.json`.
3. Put schemas or other reusable OpenAPI components used by multiple operations in `schemas/common.json` under `components`. Reference them with local OpenAPI references such as `#/components/schemas/SchemaName`.
4. Keep operation IDs in the format generated from the registered Flask endpoint and HTTP method. The specification loader checks IDs, route coverage, duplicate operations, duplicate component names, and local references.
5. Do not put Swagger decorators or documentation metadata into controller modules. The controller JSON is the documentation source; the generator only reads it.

When adding a controller, create `<controller_module_stem>.json` with a `paths` object and one operation for every registered path/method from that module. The loader compares the controller source files and Flask route map with the fragment set. Application-factory routes that are not owned by a controller belong in `system_routes.json`.

## Building and validating the combined document

`backend/app/swagger/specification.py` loads the shared JSON file and every expected controller fragment, merges their path operations and components, and rejects missing or extra fragments, malformed files, duplicate path/method pairs, component collisions, unresolved references, duplicate operation IDs, and route/method mismatches. `/api/docs/openapi.json` serves that combined document; the UI continues to load the same URL.

Run the focused Swagger tests from `backend`:

```powershell
$env:PYTHON_DOTENV_DISABLED = 'true'
$env:APP_ENV = 'testing'
$env:DATABASE_URL = 'sqlite://'
$env:SWAGGER_ENABLED = 'true'
.\venv\Scripts\python.exe -B -m unittest discover -s tests -p test_swagger_specification.py -v
```

The focused tests exercise documentation loading and the docs-only test client; they do not issue database queries. Compile the Swagger and focused-test Python sources without writing bytecode with:

```powershell
@'
from pathlib import Path

sources = [*Path('app/swagger').rglob('*.py'), Path('tests/test_swagger_specification.py')]
for source in sources:
    compile(source.read_text(encoding='utf-8'), str(source), 'exec')
print(f'Compiled {len(sources)} Python source files.')
'@ | .\venv\Scripts\python.exe -B -
```

## Enabling and disabling Swagger

`SWAGGER_ENABLED` accepts the usual true/false environment values. It defaults to enabled in development and testing, and disabled in production. When false, the UI, combined OpenAPI document, and Swagger static assets return 404. Production deployments should leave Swagger disabled unless the documentation endpoint is intentionally exposed and access is controlled by the deployment environment.
