# PLP frontend demo workspaces

Open `/sign-in`. Use the email/password form or the five demo dashboard buttons.

| Role | Email | Password |
| --- | --- | --- |
| Member | member@demo.plp.test | PlpDemo2026! |
| School coordinator | coordinator@demo.plp.test | PlpDemo2026! |
| Club leader | leader@demo.plp.test | PlpDemo2026! |
| Trainer | trainer@demo.plp.test | PlpDemo2026! |
| Administrator | admin@demo.plp.test | PlpDemo2026! |

These credentials are deliberately public sample credentials for a frontend demo. Do not reuse them for real accounts. Records are shared across these roles only within the same browser and origin. Sign out before testing the next role; refreshing preserves records.

## Test the certificate journey

1. Sign in as the coordinator. Open School members and add individuals or paste names and optional emails separated by `|`, one student per line.
2. Open School certificate requests. Select recipients, enter the programme, completion date, and evidence, and submit.
3. Sign out, then sign in as admin. Open School certificate requests. Inspect evidence and recipients. Return the batch with correction notes, or Approve & issue.
4. If returned, sign back in as coordinator, choose Correct request, update details, and resubmit.
5. Once issued, the coordinator can download a combined multi-page PDF or individual PDFs. Requests snapshot recipient details at submission.
6. The member demo email matches Aline in the seeded school register. Certificates issued to her appear under My achievements → View my school certificates.
7. QR codes link to `/certificate-check/:requestId/:memberId`. Only issued certificates are shown, with name, programme, school, and issue date. No email or review evidence is shown on this public verification view. Links work only in the browser holding these local records.

There is a seeded pending request for three students so admins can explore immediately. Seeded schools and all demonstration records are fictional. An unassigned second school illustrates school scope and analytics.

## Roles and signup

Members join immediately. Account type allows Member, Club leader, School coordinator, or Trainer; staff selections record a requested role, not privileged access. The admin uses Members & staff to assign a verified role and school. A school coordinator must have a school assignment. Administrator cannot be selected at public signup. Trainers receive courses through the trainer assignment controls in Trainer studio.

The dashboards use role-specific navigation. Learning, ALX, opportunities, mentorship, clubs, community, credits, and the Youth Passport are available to members. Trainers manage courses, club leaders manage assigned communities, coordinators manage schools, and administrators oversee the platform. The old `/auth/login` and `/auth/signup` links redirect to unified access pages. Legacy MIS screens remain outside the Hub flow.

## Design and help

Dashboards use a PLP blue/navy palette, a recognition motif, metric cards, school tables, and live bar/donut charts derived from local records. PLP help is a deterministic FAQ chatbot, not a generative AI service. It answers simple questions about joining, roles, certificates, and demo storage, with a contact fallback. It needs no API key and performs no account actions.

## Production boundary

This implementation is frontend only. Browser storage, demo role controls, and password hashing do not provide a trusted security boundary. A backend must implement authentication, school-scoped authorization, audited staff provisioning, certificate approvals, durable storage, public verification, and password recovery. No email is sent. The PDFs carry a demo authorization and an explicit demo label; no real signature or official seal is fabricated. Official templates/signatures must be authorized and configured before real issuance.

## Tests

`npx playwright test tests/school-workspaces.spec.ts` exercises all four credentials, certificate submission/return/correction/issuance/PDF download/verification, nonprivileged staff signup, restricted coordinator routes, mobile layout, and FAQ replies.

## Director concept alignment (28 September 2026)

The member, trainer, coordinator and administrator dashboards now focus on their own responsibilities rather than sharing a certificate dashboard. Club leaders have a dedicated demo: `leader@demo.plp.test`, password `PlpDemo2026!`, assigned to the school club. Student, university and community members share the learning dashboard, with their category retained on signup.

Academy certificates are automatic; school activity certificates use the separate batch approval workflow. Required Hub modules are restored in navigation. See [the current requirement audit](plp-hub-requirements.md) for coverage and remaining content/backend work.
