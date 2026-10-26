# PLP deployment and operations

Updated 23 October 2026. The public website (`landing/`) can be released independently. **The Hub served in production is now the root app** (`src/`), built by `deploy/hub.Dockerfile` and routed by the gateway to `HUB_HOST`, with `/api` going to the platform service. The older `system/` app is kept in the repository and CI but is no longer served. `frontend/src` is a mirror of the root app for local use only.

### Deploying or updating

```sh
cd deploy
docker compose --env-file .env build
docker compose --env-file .env --profile mail up -d   # --profile mail starts the email worker (session and verification emails)
```

The `migrate` service applies every migration through `018_notification_html.sql` before the API starts. Production needs HTTPS (provided by the gateway): browsers only allow the camera (proctored quizzes and exams) and location (meeting check-in) on secure pages. The gateway sends a `Permissions-Policy` allowing camera and location for the Hub and full screen for the Hub and YouTube lesson embeds, and does not compress `/api/files` or `/api/avatars`, so videos keep byte-range seeking.

Uploads (profile pictures, application documents, course videos) are stored in the `uploads` volume and included in `backup.sh`. Members may store 50 MB; trainers and administrators 5 GB, including videos up to 500 MB. Size the server disk for the videos you expect; long recordings are better hosted on YouTube and linked. The API allows uploads up to one hour so large videos on slow connections finish.

School registers, school certificate requests and approvals, learning materials and completions, club activities with attendance, reports and photos, community joining and activity participation, and ALX evidence are stored on the platform and shared across devices. Register members whose email matches an approved account earn activity credits when the report is submitted. Administrators add schools under **School registers** and assign each club leader's school in **Members & staff**.

Still stored per browser by design: the five built-in starter courses and their progress (trainer-built courses are server-backed; recreate the starters in the course studio to make them shared), the saved-opportunity shortlist, and private session takeaways.

Emails (verification and reset codes, reset links and mentorship session updates) use one branded HTML layout with a plain-text version (`services/platform/src/email-template.mjs`). They are delivered by the mail worker (`--profile mail`).

## What is built

| Directory | Purpose |
| --- | --- |
| `landing/` | Independent public website, albums, Canada section, trivia, navigation and announcements |
| `system/` | New responsive authenticated workspace using the server API |
| `services/platform/` | PostgreSQL migrations, sessions, membership approval, roles, school-scoped permissions, records, attendance, learning, certificate issuance/revocation, uploads and audit history |
| `services/credentials/` | Private PDF renderer with PLP logo, signature, stamp and verification QR |
| `services/public-content/` | Read-only announcement API, connected to platform content in the deployment stack |
| `deploy/` | Docker Compose, HTTPS gateway, environment template, backup and restore drill scripts |
| `.github/workflows/production-checks.yml` | Builds, dependency audit, database integration tests and container build checks |

These are separate running services, not just frontend folders. Authentication, learning and core records deliberately remain in one transactional service. They do not need separate servers or Kubernetes. The credential renderer has no database credentials and no publicly exposed port. The content service reads published announcement data through the platform API and cannot edit it.

The production workspace currently supports CRUD for events, courses, resources, opportunities, school register entries, applications, mentorship and evidence, with historical project/discussion endpoints kept outside active navigation. It also supports account and register attendance, activity reports, idempotent credits using the existing PLP award amounts, school-assigned resources and completion, school summary CSV reports, trainer course assignment/preparation/publication, course completion, submission review, and school certificate batches with return/correction/review and members without logins. The new workspace uses its own screens rather than silently replacing the original demo: exact legacy report layouts and existing local-data import are not included. Existing browser data has not been silently imported or erased.

## Database and file storage

Use **PostgreSQL**, included in the Compose stack. There is no database licence fee and no separate managed database bill in this setup. Users, access status, schools, records, sessions, enrolments, attendance, issued certificates, revocations and audit history are shared across devices.

The migration process uses the database owner. The running API uses a separate `plp_app` login without superuser, database-creation or role-creation privileges. It cannot update or delete audit rows. PostgreSQL has no published host port.

