# Sessions, credits and reminders

Run the updated application and workers from the repository root:

```sh
docker compose up --build -d --wait
```

The MIS is at http://localhost:5173. Migration 023 adds session format, a separate location, reminder receipts and outbox metadata. Existing plain-text venues move into the location field; existing HTTPS links remain intact. Data volumes are preserved.

Members can request an online session, an in-person session or a visit. A meeting link and location are both optional; mentors confirm or change the details. A supplied URL must use HTTPS. Google Meet links are entered by the participants; the application does not create Google meetings or require a paid integration.

Session tables include search, status, format and upcoming-period filters. Member and mentor calendars show scheduled sessions. Activity and meeting calendars link to their details. Confirmed sessions export as `.ics` events with a one-hour calendar alarm. Times in the calendar use the device timezone; emails explicitly show Kigali time. Activities without a scheduled time appear as date-only events.

The existing mail worker checks reminders every minute:

- Confirmed sessions: in-app and email reminders within 24 hours and within 1 hour, for both participants.
- Registered activities: an in-app and email reminder the day before.
- Published opportunities closing within seven days: one in-app alert per member and deadline. These discovery alerts are not emailed.

Database receipts prevent repeated ticks or concurrent workers from duplicating reminders. A rescheduled session uses its new time as part of the receipt key. Pending session reminder emails are discarded when the session is cancelled or its time changes, and expire when it starts. Missed reminders are not sent after a session has started. The bell refreshes every 30 seconds as well as receiving existing live notifications. Email transport failures use the existing retry queue; queuing does not imply delivery.

The worker continues generating in-app reminders when SMTP is not configured. Email requires the existing SMTP settings. Reserved test-domain addresses never receive mail.

Credits now show balance, monthly earnings and transaction count, with a searchable ledger, source/type filters and date range. Sources have readable names instead of internal identifiers. Shared dashboard tables support search, filter reset, ordering, page size and pagination. Sessions, mentor history/mentees/emails, meetings/registers, opportunities, role dashboards and school members use these controls; course, mentor, activity, opportunity and certificate collections are paginated too.

Validation: TypeScript and production build; dedicated-database reminder/mentorship/notification integration tests; Chrome checks of visit creation, optional-link confirmation, filtering, pagination, calendar download, trainer loading and mobile overflow. Mail delivery tests use a fake transport and do not send external test emails.
