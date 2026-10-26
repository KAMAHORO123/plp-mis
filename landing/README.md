# PLP public website

Standalone React/Vite website. This directory can be pushed to its own repository, installed and deployed without the MIS source tree. Public pages, albums, trivia, quotes, styles and public assets live here. No HubProvider, demo login, browser database, certificate signing assets or dashboard code is imported.

```sh
npm ci
cp .env.example .env.local
npm run dev
npm run build
```

The development server uses port 5174. The existing MIS continues to use port 5173.

Set `VITE_HUB_URL` to the deployed system origin (for example `https://hub.your-domain.org`) when that system is ready. Until then member links lead to the public Hub availability message. Never use localhost for this value in a public deployment. Frontend `VITE_` values are public, never passwords or service keys.

The announcement is disabled by default. Edit `public/announcement.json` with a real title, future date, location and safe URL, and set enabled to true. Redeploy after edits. Alternatively set `VITE_CONTENT_API_URL` to the separately deployed public-content service origin. That service reads `/v1/announcement`. The existing demo admin does NOT update this independent website. Authenticated content editing is a future backend integration.

Vercel: select `landing` as Root Directory when using the existing repository, or `.` when deploying a separate repository containing this folder. Build command `npm run build`; output `dist`; install `npm ci`. The included rewrite supports direct page URLs. Environment changes require a rebuild.

Docker: `docker build -t plp-landing .` then `docker run --rm -p 8081:80 plp-landing`. Pass public settings with `--build-arg VITE_HUB_URL=...` and `--build-arg VITE_CONTENT_API_URL=...`. Serve through HTTPS before launch.

This is an independent snapshot. Edit public website code here going forward. Existing `src/features/hub` and `frontend/src/features/hub` copies remain for the MIS preview; edits there do not automatically propagate here. Do not re-copy whole folders because that can overwrite deployment-specific content.
