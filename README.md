# PLP Hub — system guide and backend handover

Peace and Love Proclaimers · Youth for a Change

PLP Hub connects members with learning, opportunities, mentorship, school clubs and community activities. This repository is a **frontend demonstration**. Records and uploads are stored in the current browser; authentication, permissions, certificates, applications and bookings are not backed by a production server.

The latest workflow revision takes precedence over earlier concept-paper examples. School coordinators now serve as school club leaders. Schools use downloadable learning materials rather than Academy courses. Community discussions, reward redemption, passport projects, member outcomes, invitations and the separate club-leader dashboard have been removed from the active experience.

## Run locally

```bash
npm ci
npm run dev
```

Open the URL printed by Vite (normally port 5173). The root app uses `src/` and `public/`. An alternate entry point exists under `frontend/`:

```bash
npm --prefix frontend ci
npm --prefix frontend run dev
```

Shared Hub changes currently need to be applied to both source trees. Select one canonical deployment tree before backend integration; the two trees are not symlinks and some legacy files differ.

### Demo accounts

Open `/sign-in` and use a shortcut or the credentials below. All passwords are **`PlpDemo2026!`**.

| Role | Email |
| --- | --- |
| Member | `member@demo.plp.test` |
| School coordinator / school club leader | `coordinator@demo.plp.test` |
| Trainer | `trainer@demo.plp.test` |
| Administrator | `admin@demo.plp.test` |

These fictional accounts are intentionally public and must not be provisioned in production. Sign out and switch roles in the **same browser and origin** to test a handoff. Other browsers, devices and ports have separate data.

## How the system works

### Registration and access

Normal members join immediately with a name, email, password and matching password confirmation. Password fields have show/hide controls. Member category appears only when the applicant selects Member. School names can be typed and are converted to uppercase.

Selecting a staff role records a request; it does not grant staff privileges. Administrators assign roles and schools in Members & staff. A school leader needs an assigned school. New, unrecognized school names are recorded for the administrator rather than automatically creating a school or granting access. Public signup cannot create administrators.

Membership state still supports account suspension. Production must invalidate suspended sessions on the server. The browser's local account checks are only a preview.

### Member workspace

Members can:

- Enroll in published Academy courses, complete lessons and assessments, and earn automatic course achievements.
- Explore ALX courses and upload completion certificates for PLP recognition. There is no manual ALX percentage tracking.
- Browse opportunities, save listings, and submit a local application with optional CV, cover letter and supporting letter files.
- Explore other schools, clubs and communities, see upcoming/past activities and photos, and request participation or membership.
- Request mentoring and record sessions/reflections.
- View personal achievements, the Youth Passport, and their credit ledger.

The separate discussion-forum section has been removed. `/community` redirects to the activity directory. Credits retain earning history but no longer include “Unlock something new” or reward redemption. The passport no longer includes project entry or the “Projects & demonstrated impact” section.

### School coordinator = school club leader

There is one school-leadership workspace. Old local Club leader profiles migrate to School coordinator; only known demo leaders receive a default demo-school assignment. Other accounts need an administrator-assigned school. The separate leader demo button and dashboard have been removed.

School leaders can:

1. Add students individually or paste a group into their own school register. Students do not need login accounts.
2. Select students and request standardized membership certificates. There is **no programme, achievement, completion-date or evidence form**.
3. Download materials published by the administrator for their school, use them in sessions, and mark each material completed once per school.
4. Publish activities with title, date, type, duration, description and photos. Future activities appear to members as upcoming events.
5. Approve/decline participation and joining requests for their own school.
6. Submit activity reports, attendance and photographs. Reports become available to the administrator.

The profile contains account details and the assigned school. `/academy` redirects school coordinators to `/learning-materials`. The main school dashboard summarizes members, activities and material completion rather than treating certificates as its sole purpose.

### Membership certificates

All new school requests recognize **Service as a PLP member**. The leader submits recipient IDs; the local model snapshots their names and emails. The original request date/time is stored separately from correction time.

| Display status | Meaning |
| --- | --- |
| Pending | New request awaiting administrator decision |
| Correction required | Administrator returned the recipient list with a note |
| Corrected | Leader resubmitted the corrected recipients; awaiting decision |
| Approved | Administrator approved issuance; PDFs available |

The table supports searching, status filtering and pagination. Detail views show recipients and correction notes. Approval permits an individual or batch PDF download. A member sees only issued school certificates matching their email.

Internal legacy status values remain `Submitted`, `Returned`, and `Issued`; `correctedAt` distinguishes a corrected submission. Existing records retain their historical metadata. Older requests without a timestamp display “time unavailable” rather than an invented time.

