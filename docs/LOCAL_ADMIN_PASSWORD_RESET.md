# Resetting a Local Admin Password

The backend exposes an interactive Flask CLI command for resetting the password
of an existing, active Admin account. It does not create accounts, change roles,
or use the startup Admin bootstrap.

The command is permitted only when `APP_ENV=development` and `DATABASE_URL`
points to the local MySQL database `police_bharti_db` on `localhost`,
`127.0.0.1`, or `::1`. It rejects production, remote hosts, other databases,
and missing or malformed database URLs. Tests may use an isolated SQLite
database when Flask testing mode is enabled; regular CLI use cannot.

From `C:\Webdev\police_bharti_platform\backend`, run:

```powershell
.\venv\Scripts\python.exe -m flask --app run reset-admin-password
```

The command prompts for the existing Admin email, requests the new password
twice without echoing it, and asks for final confirmation. It requires a valid
email, an existing `admin` account, and an active account. The password must
contain at least 12 characters and fit the bcrypt limit of 72 UTF-8 bytes.
Only the selected account's password hash is updated, using the application's
existing bcrypt helper and a database transaction.

The current JWT implementation does not keep a token blocklist or password
version, so a password reset does not invalidate already-issued JWTs. Normal
token expiry and authorization checks continue to apply.

This command does not print passwords or password hashes. Keep the local
database URL and all credentials out of source control.
