# PLP Hub: director’s concept paper alignment

**Current scope:** the later [workspace revision](current-workflows.md) overrides the original forum, rewards, projects, school certificates, staff roles, ALX progress and reporting flows described below. This audit preserves the original paper comparison; use the revision and root README for implementation handover.

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

## Attachment re-audit: acceptance status

Source: [director’s supplied concept paper](plp-concept-paper.txt). “Implemented” here means usable frontend behavior with local demo data, not a production service.

| Paper section | Acceptance status | Evidence / open work |
| --- | --- | --- |
| 1–3. Hub purpose, pathway, objectives | Frontend implemented; progression policy pending | Learning-centred dashboard, public pathway, opportunities and passport; no invented eligibility threshold for PLP Connect |
| 4. Student, university, community members | Shared learning workspace implemented; advanced content pending | Signup preserves category; all three can access development modules; no advanced course is currently seeded |
| 4. Club leaders, trainers, administrators | Frontend implemented | Scoped club management, trainer authoring/submissions, consolidated user/content administration and analytics |
| 5A. About, vision, mission, impact, joining | Frontend implemented | Public pages and immediate membership; “apply” wording does not override the requested no-approval signup |
| 5A. Portfolio, reports, brochures | Partial content | Portfolio, generated impact brief and Hub brochure downloadable; an approved annual report has not been provided |
| 5A. Stories, events, testimonials, partners | Partial content | Organization impact stories and partner descriptions present; event dates, consented testimonials and individual success stories need approved content |
| 5B. Academy | Functional frontend; partial curriculum | All five categories, enrolment, lessons, assignment, assessment, progress, trainer authoring; current seed has five starter courses |
| 5C. ALX | Frontend implemented; external integration limited | Catalogue/registration links, recommendations, progress, evidence/review and recognition; success stories link to external learner voices, not locally approved PLP alumni stories |
| 5D. Digital certification | Local frontend implemented; production verification pending | Automatic Academy completion records, achievement badges, PDF, LinkedIn link, QR; admin issued-course registry at `/issued-certificates`; school batch approval remains separate |
| 5E. Youth Passport | Frontend implemented | Profile, skills, course/school certifications, learning, clubs, volunteering, leadership, projects; school records included in count, list and export |
| 5F. Opportunity Centre | Frontend implemented; real listings/delivery pending | All nine types, filtering, saves, practice applications, admin publishing |
| 5G. Mentorship | Local frontend implemented; live scheduling pending | Goal-area matching, mentor/expert/coach profiles, requests and reflections; forum in Community; no real calendar or mentor acceptance flow |
| 6. Clubs management | Frontend implemented | Member register, activity/attendance/report/performance workflows, headquarters overview; club leaders are restricted to assigned clubs |
| 7. Analytics | Frontend implemented; reporting policy pending | Seven requested measures and CSV export; exact definitions documented in README; demo records are not donor-ready evidence |
| Credits | Frontend implemented; operational policy pending | Five earning actions, ledger, training/ticket/merchandise/mentorship rewards; no real fulfilment |
| Mobile Phase II | Deferred as specified | Responsive web tested; native mobile application is not built |

### Curriculum content still to approve

The paper says “courses such as”; those examples are not all implemented as standalone approved courses. The current catalogue must not be described as the complete PLP curriculum.

| Category | Current starter content | Examples not yet separate courses |
| --- | --- | --- |
| Leadership Development | Personal Leadership | Servant Leadership; Communication; Emotional Intelligence; Team Management |
| Employability Skills | CV Writing & Interview Skills (combined) | Workplace Readiness; Professional Communication |
| Entrepreneurship | Startup Fundamentals | Business Modeling; Financial Literacy; Sales & Marketing |
| Digital Skills | Digital Literacy & AI Tools (combined) | Graphic Design; Data Skills; Coding Basics |
| Civic & Peace Leadership | Peacebuilding & Active Citizenship (combined) | Conflict Resolution; Community Leadership |

Trainers can author and publish these through Content Studio after PLP supplies/approves lesson material, assignments, assessments, levels, and completion criteria. University members currently have access to the Academy but not a populated advanced curriculum. No placeholder has been labeled an approved course.

### What prevents a “fully complete” claim

- Production backend: trusted authentication, shared persistence, enforced permissions, durable files, official certificate issuance, cross-device QR verification, and real applications/bookings/rewards.
- Approved content: expanded/advanced curriculum, reports, testimonial consent, event schedules, and member/ALX success stories.
- Operational decisions: progression, assessment policy, certificate authorization/revocation, mentoring availability, credit/reward fulfilment, and donor reporting definitions.
- Native mobile application: Phase II, outside the current responsive web implementation.

The newest fixes close the school-achievement passport gap and the administrator’s automatic-course-certificate visibility gap. They do not remove any of these remaining dependencies.

## ALX workflow override

The latest user instruction replaces the concept paper’s manual ALX progress tracking with completion-certificate uploads only. Members finish the course on ALX, upload a required PDF/PNG/JPEG certificate, and see Pending review, Returned, or Recognized status. Administrators review the uploaded certificate without a percentage prerequisite. Existing uploaded evidence remains available; old numeric progress values are no longer displayed or used. Academy lesson progress is unchanged.
