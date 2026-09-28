# PLP Hub: director’s concept paper alignment

Updated 28 September 2026 against the concept paper supplied in the conversation. This is a responsive frontend demonstration with browser-local persistence, not a deployed membership service.

## Product structure

Learning and youth development are the centre of the Hub. Certificates are one outcome of learning, not a universal dashboard task.

| Audience | Dashboard purpose | Main tools |
| --- | --- | --- |
| Student, university, community members | My learning journey | Academy, ALX, opportunities, mentorship, clubs/challenges, community, achievements, credits, Youth Passport |
| Club leaders | Club leadership overview | Assigned club registers, activities, attendance, reports, invitations; personal learning remains available |
| Trainers | Teaching overview | Owned courses, enrolled learners, assignments, assessments; no school certificate queue |
| School coordinators | School overview | Assigned school register and school activity certificate batches; retained from the school workflow requested separately |
| Administrators | Platform overview | Users and staff assignments, content, opportunities, ALX reviews, clubs/reports, impact analytics, school certificate approval |

The concept paper’s three member categories share one learning workspace. They are not three copies of an administrative dashboard. Public sign-up records the selected category as Student, University, or Community member. Membership starts immediately. Selecting a staff role requests an assignment; it does not grant privileges. Club management is limited to assigned clubs and school management to the assigned school.

## Two certificate paths

1. **Academy:** complete lessons, submit the required assignment, and pass the assessment. Completion records, a certificate/badge, skills, and course credits are awarded automatically. There is no administrator approval step.
2. **School activities outside the Academy:** a coordinator selects school students, supplies completion evidence, and submits a batch. An administrator returns corrections or approves it. The coordinator downloads individual or batch PDFs; students with a matching account email can view their own certificates.

Members enter through **My achievements** for automatic course certificates, with one link to their school-issued records. Trainers focus on teaching. Administrators see school certificates as one review task among other platform tasks. ALX proof review is a separate recognition-badge workflow.

## Requirement audit

| Requirement | Frontend coverage | Remaining boundary |
| --- | --- | --- |
| Discover & Develop → Do → Demonstrate | Public pathway and member dashboard connect learning, opportunities, and passport | Advancement criteria into PLP Connect need an approved policy; no invented automatic promotion |
| Homepage: who we are, vision, mission, impact | Existing `/`, `/about`, `/programmes`, `/stories` | Historical organization figures are separate from demo analytics |
| Portfolio, reports, brochures | Homepage resource downloads | Current approved annual reports must be supplied; existing generated brief is not an audited report |
| Join PLP | Immediate member signup and password login; clubs/school/university/community entry context | Real identity, recovery, shared accounts require backend |
| Success stories, events, testimonials, partners | Existing impact stories, ALX/AMI partner descriptions, and honest event/testimonial empty states | Approved individual testimonials, current public event schedule, and final partner artwork remain content gaps; no invented endorsements/events |
| Five Academy categories | Searchable starter courses for Leadership, Employability, Entrepreneurship, Digital Skills, Civic & Peace Leadership | Full director-approved curriculum is not supplied; trainer authoring supports expansion |
| Trainer authoring | Courses, lessons, assignments, assessments, draft/publish, submitted work | Demo persistence only |
| ALX Learning Zone | Catalogue links, recommendations, tracked progress, proof upload, admin recognition badges, official learner-story link | External registration remains on ALX; no live ALX account sync or new verification of external URLs in this change |
| Automatic certification | Completion record, badge, PDF, QR record link, LinkedIn share | Not an official credential; QR/share needs shared backend records to work across devices |
| Youth Passport | Profile, skills, learning, certifications, memberships, volunteer hours, leadership, projects, export | Self-entered experience is identified as self-reported |
| Opportunity Centre | All nine requested types; search/filter, shortlist, demo applications, admin publishing | No real applications sent; external listings need approval and maintenance |
| Mentorship | Goal matching, mentor/expert/coach profiles, session requests, cancellations, reflections | No live calendar, external notifications, or real bookings |
| Community | Local discussions and replies, admin moderation | Shared community requires backend |
| Clubs | Register, activities, attendance, digital reports, review, performance export | School, university, community and homegroup demos; assigned leaders only |
| Admin analytics | Total/active members, completions, course and school certificates, active clubs, youth reached, employment/placements, outcomes entry, CSV export | Activity definition displayed; youth reached is a local approved youth-account count, not organization-wide impact |
| PLP Credits | Courses plus confirmed meetings, volunteering, recruitment, challenges; ledger and four reward types | Sample values and local redemptions; no real fulfilment |
| Mobile Phase II | Responsive web | Native mobile app remains Phase II |

## Removed or consolidated

- Removed the duplicated certificate-focused dashboard shared by every role.
- Removed the school-only analytics replacement; restored full Hub impact analytics.
- Removed duplicate user-role controls from Content Studio; staff roles, school assignments, and club assignments now live in Members & staff.
- Restored previously hidden required modules to member navigation.
- `/certificates` is the canonical personal achievement page. `/learning-certificates` redirects to it. School batch requests remain separate.
- Legacy API-dependent MIS code is retained outside the Hub flow to preserve existing work; it is not counted as working Hub coverage.

## Testing

Build both entry points and exercise role navigation, automatic course completion/certificates, credits, opportunities, mentorship, ALX proof review, club reporting, analytics, signup restrictions, school certificate correction/approval/download, and responsive layouts. See `tests/hub.spec.ts`, `tests/access.spec.ts`, `tests/school-workspaces.spec.ts`, and `tests/concept-alignment.spec.ts`.
