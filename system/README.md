# PLP database-backed workspace

This application uses `services/platform/`, not the legacy browser-local Hub store. The initial workspace supports membership approval, role-scoped records, attendance, learning, files, certificates and banner administration. See [the deployment guide](../docs/production-roadmap.md) for exact scope and remaining legacy workflow migrations.

```sh
npm ci
npm run dev
```

The development server is port 5175 and proxies `/api` to port 8082. Start the platform with `APP_ORIGIN=http://localhost:5175`; open that same hostname, because origin checks are intentional. `PLATFORM_DEV_URL` can override the local proxy target.

Build with `npm run build`. The Docker image serves the build and the deployment gateway routes API requests. Do not publish the static build without that API routing.

For the browser smoke test, use a dedicated database ending in `_test`, apply platform migrations to it, and set `TEST_DATABASE_URL`. Set `PLAYWRIGHT_CHANNEL=chrome` to use an installed Chrome browser, or install Chromium with `npx playwright install chromium`. The test uses Playwright and starts temporary frontend/API processes. Start the credential service at port 8083 first. Test accounts and example records belong only in that isolated test database.

From the repository root, run `TEST_DATABASE_URL=postgresql://.../plp_test PLAYWRIGHT_CHANNEL=chrome node system/test/smoke.mjs`. Test fixtures are intentionally isolated from real accounts.
