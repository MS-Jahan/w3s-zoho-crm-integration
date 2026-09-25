# 2026-09-25-ui-ux-and-backend-upgrade.md

Plan to make the frontend more appealing (animation, loading, UI elements) and the backend more professional.

## Part A — Frontend Upgrade (Operate mode: scanability + precise craft)

### A1. Visual system
1. **Design tokens in Tailwind config**: custom font stack (Inter via system fallback), refined primary palette, custom keyframes (fade-in, slide-up, shimmer, pulse-soft).
2. **Theme toggle** (light/dark) in Navbar with `localStorage` persistence and smooth `transition-colors` on all surfaces.

### A2. Loading & skeleton states (perceived performance)
3. **Skeleton table**: `LeadTable` shows shimmering skeleton rows (`animate-pulse` blocks) while fetching instead of a lone spinner.
4. **Skeleton cards** for the form/error panel on first paint.
5. **Button loading states** everywhere: spinner + disabled + "Creating…" copy on submit; "Refreshing…" on Navbar button.

### A3. Motion & micro-interactions (purposeful, not decorative)
6. **Page entrance**: staggered fade/slide-up on the three main cards (150ms stagger).
7. **Table rows**: fade-in per row; hover state with subtle background + scale on View Record button.
8. **Modal**: scale/fade entrance animation (DaisyUI + custom keyframes).
9. **Toast**: slide-in-right + auto-dismiss progress hint; success toasts get a check icon, errors an alert icon (lucide).
10. **Status badge**: animated ping dot when connected.
11. **Form focus rings**: primary-colored focus transitions on all inputs.

### A4. UI elements
12. **Stats row**: 3 stat cards above the table (Total Leads, Leads Today, API Status) with lucide icons — gives the dashboard hierarchy.
13. **Empty state**: proper illustration-less empty state with icon + CTA instead of plain text.
14. **Error simulator**: grouped in a collapse/card with "danger zone" styling and per-button error-code badges.
15. **Table polish**: monospace Record IDs with copy-to-clipboard button, relative "Created" info in modal, email as mailto link.
16. **Footer**: minimal footer with stack credits.

### A5. Files touched
- `tailwind.config.js` (tokens/keyframes), `index.css` (utility keyframes)
- `App.jsx` (stats state, entrance animations, theme provider logic)
- `Navbar.jsx` (theme toggle, ping dot), `LeadTable.jsx` (skeletons, row anim, copy ID)
- `LeadForm.jsx` (button states), `LeadDetailsModal.jsx` (anim, richer detail rows)
- `ErrorSimulator.jsx` (danger styling), new `StatsCards.jsx`, `Skeleton.jsx`

## Part B — Backend Professionalization

### B1. Structure & reliability
1. **Layered validation**: dedicated `validators/lead.validator.js` (email regex, phone, required fields, trim/sanitize) — keep Zoho as source of truth but fail fast with clear 400s.
2. **Request logging**: `morgan`-style custom logger middleware (method, path, status, ms) — no new dependency, keep it small.
3. **Rate limiting**: simple in-memory rate limiter (60 req/min/IP) on `/api` — no external store needed for a demo.
4. **Graceful shutdown**: SIGTERM/SIGINT → close server, log, exit.
5. **404 JSON for non-API routes too**; helmet-style security headers via small custom middleware (X-Content-Type-Options, X-Frame-Options, etc.) — no new dep.
6. **Health check upgrade**: uptime, token-cache state (has token, expires-in seconds — never the token itself), version.

### B2. Config & DX
7. **Centralized logger** (`utils/logger.js`) with timestamped levels; replace stray console calls.
8. **JSDoc on every service method** (mostly present) + consistent error contract documented in README.
9. **`npm run dev` with nodemon-free `node --watch`** (already), add `npm start` prod script — already present.
10. **Add `GET /api/leads/:id` field whitelist** so raw payload never leaks internals (already maps; tighten `raw` behind `?full=true`).

## Verification
- Rebuild client (`npm run build`), boot server, browser E2E again via agent-browser: theme toggle, skeleton on refresh, create lead, toasts, modal, error panel.
- Re-test backend endpoints incl. rate-limit 429 and validation 400.
