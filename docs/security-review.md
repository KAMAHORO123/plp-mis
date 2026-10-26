# Security review — October 2026

An authorized penetration test was run against an isolated copy of the API (test database, separate port),
combined with a code review of the API, the React client and the deployment configuration.

## Result

No critical or high-severity flaws in the application logic. Verified as safe: SQL injection (all queries
parameterised), authorization and IDOR across every route and role, mass assignment (strict schemas), CSRF
(Origin check on every state-changing request), file uploads (magic-byte type detection, safe file names,
`nosniff`, per-owner quotas, no path traversal), stored XSS (no raw HTML rendering; email templates escape),
open redirects, session handling (rotation on sign-in, invalidation on sign-out and password change),
account enumeration, rate limits, secrets (no `.env` in git or images), and container hardening.

## Fixed

| Finding | Severity | Fix |
|---|---|---|
| Unlimited guesses on older single-question courses earned credits and a certificate | Medium | 3 wrong answers in total, at most one per 24 hours (migration 021) |
| No Content-Security-Policy or HSTS | Medium | Strict CSP and HSTS in `deploy/Caddyfile`, verified against every page with no violations |
| Vulnerable dependencies (zod, nodemailer, react-router) | Medium | zod 4.6.7 and nodemailer 10.2.1 on the server; react-router 7, zod 4 in the client. `npm audit --omit=dev`: 0 server vulnerabilities |
| One account could open unlimited live connections | Low | 5 per account; the oldest closes |
| A club leader could award credits to any account by typing its email into the register | Low | Register attendance earns credits only for an account at that school or one that signed up for the activity |
| Organisers saw emails of registrants from other schools | Low | Emails shown only to administrators and for the organiser's own school |
| Demo scripts guarded only by `NODE_ENV` | Low | They also refuse any database not on this machine |
| `returnTo` after sign-in | Hardening | Backslashes and `//` are rejected in addition to the route allowlist |

Found while fixing: an impossible date (month 13) caused a server error instead of a validation message,
and certificate term dates moved back a day on every save east of UTC. Both are fixed and covered by tests.

## Accepted

- `postcss-selector-parser` (via Tailwind 3): build-time only, never runs for visitors. Clears with Tailwind 4.
- `/mentors` lists mentor emails to signed-in members, by design, so they can request sessions.
- Live updates hold connections in one API process; run a single API instance or add a shared bus to scale out.

## Authentication hardening (follow-up)

**JWT sessions.** The session cookie now carries a signed JWT (HS256, `services/platform/src/auth.mjs`) with the
user (`sub`), the server-side session (`sid`), issuer, audience, issue time and expiry. Each request must present a
token with a valid signature and claims *and* a live session in the database for that same user, so signing out,
suspension and password changes still end access immediately (a plain JWT cannot be revoked). The verifier accepts
only HS256 (rejects `alg: none` and algorithm confusion), compares signatures in constant time and ignores oversized
tokens. Cookies stay `HttpOnly`, `SameSite=Lax` and `Secure`.

- `JWT_SECRET` (at least 32 random characters) is **required**: the API refuses to start in production without it,
  and `deploy/compose.yml` will not start the stack without it. Generate one with `openssl rand -base64 48`.
- To rotate: set the new key as `JWT_SECRET` and the old one as `JWT_SECRET_PREVIOUS`; remove the old key once
  existing sessions have expired (30 days at most).

**Also added**

- Per-account lockout: 10 wrong passwords lock that account for 15 minutes (on top of the per-address limit),
  recorded in the audit log as `auth.locked`; successful sign-ins are logged as `auth.login`.
- Password rules wherever a password is set (sign-up, reset, change): at least 12 characters and not easily guessed
  (common words with numbers, keyboard or number runs, repeated characters, digits only, the person's email or name).
- Protective headers on every API response (`Content-Security-Policy: default-src 'none'; sandbox`,
  `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Cross-Origin-Resource-Policy: same-origin`, HSTS over HTTPS),
  in case the API is ever reached without the gateway.

`test/jwt-security.test.mjs` attacks all of this: forged and edited tokens, `none` and HS512 tokens, foreign keys,
expired tokens, wrong issuer or audience, old-format cookies, a token pointed at another user's session, reuse
after sign-out, the lockout, weak passwords and the headers.