PDFs and QR records remain marked as demonstrations. No official signature is configured. School verification uses `/certificate-check/:requestId/:memberId` and exposes only issued credential details. Production requires shared server records for another device to verify the QR code.

### School learning materials

Administrators upload a titled file and target specific schools, or all schools. Coordinators can download accessible materials and mark them completed. Completion records store material ID, school ID, actor and time. Administrators see aggregate and per-school completion details.

School material completion is a school-level session-delivery record. It is not an individual Academy enrollment, exam pass or automatic school-certificate trigger.

### Academy, trainers and course documents

Administrators create a course using **only its name and assigned trainer**. The course starts as an incomplete, unpublished draft. Trainers see their assigned courses and prepare the lesson content, category, level, duration, skills, assignment and assessment. They can attach up to five documents before publication.

Publishing is blocked until the required course content and assessment are complete. Published courses must be unpublished before content editing. Existing enrollment/content versioning is still a backend/product decision; production must not invalidate a learner's completed history when a course changes.

Enrolled members can download course documents. Trainers see submissions from assigned courses. Trainer profiles contain account details and community.

The current Academy completion rule is all lessons complete, an assignment of at least 30 trimmed characters, and a passed single-question assessment. Successful completion creates one course certificate, merges skills into the passport and awards 50 demo credits. The separate administrator “Issued course certificates” page is removed; personal automatic achievements still work.

### Activities, requests and reports

The directory includes schools and the existing club/homegroup/community catalogue. Administrators can publish/report for any listed host; school leaders manage only their assigned school. Members can filter upcoming, past or all activities and select a host.

A participation request refers to an activity. A joining request refers to a host. Each records member, host, optional activity, state and time. Duplicate requests are prevented locally. Approval of a club joining request adds the club membership; approval of a school joining request adds a register entry without granting staff access.

Reports can be submitted on or after the activity date. Attendance can select registered school members, club members and approved participants. Administrators review the report and photos. Editing a report clears its review state.

Confirmed participation earns demo credits for matched member accounts once per activity: Meeting 10, Volunteering 20, Challenge 25 and Recruitment 15. Students without accounts can still be recorded in attendance. Removing attendance does not automatically reverse previously awarded credits; production needs an explicit reversal policy.

### Administrator workspace

- **Members & staff:** searchable, paginated account table with a focused editing panel for role, school, account state and notes. No invitation creation form.
- **Content studio:** name-only course creation and trainer assignment, submissions, ALX certificate review and opportunity publishing.
- **Learning materials:** file publication to all or selected schools.
- **School registers:** school, assigned club leaders and member counts; select a school for its searchable member table.
- **School certificate requests:** Pending, Corrected, Approved and Correction required views, request timestamps, search, pagination and decisions.
- **Activities & requests:** all hosts' activities, membership/participation decisions and reporting.
- **Reports & analysis:** host and date filters, overall/per-host activity and attendance measures, activity/report chart, report detail/photos/review, and material completion by school.
- **Profile:** account details only.

The member-outcome entry form and standalone Community section have been removed. Activities and reports are real local records; analytics are not the historical impact figures printed on the public website.

### ALX, opportunities, mentoring and public help

ALX submissions require an uploaded completion certificate. Administrators recognize or return the evidence; recognition does not depend on a percentage. Existing old progress values are ignored. Recognized evidence produces a passport badge, not an ALX-issued credential.

Opportunity applications support three optional document slots: CV, cover letter and supporting letter. The local record retains the files for download and reload. No application is sent to an organization in this frontend.

Mentorship retains the existing mentor/expert/coach catalogue, goal matching, session requests, cancellation and reflection. There is no live calendar or mentor-side confirmation service.

The automated FAQ is now on public landing pages only. It is a keyword-based helper, not an AI service, and requires no API key.

## Routes and source map

| Route | Source / responsibility |
| --- | --- |
| `/`, `/about`, `/programmes`, `/stories` | `home.tsx`, public layout; FAQ and resources |
| `/join`, `/sign-in` | `access.tsx`, local credential/session demonstration |
| `/hub` | `role-dashboard.tsx`; school leadership uses `SchoolLeaderDashboard` |
| `/academy`, `/academy/:id`, `/alx` | `academy.tsx` |
| `/opportunities`, `/mentorship` | `connect.tsx` |
| `/clubs` | `ActivitiesPage` in `school-operations.tsx` |
| `/learning-materials` | `LearningMaterialsPage` in `school-operations.tsx` |
| `/school-members` | `workspaces.tsx` for coordinators; `SchoolDirectoryPage` for admin |
| `/certificate-centre` | `membership-certificates.tsx` |
| `/passport` | `passport.tsx` for members; `AccountProfilePage` for staff |
| `/certificates`, `/credits` | `passport.tsx`; `/learning-certificates` redirects to personal certificates |
| `/memberships` | `memberships.tsx`, administrator only |
| `/studio` | `admin.tsx` and `course-management.tsx` |
| `/hub-analytics` | `OperationsAnalyticsPage` in `school-operations.tsx` |
| `/certificate-check/:requestId/:memberId`, `/verify/:id` | Local school/course verification |

