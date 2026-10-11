# Production deployment runbook

This document describes deployment configuration for the existing Flask API and Vite frontend. No deployment has been performed or tested. Choose a production domain and hosting platform before applying the examples; `example.com` values below are placeholders.

## Deployment shape

The frontend calls the API under `/api`. The API also serves profile photos under `/uploads/profile_photos/`. A same-origin reverse proxy can route `/api` and `/uploads` to Flask and serve the Vite `dist` files. If frontend and API use different origins, set `VITE_API_BASE_URL` to the API URL and set `CORS_ORIGINS` to the exact frontend origin. Do not use wildcard origins.

The current backend requirements do not include a production WSGI server. For a Linux/container deployment, Gunicorn is the recommended option; provide it in the deployment image or platform environment, then run from `backend`:

```sh
gunicorn --workers 3 --bind 127.0.0.1:8000 'app:create_app()'
```

For a production Windows host, use Waitress instead, supplied by that deployment environment:

```powershell
waitress-serve --listen=127.0.0.1:8000 --call app:create_app
```

The deployment operating system is not specified by the project. Do not use `python run.py` or Flask's development server as the production service.

## Required configuration

Set backend variables in the hosting platform's secret/configuration store. Do not commit `.env` files or put credentials in the frontend environment.

| Variable | Required production value | Notes |
|---|---|---|
| `APP_ENV` | `production` | Forces `DEBUG` off. |
| `APP_DEBUG` | `false` | Debug is opt-in and ignored in production. |
| `DATABASE_URL` | Private production database URL | The installed backend includes PyMySQL. For MySQL/MariaDB, use a protected URL such as `mysql+pymysql://USER:PASSWORD@DB_HOST:3306/DB_NAME?charset=utf8mb4`. URL-encode credentials. |
| `JWT_SECRET_KEY` | Random secret of at least 32 bytes | Keep it in the backend secret store and keep it stable across service instances. Never place it in Vite variables. |
| `CORS_ORIGINS` | Comma-separated exact origins | Example placeholder: `https://app.example.com`. Include scheme and optional port only; no paths or wildcard. Production startup fails if this is missing or invalid. |
| `UPLOAD_ROOT` | Persistent writable directory | All locally stored profile photos, team photos, Current Affairs images, PDFs, materials, and videos use subdirectories here. Default is `backend/uploads`; production should use a persistent mounted volume. |
| `FRONTEND_BASE_URL` | Public frontend origin | Used to create links in existing email notifications. |

Production startup validates `DATABASE_URL` and `JWT_SECRET_KEY` before initializing database services. `DATABASE_URL` must be a configured `mysql+pymysql` URL with a host and database name; production SQLite URLs and obvious placeholder URLs are rejected. `JWT_SECRET_KEY` must contain at least 32 UTF-8 bytes and must not be blank or an obvious example/default value. Startup fails with a setting-specific error when either value is invalid, without including the supplied value in the error. This length check does not establish randomness: generate a strong random secret and provide it through the hosting platform's secret manager or another secure configuration mechanism. Never commit secrets or put them in frontend `VITE_*` variables.

`VIDEO_UPLOAD_DIRECTORY` is optional and overrides only the videos directory. The per-file defaults are 20 MiB for study and previous-year PDFs, 5 MiB for Current Affairs images and team photos, and 200 MiB for videos. The matching environment variables are `STUDY_MATERIAL_MAX_FILE_SIZE`, `PREVIOUS_YEAR_PDF_MAX_FILE_SIZE`, `CURRENT_AFFAIR_IMAGE_MAX_FILE_SIZE`, `TEAM_MEMBER_PHOTO_MAX_FILE_SIZE`, and `MAX_VIDEO_SIZE_MB`. Configure the reverse proxy's request-body limit to permit the largest intended video plus multipart overhead.

The public contact form enforces five submissions per client IP in a rolling 60-second window using the shared database. It stores only a keyed hash of the peer IP and attempt timestamps. Apply migration `c5a7e2149d63` before serving contact submissions with this release; if rate-limit storage is unavailable, the endpoint fails closed with HTTP 503. `TRUSTED_PROXY_HOPS` defaults to `0`, so forwarded headers are ignored. If Flask is reachable only through a known, trusted reverse-proxy chain, set this to the exact number of trusted proxies after configuring the proxy to overwrite or safely append `X-Forwarded-For`. Keep the WSGI listener private; never trust forwarded headers from direct clients.

