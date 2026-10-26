# Public content service

Run with Node 22+: `npm start`. Test: `npm test`. Port defaults to 8080.

`GET /healthz` is liveness. `GET /v1/announcement` returns validated published announcement fields. Expired, sample and disabled announcements are hidden. Reads the JSON file on every request; responses may cache for 60 seconds. Missing or malformed content returns 503. No database or authentication is claimed: this service deliberately has no write endpoints yet.

Settings: `PORT`, `CONTENT_FILE` (absolute path to read-only JSON), `PUBLIC_SITE_ORIGIN` (one allowed browser origin). CORS does not authenticate users. This endpoint is intentionally public and must contain no secrets.

Build: `docker build -t plp-content .`. Run: `docker run --rm -p 8080:8080 -e PUBLIC_SITE_ORIGIN=http://localhost:5174 plp-content`.

Update announcement.json via a controlled deployment or read-only mounted file. Existing MIS demo admin changes do not reach this service. See ../../docs/production-roadmap.md for authenticated production content management and PostgreSQL migration.

## Database-backed publishing

In the deployment stack, `PLATFORM_URL=http://platform:8082` makes this service read published announcement data from the authenticated platform’s public read endpoint. Administrators edit content in `system/`. The existing local JSON mode remains available when the backend is not running. An unavailable upstream returns 503 rather than publishing demo content.
