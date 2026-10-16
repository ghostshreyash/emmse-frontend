# emmse-frontend

**EMMS-E** (Electrical Maintenance Management System, Enterprise Edition): the portal an enterprise's own administrators use to manage their electrical assets, maintenance activities, reports and fire prevention compliance. It is one of the three OLIVINE frontends (EVITA, EMMS-E, OCC), all served by the same backend API.

Built with React 19, Vite, TypeScript, Tailwind CSS v4 and shadcn/ui, on the same stack and colour tokens as [occ-frontend](https://github.com/ghostshreyash/occ-frontend) and [evita-frontend](https://github.com/ghostshreyash/evita-frontend). It runs on mock data until the API is connected; places to connect it are marked `TODO`.

## Getting started

```bash
npm ci
npm run dev       # http://localhost:5173
npm run build     # type-check + production build to dist/
npm run lint
```

`vercel.json` is set up for Vercel: it rewrites every route to `index.html` so deep links work on refresh. npm is pinned in `package.json` (`packageManager`) so the lockfile stays the same for everyone.

## Screens

Designs follow `docs/EVITA_WORKFLOW.pdf`, pages 30–36.

| Route | Screen | Status |
|---|---|---|
| `/login` | Enterprise Login: Enterprise ID or registered e-mail, and password (mockup page 30) | Built |
| `/login/verify` | Two-step verification: one-time code by e-mail, with SMS and voice fallback | Built |
| `/forgot-password` → `/forgot-password/verify` → `/reset-password` | Password reset | Built |
| `/register` | Request Access, for an enterprise that is not onboarded yet | Built |
| `/account-recovery` | Recovery when the mobile and e-mail are both unreachable | Built |
| `/` | Enterprise Dashboard (mockup page 31) | Built |
| `/tasks` → `/tasks/add` → `/tasks/:id` | Tasks: the enterprise's maintenance activities, added and viewed | Built |
| `/inspection-activities` → `/add` → `/:id` | Inspections: the inspection queue across the enterprise's plants | Built |
| `/reports` → `/reports/:assetId` | Reports & Analytics: the contamination, hygiene and cleaning report per asset | Built |
| `/support-tickets` → `/support-tickets/:id` | Support Tickets, and Report an Issue | Built |
| `/profile` | The signed-in administrator's own profile | Built |
| Other sidebar sections | Asset Management, Users & Access, Settings and the rest | Placeholder |

Every screen under the shell carries the help assistant, bottom right. It
answers from the client's `Olivine_APP_AI_Chatbot_FAQ_` sheet - the 99 rows
marked for EMMS-E - and from nothing else; there is no model behind it. See
`src/lib/help-bot.ts` for the matching and `src/data/faq.ts` for the rows. When
it has no approved answer it offers Report an Issue, which is the client's own
rule: a ticket is the escalation path for what the chatbot cannot resolve.

### Support tickets

One ticket model covers all three products. The client settled that every
enterprise-to-OCC message is a ticket - "a request or a complaint" - and that
EVITA raises none, since an ELPREMAR has the chatbot instead. So Report an
Issue lives here, with the same fields as EVITA's dialog and OCC's raise
screen, and OCC's console is the receiving end.

What differs is the surface, not the ticket. EVITA shows a card per issue and
folds the desk's three states into Pending / Completed, because on a tablet the
thing being read is a short story. EMMS-E is a desk portal, so tickets are a
table like Tasks, Inspections and Reports, and the status column reads the
desk's own Open / In Progress / Closed - an administrator chasing a ticket
wants to know whether anybody has picked it up.

### Reports

A report is never free-standing. An ELPREMAR inspects an asset in EVITA, which
gives an Inspection ID and the contamination and hygiene readings that score
the asset; that inspection raises the maintenance, which gives a Task ID and
the before-and-after of the clean. So every row on `/reports` names the
inspection it was read off and, once a clean has happened, the task that
produced the cleaning report, and both link straight through.

The three documents in `public/reports` are the client's own samples, carried
across from EVITA, and stand in until the reporting service exists -
`src/data/report-documents.ts` is the one place to swap them for real URLs.

Demo sign-in: any password and any 6-digit code are accepted. `TSL-ENT-001` or `rahul.mehta@tatasteel.com` signs in as the enterprise admin; `kavita.iyer@tatasteel.com` as a plant maintenance supervisor, whose code goes by SMS.

### Differences from the mockup

- The asset table shows **Digital Asset ID** instead of "Asset Tag ID": the client confirmed the system-generated Digital Asset ID is the only asset identifier.
- Health labels come from `src/lib/status.ts`, shared with OCC, which currently reads Healthy / Alarming / At Risk where the mockup says Healthy / Attention / Critical.
- Inspection Type and Maintenance Type come from `src/data/master-data.ts`, worded as the parameter sheet words them. The sheet lists three maintenance types and no "Corrective" or "Emergency", so neither is offered anywhere.

## Where this came from

The sign-in screens were first built inside occ-frontend, which served all three brands from one deployment chosen by hostname. EMMS-E keeps only its own presentation:

| occ-frontend | here |
|---|---|
| `src/config/brands.ts` (`emmse` entry) | `src/config/brand.ts` |
| `src/components/auth/*`, `src/pages/auth/*` (three brands) | EMMS-E-only versions |
| `src/lib/auth/*` (OCC demo accounts) | EMMS-E roles and demo accounts |

These files are copied as-is and should be kept in step with occ-frontend until they move into a shared package:

- `src/index.css`: colour tokens (plus the sign-in animations from evita-frontend)
- `src/components/ui/badge.tsx`, `button.tsx`, `table.tsx`: OLIVINE variants
- `src/lib/status.ts`, `src/lib/validation.ts`, `src/data/master-data.ts`
- `src/components/common/*`: page header, section card, stat card, donut chart

## Authentication

Everything under the app shell is behind `RequireAuth`. The OTP is **not** implemented in this repository: codes are issued and verified by AWS (Cognito, SNS, SES). Each placeholder in `src/lib/auth/auth-service.ts` is marked `TODO(aws)`. Sessions live in `sessionStorage`, or in `localStorage` when "Remember me" is ticked.

## Theming

All colours are CSS variables in `src/index.css`, exposed as Tailwind classes. Use tokens, never hex values: `brand-navy`, `brand-gold`, `healthy` / `attention` / `critical` / `offline`, `success` / `warning` / `info` / `neutral` / `highlight`, `sidebar-*`, `topbar`. Use `src/lib/status.ts` for anything status-related.

EMMS-E is a desk portal, so it keeps OCC's 14px root scale (13px under 1024px) rather than EVITA's tablet sizing.

## Before production

- Replace the photograph behind the sign-in and on the dashboard banner (`public/brand/emmse-scene.jpg`) with OLIVINE's own licensed image.
- Connect `src/lib/auth/auth-service.ts` to AWS Cognito. Until then every credential is accepted.
- Replace the dashboard mock data (`src/data/dashboard.ts`) with API calls scoped to the signed-in enterprise.
