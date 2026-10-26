# Current PLP workspace specification

This revision replaces the older club-leader, community-forum, rewards, project and school-certificate workflows. It reflects the user's latest instructions, not an expansion of the director's original concept paper.

## Request checklist

| Requested change | Current implementation |
| --- | --- |
| Opportunity CV/cover/supporting letter | Optional file slots on applications; saved downloads survive reload |
| View other communities and upcoming activities | `/clubs` directory with host and period filters, activity descriptions and photo cards |
| Join or participate instantly | One-click membership and activity participation; persistent upcoming reminders on the member dashboard; no approval queue |
| Remove separate Community | Removed from navigation; old route redirects to activity directory |
| Remove credits rewards | Redemption section removed; earnings and ledger retained |
| Remove passport projects | Project section, entry form and project-count card removed; historical records not deleted |
| FAQ on landing pages | Public layout only; absent from dashboards and other member workspaces |
| Standard school certificates | Select members only; fixed Service as a PLP member wording; original request timestamp |
| Activities, photos, upcoming events and reports | School leaders publish for assigned school; admin can publish/report for all hosts |
| School learning materials | Admin title/file + all/selected schools; coordinator download and school-level completion |
| Coordinator is new club leader | One school leadership dashboard; legacy leader profiles migrate without automatically assigning unknown schools |
| Simple staff profiles | Account details; assigned school for coordinator, community for trainer, no passport modules |
| Trainer course docs | Upload documents while preparing assigned draft; enrolled learners download published course documents |
| Admin name-only assignment | Course name + trainer creates unpublished draft; trainer supplies content |
| Members/staff tables | Search, eight-row pages, focused account editor; no invitation form |
| School registers | School/leader/member counts table and searchable per-school member detail |
| Certificate request tables | Search/pagination/status filters, timestamp, scoped recipients and approval/correction |
| Reports and analysis | Host/date filters, activity/report chart, report/photos/review, material completion per school |
| Remove member outcomes and issued-course registry | No active outcome-entry screen; retired issued-course route redirects to dashboard |
| In-app confirmation dialogs | Deletes, attendance closing, cancellations and assessment starts use an in-page dialog instead of the browser's `localhost says…` prompt |
| Mentor dashboard | Mentor role (account email listed in the mentor directory) sees requests, upcoming and past sessions, and an email log; accept with meeting link, reschedule, decline with reason, record a held session, delete declined/cancelled records |
| Mentorship emails | Request, edit and cancellation email the mentor; confirmation, rescheduling, decline and completion email the mentee. Queued by `POST /api/mentorship/notify` and delivered by the mail worker |
| Mentee session CRUD | Request in a dialog, edit while awaiting the mentor, cancel, delete cancelled/declined records, add a takeaway after the mentor records the session. Mentees can no longer mark sessions completed |
| Mentor directory | Administrators add, edit and remove mentors under Mentorship sessions → Mentor directory |
| Academy (course structure) | Catalogue with level/pathway/progress filters; course page with Overview, Modules and Grades; modules unlock in order |
| Academy assessments | Every module has a timed knowledge check (80% to pass) and every course a timed final exam (default 70%). Timers cannot be paused and auto-submit at zero, including after a reload; leaving the tab three times submits the attempt; three attempts per 24 hours; questions are shuffled; exam answers are not revealed |
| No manual completion | Modules complete by passing their quiz; the course completes, issues the certificate and awards credits only after all quizzes, the 60-word assignment and the final exam are passed |
| Assessment authoring | Trainers and administrators add, edit and delete quiz/exam questions and set time limits, pass mark and attempts under Studio → Courses → Assessments. Publishing requires a quiz for every module and at least three exam questions |

“Corrected” means the leader has resubmitted a correction and the administrator must review it. “Correction required” remains a separate necessary state so a returned request is not mislabeled as already fixed. Internal historical statuses are retained and mapped to these display labels.

## Data preservation and limitations

Session requests, mentors and assessment attempts are stored in the same browser-local Hub state as other records, so a mentor sees requests in the dashboard only on a shared device until these records move to the platform API; the email is the cross-device notice. Timers and attempt limits are enforced in the browser and are not tamper-proof. Emails are sent only when the platform API and mail worker are running; otherwise the email log shows "Not delivered" with a Resend action.

The local store initializes a new `operations` collection without deleting older project, post or redemption records. Legacy activity records are copied with stable IDs. New uploads are browser-local files, limited to 1.5 MB each. Photo collections allow three files; course documents allow five. Persistent shared storage and official issuance require a backend.

The activity directory's non-school communities are administered by the administrator. Club leaders never gain authority over other hosts by browsing them or by approving participation in their own school.

Material completion records refer to the school and completing staff member. They do not certify each student automatically. Standard membership certificate requests are a separate process.

A school member without a login can receive a certificate and be marked present. Credits require a matching member account. Credit awards are idempotent per activity/member; reversals require a future explicit policy.

Member discovery uses visual community cards, published activity photos, past reports, upcoming activities, and host/date/search filters. Generic illustrations appear when no activity photo is available. Joining a school community does not add someone to its official school register. Activity participation does not count as attendance until recorded by the leader.
