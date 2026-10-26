# PLP platform API

Node 22+, PostgreSQL 17+, `npm ci`. Set `DATABASE_URL`, `APP_ORIGIN` and other values from `.env.example` in the process environment. Never use Vite variables for secrets.

Run `npm run migrate`, then `npm start`. Migrations are versioned and serialized with an advisory lock. Set `APP_DB_PASSWORD` only for the privileged deployment migration process to create/update the restricted runtime role. Bootstrap an administrator with `npm run bootstrap-admin` using environment values described in the [deployment guide](../../docs/production-roadmap.md).

`npm test` runs policy tests. Set `TEST_DATABASE_URL` to a **dedicated database whose name ends in `_test`** to also run integration tests. Migrate that database first by setting `DATABASE_URL` to the same URL. Tests write fixtures. Set `CREDENTIAL_URL` when also checking real PDF downloads.

The public routes are `/healthz`, `/public/announcement` and `/public/certificates/:id`. Everything else except login/registration/recovery requires a valid database session. HTTP responses never include password hashes or assessment answers for learners. Records currently return up to 500 entries, with access filtering in SQL before the limit; pagination is a scale-up task.

See [production-roadmap.md](../../docs/production-roadmap.md) for deployment, service boundaries, backups, recovery and the explicit limits of the initial workflow migration.
