# Production stack validation

Local checks completed on 12 October 2026. These checks are not a hosted production certification.

| Check | Result |
| --- | --- |
| `landing/` TypeScript + Vite build | Passed after React Router 7 / Tailwind 4 upgrades |
| `system/` TypeScript + Vite build | Passed |
| Platform policy + real PostgreSQL integration tests | Five suites passed: auth/learning/verification; file privacy; school boundaries; school certificates/materials/attendance/credits; trainer assignment/review |
| Public content tests | Passed |
| Chrome mobile workflow | Passed at 390 px: sign-in, event create/update, banner publishing, PDF download, anonymous verification |
| Public website | Seven actual routes checked at 390 px and 1440 px; no horizontal page overflow or broken loaded images |
| Certificate PDF | Rendered visually; one page; QR decoded to the configured verification URL |
| Runtime database permissions | Read access succeeded; deleting audit rows and creating tables were denied |
| PostgreSQL restore drill | Latest dump restored into a new database; counts matched for users, records, certificates, requests, resource completions, register attendance, credits and audit history |
| Dependency audit | Zero reported vulnerabilities for landing, system, platform and credential packages |
| Deployment configuration | YAML parsed by Prettier; shell syntax checks passed |

Docker Engine is unavailable on this workstation. Container builds/startup, real HTTPS, DNS, the server firewall, external backup storage, attachment restoration and hosted load testing still need validation on a server or CI runner. The GitHub workflow is written but has not been executed in your account. No cloud server was purchased, no domain registered, and no live data imported.

Tests used an isolated temporary PostgreSQL cluster on port 55439 and dedicated `_test` databases. They did not read application `.env` secrets or modify an existing production database. Browser test fixtures deliberately use `example.test` identities. Temporary test servers were stopped after validation.

Repeat API checks using `TEST_DATABASE_URL` pointing to a migrated database ending in `_test`. Repeat the browser smoke from the repository root with `PLAYWRIGHT_CHANNEL=chrome TEST_DATABASE_URL=... node system/test/smoke.mjs`, after starting the credential renderer. Do not point test commands at live member data.

## Authentication additions, 13 October 2026

Added Google authorization-code sign-in with PKCE, browser-bound state, nonce verification and explicit existing-account linking. Added recovery requests, a retrying SMTP worker, and signup/sign-in/recovery screens. Six API test suites passed against the isolated PostgreSQL test database, including missing/wrong/expired OAuth state, unverified Google email, nonce mismatch, membership approval, account linking, generic recovery responses, email retry, token expiry/reuse and session revocation. Google responses and SMTP delivery were mocked; real provider credentials were not available.

Chrome checks passed at 390px and 1440px for sign-in, signup and recovery, with no horizontal overflow or page errors. A browser completed recovery, reset the password, and signed in with the new password. Production system and legacy frontend builds passed; the legacy build retains existing bundle-size and mixed-import warnings. Live Google consent/callback and actual inbox delivery still require the configuration in `google-and-password-recovery.md`.

## Container stack rehearsal, 22 October 2026

The complete Compose stack was built and started under Docker 29.5 (Rancher Desktop) with **2 vCPU and 4 GB RAM**, matching the recommended server size. Images were built sequentially with `COMPOSE_PARALLEL_LIMIT=1`; all six built successfully. Hostnames were `plp.localhost` and `hub.localhost` with Caddy's local certificate authority, so public DNS and Let's Encrypt issuance remain unverified until the real server.

| Check | Result |
| --- | --- |
| Startup order | Database became healthy, migrations exited 0, then the API, credentials, content, both websites and the gateway started |
| HTTPS routing | `/api/healthz`, Hub `/sign-in`, website `/about` and `/content/v1/announcement` returned 200 |
| First administrator | `bootstrap-admin.mjs` inside the platform container created an approved admin; sign-in returned a `HttpOnly; SameSite=Lax; Secure` session cookie |
| Registration | Membership application accepted (202); a request with a foreign `Origin` was rejected (403) |
| Database exposure | PostgreSQL has no published host port |
| Cross-site links | Website Sign in → `https://HUB_HOST/sign-in`; Hub Website link → `https://SITE_HOST` |
| Backup and restore | `backup.sh` produced a validated dump and file archive; `restore-test.sh` restored it into a new database with the expected user count |

API tests (9 suites) and both browser suites (`system/test/auth.mjs`, `system/test/smoke.mjs`) passed again against an isolated PostgreSQL 18 test database after the sign-in redesign. The test stack and its data were removed afterwards.
