# Local Development Subject and Topic Data

The canonical Police Bharti subjects and Marathi topic names are defined in
`backend/seed_subjects.py`. After applying the database migrations, run the
idempotent seed from the backend directory:

```powershell
.\venv\Scripts\python.exe seed_subjects.py
```

The script runs only when `APP_ENV=development`, `DATABASE_URL` points to local
MySQL database `police_bharti_db`, and `ADMIN_BOOTSTRAP_ENABLED` is disabled.
It creates missing canonical subjects and topics in one transaction, retaining
existing descriptions, active flags, and unrelated records. It refuses to
proceed if unexpected or duplicate subject/topic data prevents the required
9-subject, 90-topic final state; it does not delete those records.

Successful completion verifies exactly 9 subjects and 10 topics per subject
(90 total). Running the command again should report zero newly created
records.
