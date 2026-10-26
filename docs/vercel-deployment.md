# Deploying the public website to Vercel

> **The Hub is not deployed from Vercel.** Members' workspaces need the platform API on the same origin, camera and location permissions, and uploads of up to 500 MB, which exceed Vercel's documented ~4.5 MB request limits. Deploy the Hub with `deploy/compose.yml` (see `production-roadmap.md`). Use Vercel only for a static preview or the public pages.

The checked-in `vercel.json` selects Vite, `npm run build`, and `dist`, with a React Router fallback for page URLs (excluding `/api/`). This follows Vercel's SPA guidance: https://vercel.com/kb/guide/why-is-my-deployed-project-giving-404 .

Use the repository root as the Vercel Root Directory. A matching configuration is also provided if you choose `frontend` instead. Configure required environment values in Vercel Project Settings; local `.env` files and generated development artifacts are excluded from uploads. Do not put secrets in `VITE_` variables, which become public browser code.

Production builds omit the fictional testimonial section, sample announcements, and demo-login shortcut controls. To publish a real announcement, clear its sample flag. The admin announcement editor and meeting banner use shared platform data. Published meeting schedule changes are reflected on the banner, and closed or expired meetings are hidden.

Album photos are served from this site's public image folder. The album's collection buttons open an on-site viewer with next/previous buttons and keyboard navigation, with no Google Drive redirects. The currently imported collection contains eight photos.

## Scope of deployment

This prepares the static public site for hosting. Signup and sign-in now require the platform API: signup queues a verification email, and login requires a verified email. Configure a same-origin `/api/*` reverse proxy to the platform service before deploying these flows; the checked-in static Vercel configuration does not provide that backend. Run database migrations (through `014_mentor_sessions.sql`) and the SMTP mail worker; the worker also delivers mentorship session emails. Mentors must have approved, verified platform accounts. For local development, `PLATFORM_DEV_URL` selects the API target (default `http://127.0.0.1:8082`).

Authentication, staff approval, course publishing, mentoring sessions, meeting attendance and the verified credit ledger use the platform API. Some older profile and community features still retain browser-local state. Vercel deployment has not been performed by this change.

### Staff approval and meeting attendance

Apply platform migrations through `014_mentor_sessions.sql` and restart the API/mail worker. See [staff and meeting setup](./meetings-and-staff.md) for approval, course publication, the ALX Deco Center pin, adjustable schedules and verified credits. Set `VITE_HUB_URL` on the separate public landing deployment so meeting links open the authenticated Hub.