All feature files above are under [src/features/hub](src/features/hub). The router is [src/app/router.tsx](src/app/router.tsx). Shared table search/pagination is in [management-ui.tsx](src/features/hub/management-ui.tsx).

Retired routes redirect: `/community` → `/clubs`, `/issued-certificates` → `/hub` for administrators. Old MIS screens remain outside the active Hub flow. Avoid connecting or exposing a retired page simply because its source still exists.

## Backend data handover

### Current persistence

[store.tsx](src/features/hub/store.tsx) owns `HubState`. `localStorage['plp-hub-v1']` holds the local dataset and `sessionStorage['plp-hub-session-v1']` holds the selected session. `useHub().update()` clones and replaces browser state; production must replace these callbacks with explicit API commands.

The `operations` extension is initialized for existing datasets. Legacy activities are copied into it with stable prefixed IDs; legacy school-club activities map to the demo school. Old project/forum/redemption data is not destructively erased even though the active screens are removed.

### Entities

| Entity | Main fields and constraints |
| --- | --- |
| Profile | Identity, email, category, role, membership state, optional requested role, school ID/name, trainer community; credentials must be stored separately server-side |
| School/member | School register independent from login accounts; student email optional; verified linkage needed in production |
| Course | Name, trainer owner, publication state, lessons, category, assessment, skills, `documents?: HubFile[]` |
| Enrollment/certificate | Member/course, lesson progress, assignment, assessment/completion and immutable issuance snapshot |
| Application | Member/opportunity, note/date, optional `{kind, file}` documents; unique application per member/opportunity |
| Material | `id`, title, file, `schoolIds[]` (empty = all), creation time |
| Material completion | Material/school pair, completing actor and timestamp; unique per material/school |
| Activity | Host, author, title/date/type/hours, description, photos, attendees, optional report/submission/review times |
| Participation/join request | Member, host, optional activity, Pending/Approved/Declined, creation time; unique member/host/activity combination |
| School certificate request | School, creator, standardized programme, recipient snapshots, state, note, original `requestedAt`, optional `correctedAt`, approval/issuance metadata |
| ALX evidence | Member/programme, certificate file and Pending review/Returned/Recognized state |
| Credits | Member/source/amount/label/date; immutable ledger in production, unique earning source |
| Mentor session | Member/mentor/date/goal/status/reflection; authoritative scheduling still needed |

New operation types are defined in [operations-data.ts](src/features/hub/operations-data.ts). `HubFile` currently contains name, MIME type, byte size and a base64 data URL. Production should store an opaque file ID/object key instead.

### Upload boundaries

Documents accept PDF, DOC, DOCX, PNG and JPEG up to 1.5 MB each. Activity photos accept PNG, JPEG and WebP up to 1.5 MB each, at most three per activity. Courses allow at most five attached documents. ALX retains its PDF/PNG/JPEG 1.5 MB limit.

These limits keep the local demo usable, but several uploads can still fill browser storage. The UI reports failed saves. Production needs object storage, content validation, private access controls, retention and authorized downloads; do not return all documents to every browser. MIME checks in this demo are not authoritative file validation.

## Proposed backend API — not implemented

Agree an OpenAPI contract and auth strategy before integration. `/api/v1` below is a proposed prefix. The server derives the actor from its authenticated session and checks every referenced school, course, host, file and member ID.

