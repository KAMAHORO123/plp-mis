# Demo data, live updates and notifications

## Load the demo (local development only)

With the platform API running (`npm start` in `services/platform`):

```bash
cd services/platform
npm run demo:seed     # once: schools, people, activities, a course, mentoring, opportunities, certificates
npm run demo:history  # once, optional: a year of past activities so dashboards show trends
npm run demo:live     # any time: plays 10 everyday actions, 8 s apart (add -- --delay 4 to speed up)
```

Every demo account uses the password `DemoPass2026!` and an `@plp-demo.test` address (a reserved domain,
so no email is ever sent to them; they receive in-app notifications only).

| Role | Account |
|---|---|
| Administrator | admin@plp-demo.test |
| Trainer | trainer@plp-demo.test |
| Mentor | mentor@plp-demo.test |
| Club leaders | leader1@plp-demo.test (Hillside), leader2@plp-demo.test (Riverside) |
| Members | kevin@, sandrine@, patrick@, claudine@, olivier@, esther@plp-demo.test |

The scripts refuse to run when `NODE_ENV=production` or when the database is not on this machine.

## Live updates

Each signed-in tab keeps one Server-Sent Events connection to `GET /api/live`. After any successful change the
API sends a `change` event and open pages re-fetch what they show (through the normal permission checks), so
nobody needs to refresh. Connections live in the API process: run a single API instance (as `deploy/compose.yml`
does) or add a shared message bus before scaling out. Caddy is configured not to compress `/api/live`.

## Notifications

Stored in the `notifications` table (migration 019) and pushed live as `notification` events. The bell in the
workspace header shows the unread count and the latest 50; members can turn on desktop alerts for background tabs.
Rules live in `services/platform/src/notify-rules.mjs` (new activities and opportunities, participation,
mentoring, course review, ALX recognition, reports and credits, certificates, account approval).

## Cookies

Sign-in uses one HttpOnly, SameSite=Lax session cookie. "Keep me signed in" keeps it for 30 days (otherwise one
day). A one-time notice explains that only this essential cookie is used.
