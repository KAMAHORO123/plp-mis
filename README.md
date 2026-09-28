# PLP Hub — Youth for Change

A responsive React frontend for Peace and Love Proclaimers, combining a member learning and development Hub with the existing national and school administration screens.

## Run locally

```bash
npm install
npm run dev
```

Open the Vite URL shown in the terminal. The public website introduces PLP and its learning pathways. **Join PLP** creates an account with name, email, and a chosen password, then opens the Hub immediately. **Sign in** welcomes returning members. No signup approval is required.

For testing, open `/sign-in` and choose one of the four demo dashboards: **Member**, **School coordinator**, **Trainer**, or **Administrator**. Each also has email/password credentials. See [demo accounts and certificate walkthrough](docs/demo-workspaces.md).

The main workspace now focuses on school registers, certificate requests, admin approval, PDF issuance, and school analytics. Signup includes an account-type choice; staff privileges are assigned by the admin after verification. A simple FAQ chatbot answers common questions without an API key.

The `frontend/` directory contains the alternate frontend entry point with the same Hub implementation. Its dev/build commands also work.

## What is included

- Portfolio-grounded homepage, PLP pathway, about page, impact stories, and downloadable resources.
- Learning academy with five starter courses, lessons, assignments, assessments, progress, certificates, and badges.
- ALX programme links, recommendations, progress tracking, evidence upload, and administrator recognition.
- Digital youth passport with skills, leadership roles, projects, clubs, and volunteer hours.
- Opportunities, saved listings, practice applications, mentor requests, session reflections, and community discussions.
- Club membership, activities, attendance, reports, performance, and credits.
- Credit ledger and sample reward redemptions; trainer content studio and administrator analytics.

Read the [member access design and testing guide](docs/member-access.md) for public/private routing, signup, invitations, and the production boundary.

The detailed [requirements coverage](docs/plp-hub-requirements.md) maps the supplied Hub concept paper to the implementation and records the remaining production boundaries.

## Frontend preview

The backend remains removed. Hub data persists under `plp-hub-v1` in this browser’s local storage. The frontend now includes password signup, member sessions, and role-specific route and record visibility. These are simulated locally: there is no trusted authentication, shared database, email, external application submission, booking, or reward fulfillment. Browser controls are not a security boundary. Do not use this prototype to store sensitive or production records.

Certificates and QR verification are local preview records, not official credentials. School certificate verification links show only issued demo records and do not carry the issuing browser’s records to another device. Legacy course certificate verification requires sign-in. Members can view their own records; administrators can review all records. Uploaded ALX evidence is limited to PDF/PNG/JPG, 1.5 MB per file, and remains in browser storage.

The original school administration screens remain at `/dashboard`, `/schools`, and `/coordinator`; they are not part of the new workflow, and `/auth/login` now redirects to the unified sign-in. Their existing API-only features remain unavailable. `/public` redirects to the new homepage.

## Checks and resources

```bash
npm run build
npm run test:hub
npm run build:resources
npm run preview
```

Browser tests use Playwright with locally installed Google Chrome and an isolated Vite server on port 5185. Test data lives in isolated browser contexts. `build:resources` regenerates the brochure and impact brief from source text; the supplied organization portfolio is included unchanged.

Build output is in `dist/`. Configure the static host to serve `index.html` for app routes. No API proxy is needed.