| Area | Proposed commands / reads |
| --- | --- |
| Access | `POST /auth/register`, `/auth/login`, `/auth/logout`; `GET /auth/me`; recovery endpoints |
| Accounts | `GET /admin/users?page=&search=&status=`; `PATCH /admin/users/:id/access` |
| Schools | `GET /schools`; `GET/POST /schools/:id/members`; `POST /schools/:id/member-imports` |
| Materials | `GET /learning-materials`; admin `POST /learning-materials`; scoped `PUT /learning-materials/:id/completion`; authenticated downloads |
| Course assignment | Admin `POST /courses` with title/trainer ID; scoped trainer `PATCH /courses/:id`; publication command |
| Course learning | Catalogue/detail, own enrollment/progress/assignment/assessment commands; never expose answer keys in learner responses |
| Activities | `GET /activities?hostId=&period=`; scoped `POST /activities`; `PUT /activities/:id/report`; admin review command |
| Joining/participation | `POST /hosts/:id/join-requests`; `POST /activities/:id/participation-requests`; scoped request decision |
| Certificates | `POST /school-certificate-requests` with member IDs; correction/decision commands; filtered paginated reads; authorized PDF downloads |
| Verification | Public opaque-token verification returning minimal issued credential fields only |
| ALX | Catalogue; own certificate upload; admin proof queue and decision |
| Opportunities | Published listings, saved listings, own application with uploaded file IDs, withdrawal; admin publication |
| Mentoring | Mentor catalogue, own session requests, availability/confirmation/cancellation/reflection |
| Reporting | `GET /admin/reports?hostId=&from=&to=` and `/admin/material-progress?schoolId=` with documented metric definitions |
| Files | Authorized upload initiation/finalization and short-lived authorized downloads |

Example new school request:

```json
{
  "memberIds": ["school-member-id"]
}
```

The server resolves the coordinator’s school, validates every recipient belongs to it, snapshots names, applies the fixed membership-certificate wording, and sets the request timestamp. Never trust client-supplied approver, issuance state, or certificate title.

Example material completion:

```json
{
  "materialId": "material-id"
}
```

The server derives school and actor, verifies assignment, and upserts one completion record. It must not let a coordinator submit another school's ID.

### Consistency and permissions

- Normal signup cannot grant staff privileges. School leaders are limited to their assigned school; trainers to assigned courses.
- Administrators bootstrap through a controlled backend process, not public registration. Role changes and suspensions are audited.
- Transactions/uniqueness protect certificate decisions, course completion, material completion, participation decisions, attendance awards and duplicate applications.
- A Pending or Corrected school request can be approved; Correction required must be resubmitted first. Preserve original time and correction history.
- Issue one course certificate and credit source per eligible completion. Award participation once; corrections need an explicit reversal policy.
- Validate report dates, attendee membership and host ownership server-side. Review state resets when a report changes.
- Use pagination and role-scoped query responses. Do not send the entire `HubState` to production clients.
- Public QR verification must omit contact information, supporting documents and internal review notes. Linking school recipients to accounts requires verified identity, not email matching alone.
- If cookie authentication is selected, define CSRF, cookie and CORS handling. Do not migrate local demo password hashes or rely on browser-supplied session IDs.

### Legacy integration warning

[src/api/client.ts](src/api/client.ts) and [services.ts](src/api/services.ts) belong to the older MIS. They use `VITE_API_URL` (default `/api`), a separate bearer-token store, and older role codes. The Hub does not use those services for its data. Setting an API URL does not replace `useHub().update()`.

Choose which legacy screens remain, unify authentication, then replace Hub mutations with typed API calls and query invalidation. Do not provide a generic “replace HubState” endpoint. Add loading/error/retry states for every command; failed uploads must not leave records claiming success.

## Checks and deployment

```bash
npm run build
npm --prefix frontend run build
npm run test:hub
```

Playwright uses local Google Chrome and a Vite server on `127.0.0.1:5185`. Run one test runner at a time because the server and artifact directory are shared.

[revised-workflows.spec.ts](tests/revised-workflows.spec.ts) covers material distribution/completion, activity uploads and requests, reporting, recipient-only certificate corrections/approval/PDF, course assignment/documents/publication, opportunity files, tables, profiles and mobile layout. Other tests cover access, signup, Academy completion and ALX recognition. Backend integration needs equivalent API/database tests for forged IDs, concurrent operations, stale decisions, oversized uploads and cross-device persistence.

Deploy root `dist/` or `frontend/dist/` as appropriate. Configure SPA fallback for browser routes but route `/api/*` to the backend. Configure a canonical public certificate origin before generating production QR codes.

Environment files and build/dependency output are ignored. Never place secrets in `VITE_` variables: they are exposed in the browser bundle. The FAQ needs no Gemini/OpenAI key.

## Remaining production and content work

No live backend, identity/recovery service, private file storage, real applications/bookings, notifications, official certificate authority or cross-device verification is supplied. The mobile application is Phase II; this is responsive web.

PLP must approve curricula/materials, reports, event dates, testimonial consent, certificate wording/signatory, staff assignments, credit policy and reporting definitions. The platform must not label demo content as official evidence. The five Academy starter courses are not a complete advanced curriculum.

See [the concept-paper audit](docs/plp-hub-requirements.md), [latest workflow specification](docs/current-workflows.md), and [demo guide](docs/demo-workspaces.md). The latest user-requested workflow changes override earlier concept-paper progress/reward/forum examples.