Uploads are stored in a private persistent Docker volume, with ownership and metadata in PostgreSQL. Supported uploads are PDF, PNG and JPEG (10 MB each) and, for trainers and administrators, MP4 and WebM course videos (500 MB each), all checked by their leading bytes. Members have 50 MB; trainers and administrators 5 GB. This is file-type screening, not malware scanning. Documents download as attachments; images and videos display inline. Every file requires a signed-in user with access to the associated record (profile pictures are visible to any signed-in member). Add malware scanning before accepting untrusted public uploads at scale. Only administrators can publish shared resources. Static public album photos stay in the website image assets.

A single server is inexpensive but is one failure domain. This deployment does not provide automatic database failover. The initial target is a small controlled pilot; load testing determines when to increase memory, disk or separate services.

## Lowest-cost purchasing recommendation

Do not buy one server for each service. Begin with **one Linux VM with 2 vCPU and 4 GB RAM**, public IPv4 and an SSD. Build images sequentially to reduce peak memory. Keep money aside for off-server backups. No custom domain is required for a pilot.

Checked official sources on 12 October 2026:

| Option | Verified information | Decision |
| --- | --- | --- |
| Hetzner CX23, Europe | 2 vCPU, 4 GB RAM, 40 GB NVMe. Published June 2026 price is €5.49/month before VAT and IPv4. IPv4 is €0.50/month, giving **€5.99/month before VAT and backups** (US-dollar list: $6.49 + $0.60 = $7.09). | Low advertised price, but the public page currently says unavailable. Confirm stock and the checkout total. |
| Strettch Cloud | Official Coolify guide specifies 2 vCPU, 4 GB RAM, 80 GB SSD, Ubuntu 24.04 LTS and a Public IP add-on. | Compatible with this stack. A current public total price was not verifiable; obtain the dashboard total including IP, tax and backups before paying. |
| Free website-only hosting | `landing/` can use a provider subdomain independently. | Does not replace the running API, PostgreSQL and private storage. Check the provider's current free-plan eligibility for the organisation. |

The Hetzner number is a pricing benchmark, **not a guaranteed available purchase or the total operating cost**. Backups, tax, excess bandwidth and any email provider are additional. No server has been purchased and no payment details have been accessed.

