# Current PLP workspace specification

This revision replaces the older club-leader, community-forum, rewards, project and school-certificate workflows. It reflects the user's latest instructions, not an expansion of the director's original concept paper.

## Request checklist

| Requested change | Current implementation |
| --- | --- |
| Opportunity CV/cover/supporting letter | Optional file slots on applications; saved downloads survive reload |
| View other communities and upcoming activities | `/clubs` directory with host and period filters, activity descriptions and photo cards |
| Request participation or joining | Pending request records; school leader/admin decisions; approved membership updates |
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

“Corrected” means the leader has resubmitted a correction and the administrator must review it. “Correction required” remains a separate necessary state so a returned request is not mislabeled as already fixed. Internal historical statuses are retained and mapped to these display labels.

## Data preservation and limitations

The local store initializes a new `operations` collection without deleting older project, post or redemption records. Legacy activity records are copied with stable IDs. New uploads are browser-local files, limited to 1.5 MB each. Photo collections allow three files; course documents allow five. Persistent shared storage and official issuance require a backend.

The activity directory's non-school communities are administered by the administrator. School coordinators never gain authority over other hosts by browsing them or by approving participation in their own school.

Material completion records refer to the school and completing staff member. They do not certify each student automatically. Standard membership certificate requests are a separate process.

A school member without a login can receive a certificate and be marked present. Credits require a matching member account. Credit awards are idempotent per activity/member; reversals require a future explicit policy.