Email delivery is optional. To enable the existing email notifications, set `MAIL_ENABLED=true`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_FROM`, and the applicable TLS settings. If SMTP authentication is used, set both `MAIL_USERNAME` and `MAIL_PASSWORD` in the backend secret store. `MAIL_USE_TLS` defaults to true and `MAIL_TIMEOUT` defaults to 10 seconds. Leave `MAIL_ENABLED=false` if email is not configured.

SMS notifications are disabled by default (`SMS_ENABLED=false`). The project currently includes a provider interface and a mock adapter for tests/local development only; no real SMS vendor is selected or integrated. `SMS_PROVIDER=mock` is accepted only outside production and never contacts a carrier. Production startup rejects the mock and any provider name without an installed adapter. Do not set `SMS_ENABLED=true` in production until a vendor is selected, its documented adapter and credentials are added to the secret store, and its sender registration requirements are met. Do not add provider credentials to `.env.example` or frontend variables.

Students opt in separately under Notifications; consent defaults off. SMS is limited to new test notices, result availability, and admin announcements explicitly marked for SMS. Recipients must be active students with a valid existing 10-digit mobile number. Numbers are not rewritten or given an assumed country code. Templates contain the event and title only, not the notification body, scores, passwords, or other private data. India-specific sender IDs, DLT registration, and approved templates depend on the eventual vendor and must be completed for that vendor before sending.

SMS dispatch is best effort and does not change in-app or email notification outcomes. Provider adapters should classify timeouts, rate limits, and server errors as transient, and authentication or other permanent client errors as permanent; only transient errors receive at most `SMS_MAX_ATTEMPTS` attempts (default 3, maximum 5). Each event has a persistent per-student idempotency record. `ACCEPTED` means the provider accepted the API request, not that the handset received the SMS; no delivery callback is configured. A real adapter must use the supplied idempotency key for its supported deduplication semantics, especially for ambiguous timeouts. Timeout defaults to `SMS_REQUEST_TIMEOUT=5` seconds (maximum 60).

## Build the frontend

Vite substitutes `VITE_API_BASE_URL` into the bundle at build time. It is public configuration, not a secret. Production builds fail when it is absent, points at localhost, or uses plain HTTP. Use a relative path when a same-origin proxy routes `/api`, or a full HTTPS API URL for a separate API origin.

Example same-origin build from `frontend`:

```sh
VITE_API_BASE_URL=/api npm run build
```

Example separate-origin build:

```sh
VITE_API_BASE_URL=https://api.example.com/api npm run build
```

On PowerShell, set it for the build process with `$env:VITE_API_BASE_URL='/api'; npm.cmd run build`. Do not add API credentials or other secrets to a `VITE_*` variable; bundled values are visible to every site visitor.

## Provision and start the backend

1. Provision a private database and persistent media volume. Restrict database network access to the API service.
2. Supply the required backend variables securely. Keep production `APP_ENV=production`; do not set `APP_DEBUG=true`.
3. Install the existing backend requirements in the deployment environment with `python -m pip install -r requirements.txt`. Also provide the chosen WSGI server package in that environment; it is intentionally not added to this project's dependencies.
4. Build the frontend with the chosen `VITE_API_BASE_URL` and serve the resulting `frontend/dist` directory from the frontend host or reverse proxy.
5. Start the WSGI command above under a process supervisor. Bind the WSGI server to loopback or a private interface behind TLS termination; do not expose the WSGI port publicly.
6. Configure the reverse proxy to route `/api/` and `/uploads/profile_photos/` to Flask. Serve other frontend paths with the SPA fallback to `index.html`. Set request-body limits to match the enabled upload limits.

## Migrations

The established Flask-Migrate workflow is run from `backend` against the intended database:

```sh
flask --app run db upgrade
```

Review existing migration revisions and back up the database before applying them. Run migrations once as a controlled release step, not concurrently in every worker startup. Do not use `db.create_all()` as a production schema-management substitute.

The shared contact-form limiter requires migration `c5a7e2149d63` (based on `b8911ca2a320`). SMS preferences and delivery idempotency require migration `e70c8a4d2f19`, which follows `c5a7e2149d63`. Apply both in order through the same controlled migration workflow before deploying code that uses them; until the contact table exists, contact submissions fail closed with HTTP 503. Do not apply either migration automatically at service startup.

## Media persistence and access

Mount the same persistent `UPLOAD_ROOT` for every API instance that serves or stores media. A container's writable layer is not persistent. Confirm the service account can create, read, and remove files in that volume, and include the volume in the backup plan. Do not expose the upload root as a public static directory: the existing API routes enforce access for protected media, while active public team photos and profile photo URLs follow their existing route behavior.

## Logs, health, and operations

Flask and application loggers write through Python logging to the process stream. Capture stdout/stderr with the hosting platform or service manager, restrict log access, rotate/retain logs, and alert on repeated 5xx responses or storage/database errors. Unexpected registration/login/profile exceptions are logged server-side; production responses omit exception details.

The API exposes `/` and `/api` status responses. Use an external health check against `/` and separately monitor database connectivity and a representative authenticated workflow; the root response alone does not prove database readiness.

## Backups and recovery

1. Take consistent, encrypted database backups using the database provider's supported backup/snapshot procedure.
2. Back up the complete `UPLOAD_ROOT` volume and any separately configured `VIDEO_UPLOAD_DIRECTORY`.
3. Store backups separately from the running service, define retention and access controls, and record which application release/migration revision each backup matches.
4. Test restoring both the database and media into an isolated environment before relying on the recovery plan. Coordinate database and media restore points so records do not refer to missing files.
5. Before schema upgrades, confirm a recent recoverable backup and a rollback/recovery procedure.

## Post-deployment verification

- Confirm `/` and `/api` respond through the intended public routing.
- Confirm the frontend bundle calls the configured `/api` address and that no browser request targets localhost.
- Confirm the production CORS origin allows the frontend origin and rejects an unrelated origin. Verify preflight includes `Authorization`, `Content-Type`, `Accept`, and `X-Upload-Request-ID`.
- Exercise login, token refresh, and one role-protected endpoint with test accounts.
- Upload and retrieve an allowed image, PDF, and video using test content; confirm files remain available after a service restart or release replacement.
- Confirm email delivery only if SMTP was configured; inspect server logs without exposing credentials.
- Verify the deployed database migration revision and perform a documented backup restore test.

These steps are operational checks for the deployment team; they have not been run against a production environment as part of this code change.
