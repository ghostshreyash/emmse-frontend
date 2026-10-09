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
| Other sidebar sections | Asset Management, Maintenance Activities, Reports & Analytics and the rest | Placeholder |

Demo sign-in: any password and any 6-digit code are accepted. `TSL-ENT-001` or `rahul.mehta@tatasteel.com` signs in as the enterprise admin; `kavita.iyer@tatasteel.com` as a plant maintenance supervisor, whose code goes by SMS.

### Differences from the mockup

- The asset table shows **Digital Asset ID** instead of "Asset Tag ID": the client confirmed the system-generated Digital Asset ID is the only asset identifier.
- Health labels come from `src/lib/status.ts`, shared with OCC, which currently reads Healthy / Alarming / At Risk where the mockup says Healthy / Attention / Critical.

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
