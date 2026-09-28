# Member access and role dashboards

See [Demo workspaces](demo-workspaces.md) for the four test accounts and the complete school certificate walkthrough.

## Signup and access

`/join` collects name, email, password, account type, member category, and optional school. Member access is immediate. Choosing School coordinator or Trainer records a staff request; the user starts with a member dashboard until an administrator verifies and assigns the requested role. Administrator is never a public signup option.

`/sign-in` accepts email/password and also offers four clearly marked demo-account shortcuts. Member, School coordinator, Trainer, and Administrator have dedicated dashboard content and navigation at `/hub`. `/auth/login` and `/auth/signup` redirect to this unified flow.

The admin assigns roles and schools at `/memberships`. Coordinators must have a school assignment. Course ownership is managed in the trainer studio. Existing legacy member categories and club roles are retained for compatibility with saved records, but are not extra public signup roles.

## School certificate access

Coordinators access only their assigned school register and requests. Admins review all school requests and issue or return them. Members see only issued school certificates with a matching email. Students do not need accounts to be included in a coordinator request. Public demo verification exposes only the issued recipient's name, programme, school, and issue date; it does not expose email or completion evidence.

## Frontend boundary

All records remain in this browser's `localStorage`; tab sessions use `sessionStorage`. New passwords use salted PBKDF2 SHA-256 hashes with 210,000 iterations, but browser state is not a trusted security boundary. Demo credentials are public and intentional. Production needs backend authentication, school-scoped permissions, staff provisioning, durable records, audited approvals, authorized certificate signatures, and password recovery. No email is sent.

Old learning and profile records remain intact. Pending membership records migrate to active membership; rejected/suspended records remain blocked. Legacy access codes remain compatible with the password verifier. The developer-only `/dev/access` route remains for legacy test fixtures and is not linked in the primary interface.
