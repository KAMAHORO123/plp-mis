# Google sign-in and password recovery

The database-backed application in `system/` supports Google sign-in for existing linked accounts, connecting Google to an existing member account, and emailed password recovery. Everyone must complete the membership form; Google cannot create a new account. Google cannot assign a role or bypass suspension.

## Google setup

1. In Google Cloud Console, configure the OAuth consent screen for PLP and create an OAuth client of type **Web application**. Request only `openid`, `email`, and `profile`. Add test users while the app is in Testing mode; complete Google's publishing requirements before opening access to everyone.
2. Set the authorized redirect URI to **https://YOUR-HUB-HOST/api/auth/google/callback**. This must exactly match `APP_ORIGIN` plus `/api/auth/google/callback`. Local development uses `http://localhost:5175/api/auth/google/callback` with `APP_ORIGIN=http://localhost:5175`.
3. Put `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in the platform service environment (or the private deployment env file). Never put the client secret in `VITE_*` variables, source code, screenshots or chat.
4. Restart the platform. The Google button becomes available when the server reports it is configured. Use the production Hub origin, not the landing site's origin, for the callback.

Existing email/password members first sign in normally, open **Account security**, and choose **Connect Google account** using the same email. This deliberate linking step prevents account takeover through automatic email matching. Future sign-ins can use Google. A member who has only used Google can use Forgot password to create a local password once approved.

The server uses authorization code flow with PKCE, a browser-bound single-use state, nonce checking and Google's ID-token signature/audience/issuer/expiry verification. OAuth access/refresh tokens are not stored. PLP session cookies stay HttpOnly and Secure in production.

## Recovery email setup

Use a transactional SMTP provider with an authorized sender. Configure `SMTP_HOST`, `SMTP_PORT` (587 with required STARTTLS, or 465 with TLS), `SMTP_USER`, `SMTP_PASSWORD` and `MAIL_FROM`. Set the provider's required sender/domain verification records. Do not use a fake sender address.

Store actual credentials in the ignored `deploy/.env` or `services/platform/.env` file. Keep `.env.example` as a blank template. The platform and worker load the service's private `.env` first, then `deploy/.env`; explicit shell/container variables take precedence. The root frontend `.env` is not loaded by the backend.

Check the connection without sending an email:

```sh
npm --prefix services/platform run mail:check
```

This checks TLS and SMTP authentication. It cannot prove that the provider accepts `MAIL_FROM` or that messages reach an inbox. A real password recovery request is still needed for that final check.

For local development, configure `DATABASE_URL` and `APP_ORIGIN` in the service environment along with SMTP, then run both:

```sh
node services/platform/src/server.mjs
node services/platform/src/mail-worker.mjs
```

For deployment, use the same private env file as the existing deployment:

```sh
docker compose --env-file deploy/.env -f deploy/compose.yml --profile mail up -d --build
```

The **mail profile must be running** when SMTP is configured. Check `docker compose --env-file deploy/.env -f deploy/compose.yml --profile mail logs mail` for delivery failures. No live email is sent during automated tests.

Forgot password always returns the same message for existing, missing and unapproved accounts. Only approved accounts receive an email with a 6-digit code. Codes expire after 10 minutes, allow five attempts, can be resent once every 60 seconds, and are stored hashed. A correct code is exchanged for a single-use reset token valid for 15 minutes; setting the new password invalidates every existing session. Requests have per-IP limits. Emails retry up to five times before expiry; the private delivery queue holds the code only until it is sent. Operator-issued links from `src/reset-link.mjs` still work for verified manual recovery. Keep database backups and database access private. Run the existing maintenance job to remove expired rows.

Without SMTP configuration the recovery page reports that delivery is unavailable instead of pretending to send email. The operator-assisted `reset-link.mjs` remains a fallback. No Google account, SMTP account, domain or production service has been configured automatically.

## Original frontend and landing links

The root and `frontend/` apps now use the platform API for signup and password login, while their other Hub data remains browser-local. Use the production `system/` application for real member operations. The separated `landing/` app uses `VITE_HUB_URL=https://YOUR-HUB-HOST` for its Hub links. For a local preview, point it to `http://localhost:5175` and run the platform and production frontend.

## Before launch

Run migrations, then check form signup with a test account, email confirmation, immediate member login, Google sign-in, account linking, a real inbox recovery email, link expiry and repeat use. The automated tests mock Google and email delivery; live credentials and provider configuration still need this end-to-end verification.

References: [Google OpenID Connect server flow](https://developers.google.com/identity/openid-connect/openid-connect) and [Nodemailer SMTP transport](https://nodemailer.com/smtp).

## Email verification page

`/verify-email` confirms signup email with a six-digit code. The production signup form opens this page after registration. Requesting a code uses `/api/auth/verification/request`; confirmation uses `/api/auth/verification/confirm`. Codes expire in ten minutes, allow five attempts, and can be resent after sixty seconds. Resending replaces the old code. Registration queues the first code on the server. Verification uses the SMTP worker, records `email_verified_at`, and activates pending accounts with the ordinary member role. Suspended/rejected accounts cannot verify; verification never grants an elevated role. Users can then sign in. Password login and authenticated API requests require a verified email, including for existing accounts. Existing users can request a code at `/verify-email`. Email syntax is validated server-side; successful code entry proves access to the inbox. No email provider allowlist is used.

The root and `frontend/` signup/sign-in forms now call the platform API and open this verification page. They require a same-origin `/api` proxy and the mail worker; static Vercel hosting alone cannot send codes. Their remaining Hub data and UI sessions are still browser-local, so use `system/` for server-backed member operations. Without a backend, signup reports unavailable and does not grant access.

Layout references: [Clerk email verification and resend behavior](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options), [Auth0 email verification](https://auth0.com/docs/manage-users/user-accounts/verify-emails). The email/password form comes first, with Google as a secondary option beneath it.