Sources: [Hetzner current price adjustment](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/), [CX23 specification and availability](https://www.hetzner.com/cloud/cost-optimized/), [IPv4 pricing](https://docs.hetzner.com/cloud/servers/primary-ips/overview/), [Strettch official deployment guide](https://cloud.strettch.com/blog/deploy-fullstack-app-coolify).

## Purchasing on Strettch

1. Open [Strettch Cloud](https://cloud.strettch.com/), create your organisation's account and enable any available account protection.
2. In Compute, review the Ubuntu 24.04 LTS option with 2 vCPU, 4 GB RAM and 80 GB SSD. Include a public IPv4 address. Save the exact recurring total and renewal terms before purchasing.
3. Use SSH-key access. Strettch's deployment guide uses **SSH port 222**; follow the port and username shown for your actual instance.
4. Choose either plain Docker Compose with the included Caddy gateway, or the Strettch Coolify image. **Do not run two competing proxies on ports 80/443.** The included instructions below use plain Docker Compose. With Coolify, expose only the website, system and their HTTP routes through Coolify's proxy; keep database and credential ports private.
5. Set a spending alert if offered. Restrict incoming traffic to web ports 80/443 and your administrator's SSH access. Do not expose 5432, 8082 or 8083.
6. Configure backups outside this VM. A disk snapshot alone is not the tested database-and-files backup described below.

These are based on the provider's published guide, not a walkthrough of your account. Dashboard labels, prices, availability and firewall options must be confirmed in your own account. No support email has been sent on your behalf.

## Start without buying a domain

For a pilot, use two temporary hostnames from a provider-managed domain or an IP-based DNS service. [sslip.io / nip.io](https://nip.io/) documents free DNS names that resolve an embedded IP address. For example, after replacing the example IP with **your actual server's public IPv4**:

```dotenv
SITE_HOST=plp.203-0-113-10.sslip.io
HUB_HOST=hub.203-0-113-10.sslip.io
```

The example uses a documentation-only IP and will not deploy as written. Check that both actual names resolve before starting Caddy. Caddy obtains HTTPS certificates when DNS and public ports are correct. Third-party DNS availability and certificate issuance are not guaranteed. Use a stable hostname before issuing real certificates: the QR contains the Hub hostname, and an IP change can break temporary URLs. When a PLP domain is acquired, retain redirects from existing verification URLs or reissue the PDFs.

## Deploy the complete stack on an Ubuntu server

Install Docker Engine and the Compose plugin following the [official Ubuntu instructions](https://docs.docker.com/engine/install/ubuntu/). Use a deployment account with SSH keys. Clone your private source repository to the server; no repository has been pushed by this task.

From the repository root:

```sh
cp deploy/.env.example deploy/.env
chmod 600 deploy/.env
openssl rand -hex 32
openssl rand -hex 32
```

Put the two generated values into `DB_PASSWORD` and `APP_DB_PASSWORD`. Use different values. Edit `SITE_HOST`, `HUB_HOST` and `TLS_EMAIL`; no `https://` in the hostnames. Never commit the populated file. Keep secrets out of every `VITE_*` variable, because those are public browser values.

```sh
cd deploy
docker compose --env-file .env -f compose.yml config --quiet
COMPOSE_PARALLEL_LIMIT=1 docker compose --env-file .env -f compose.yml build
docker compose --env-file .env -f compose.yml up -d
docker compose --env-file .env -f compose.yml ps
docker compose --env-file .env -f compose.yml logs --tail=80 migrate platform gateway
```

The database starts first, then migrations, then the API. Persistent volumes hold database records, private attachments and HTTPS certificate state. Container logs are size-limited. Do not use `down -v` on a deployed system: it removes persistent volumes.

Create the first administrator in a private SSH session. Read the password without placing it in command history:

```sh
# Bash on the server; run from deploy/.
read -r -p 'Administrator email: ' ADMIN_EMAIL
read -r -p 'Administrator name: ' ADMIN_NAME
read -r -s -p 'Administrator password (14+ characters): ' ADMIN_PASSWORD
printf '\n'
export ADMIN_EMAIL ADMIN_NAME ADMIN_PASSWORD
docker compose --env-file .env -f compose.yml exec -T \
  -e ADMIN_EMAIL -e ADMIN_NAME -e ADMIN_PASSWORD \
  platform node src/bootstrap-admin.mjs
unset ADMIN_EMAIL ADMIN_NAME ADMIN_PASSWORD
```

Visit the Hub over HTTPS, sign in and approve a test membership. Confirm the public website's Join/Sign-in links open the Hub. Create an announcement in Website banner and check the website after its 60-second cache expires. Run an entire course-to-certificate flow and scan the PDF QR from a different phone.

The server API cookie is HttpOnly, SameSite=Lax and Secure in deployment. Mutations require the configured Hub Origin. The gateway overwrites the client-IP header for rate limiting; **do not expose the API directly when `TRUST_PROXY=true`**.

## Website-only release while system development continues

In Vercel, import the repository and select **Root Directory: `landing`**, framework Vite, build `npm run build`, output `dist`. Use its assigned HTTPS subdomain until you buy a domain. Leave `VITE_HUB_URL` blank until the real Hub is available; the public site then directs people to its Hub information page. Set it to the Hub origin and redeploy once ready. Set `VITE_CONTENT_API_URL` to the website's HTTPS `/content` endpoint if you want the database-managed announcement.

On the content service, `PUBLIC_SITE_ORIGIN` must match the actual website origin when the website lives on another host. The local static `landing/public/announcement.json` is a fallback; the demo's localStorage banner editor does not control a deployed website.

Do not deploy `system/` to static hosting without routing `/api/*` to the platform service. The included Compose gateway already supplies that routing. Vercel static hosting alone does not run this PostgreSQL backend.

For a separate Git repository, copy only `landing/` excluding `node_modules`, `dist` and `.env*`, then restore the non-secret `.env.example`. Future public-site changes belong in `landing/`; the duplicate legacy public components do not automatically sync.

## Backups and restoration

From `deploy/`, run `./backup.sh`. Both backup scripts read `deploy/.env` by default; set `ENV_FILE=/path/to/file` to use another environment file. It briefly stops the platform service, exports PostgreSQL in custom format, archives attachments, validates both archives and restarts the API even if the script fails. The database/file pair shares a timestamp. The public static site stays up, but database-dependent requests are briefly unavailable.

Schedule it in a low-traffic window, e.g. via cron, and send failures to an operator. Copy **both files** to encrypted storage outside the VM. Retain a practical rotation such as 7 daily and 4 weekly backups; this script does not automatically delete your only backup or configure a paid storage account. Keep an encrypted recovery copy of the deployment secrets separately.

Run `./restore-test.sh backups/plp-TIMESTAMP.dump` to restore to a **new** database without overwriting production. Also extract the matching files archive into a temporary folder and compare stored file IDs and byte sizes. Perform this drill before launch and periodically thereafter. For disaster recovery, restore the database and files on a new isolated server, configure the same stable hostnames, validate permissions and a PDF verification link, then switch traffic. Never test restoration over the live database.

## Account recovery and email

Password changes invalidate all sessions. Until an email service is configured, recovery is operator-assisted. Verify the requester through your organisation's process, then run from `deploy/`:

```sh
read -r -p 'Verified account email: ' RESET_EMAIL
export RESET_EMAIL
docker compose --env-file .env -f compose.yml exec -T -e RESET_EMAIL \
  platform node src/reset-link.mjs
unset RESET_EMAIL
```

Deliver the printed private link to that verified person through a trusted channel. It expires after 30 minutes, is single-use and invalidates existing sessions. It contains a secret: do not paste it in tickets or public logs. The browser removes it from the address bar after loading.

Google sign-in and queued transactional password recovery are implemented. Follow [Google and recovery setup](google-and-password-recovery.md) to configure provider credentials and start the mail worker. Automatic verification for password-based registration and staff MFA remain unimplemented. A password login alone does not prove ownership of an email address.

## Updating and rollback

Run tests in CI, take and copy a backup, build images from a known Git revision, run migrations and start the new services. Keep the prior images/revision until the release is verified. Prefer additive database migrations; rolling back an application image does not automatically reverse schema or data changes. For an incompatible schema change, restore the tested backup into a replacement environment rather than improvising destructive SQL on production.

Monitor `/api/healthz`, disk space, database connections, memory, error logs, TLS renewal and backup success. Avoid logging passwords, cookies, recovery tokens or attachment contents. Clean expired sessions/rate-limit/recovery rows periodically with `node src/maintenance.mjs` (included).

## Local verification and remaining release work

Local verification covers TypeScript/production builds, API integration tests against PostgreSQL, school/owner permissions, private-file access, course completion and duplicate issuance, single-use recovery, revocation, QR decoding and a mobile Chrome workflow. A local PostgreSQL dump was restored successfully into a separate database; attachment archive recovery and the actual Docker backup scripts still need a hosted restore drill. CI configuration is present, but has not run on your GitHub account.

The full container stack has since been built and run locally on a 2 vCPU / 4 GB Docker host, including HTTPS routing, first-admin creation, sign-in and a backup/restore drill (see the validation record). Public DNS, Let's Encrypt certificates, the server firewall and hosted performance can only be verified on the purchased server. No server or external database account has been provisioned. Before a broad launch, review workflow coverage with PLP, configure the chosen account-verification process, perform a hosted pilot and a restore drill, and approve the exact server bill. This is a working backend and deployment foundation. Hosted production readiness has not been established merely by passing local tests.

Detailed local results are recorded in [production-validation.md](production-validation.md).
