# 2026-09-25-zoho-crm-studio-redesign.md

Role: Senior Frontend Engineer & UI/UX Designer specializing in Tailwind CSS, DaisyUI, and Modern SaaS Dashboards (Linear / Vercel style).

Objective:
Transform the existing Zoho CRM Dashboard into an ultra-modern, polished, enterprise-grade SaaS interface that impresses hiring managers during a technical demo.

Tech Stack:
- React (Vite)
- Tailwind CSS
- DaisyUI (components: card, table, badge, modal, tooltip, loading)
- lucide-react (modern icons)

Design System & Aesthetic Guidelines:
1. Palette: Deep Zinc/Neutral dark theme (`bg-zinc-950`), cards in `bg-zinc-900/70` with `backdrop-blur-md` and crisp `border border-zinc-800/80`.
2. Typography: Clean sans-serif with proper visual hierarchy, muted subtitles (`text-zinc-400`), crisp small caps for table headers (`text-xs tracking-wider uppercase text-zinc-500`).
3. Accent Colors: Emerald for connected status/healthy metrics, Indigo/Violet for primary actions, Rose/Amber for error sandbox triggers.
4. Micro-interactions: Smooth hover transitions (`transition-all duration-200`), glowing focus rings (`focus:ring-2 focus:ring-indigo-500/30`), loading skeletons, and interactive copy buttons with tooltips.

Detailed Component Requirements:

1. Header & Navigation:
- Top bar with a modern app logo/icon, title "Zoho CRM Studio", and a subtitle "Real-time Lead Ingestion & OAuth Sync".
- Right side: Status indicator pill with glowing ping animation ("Zoho OAuth: Active"), followed by a refined "Refresh Records" button with a spinning sync icon on click.

2. Metrics Overview (3 Cards):
- Card 1 (Total Leads): Lucide `Users` icon in an indigo gradient badge, large bold count, subtle subtitle "Synched from CRM".
- Card 2 (Ingested Today): Lucide `UserPlus` icon in an emerald badge, count display, "Local session creations".
- Card 3 (API Health): Lucide `Activity` icon with a pulsing green indicator dot, response time / token health badge ("Token Valid - Auto Refresh ON").

3. Left Column - "Create New Lead" Card:
- Header with title, subtle description, and an icon.
- Form inputs for:
  - First Name & Last Name (grid 2-cols)
  - Company Name (with `Building` icon prefix)
  - Email Address (with `Mail` icon prefix and validation feedback)
  - Phone Number (with `Phone` icon prefix)
- Submit button with gradient background (`bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700`), active loading spinner when submitting, and disabled state handling.

4. Left Column - "Developer Sandbox / Error Testing Panel":
- Styled as a developer debugging console card with a terminal/shield icon.
- Helper text: "Simulate and verify backend error handling for edge cases."
- 3 interactive triggers styled with status pills:
  - "Simulate 401 Unauthorized" (Expired / Invalid Token) -> Rose badge `401 INVALID_TOKEN`
  - "Simulate 400 Bad Request" (Missing Mandatory Field) -> Amber badge `400 MANDATORY_NOT_FOUND`
  - "Simulate 404 Not Found" (Invalid CRM Module) -> Orange badge `404 INVALID_MODULE`
- Triggering these must cleanly display handled error responses in an expandable inline code block or toast without crashing the UI.

5. Right Column - "CRM Leads Management" Table:
- Toolbar above table:
  - Live client-side search input (filter by Name, Email, or Company) with `Search` icon.
  - Total records count badge.
- Table Layout:
  - `Avatar + Lead Name`: Circle avatar with lead initials (derived from First/Last Name) and name in bold white text.
  - `Record ID`: Monospace font, truncated with a 1-click copy icon button that shows a checkmark/tooltip on click.
  - `Email`: Clickable mailto or clean muted text.
  - `Company`: Styled as a subtle neutral pill badge.
  - `Actions`: "View Details" button opening a DaisyUI modal.
- Empty state: Clean placeholder illustration/icon if no records found or during zero search matches.
- Loading state: Clean table row skeletons while fetching.

6. Lead Details Modal:
- DaisyUI dialog modal displaying the record retrieved by ID.
- Clean tabbed or categorized layout showing Lead Info, Zoho System Metadata, and a formatted JSON viewer toggle for technical inspection.
- Close button and a direct "Open in Zoho CRM" link (if URL pattern available).

7. Notification System:
- Floating toast alert container (top-right or bottom-right) displaying green check toasts for creations and red/amber alerts for handled API errors.

Deliverables:
- Refactor the existing React components into clean, modular files (`StatsCards.jsx`, `LeadForm.jsx`, `LeadTable.jsx`, `ErrorTester.jsx`, `LeadModal.jsx`).
- Ensure no hardcoded dummy data breaks the existing backend API integration.
- Ensure 100% responsiveness on tablet and desktop screens.

## Implementation Notes (added by agent)

- Dark-first zinc palette will replace the current DaisyUI `light`/`dark` theme pair with a single custom `studio` theme (dark-only) in `tailwind.config.js` — simplest path to `bg-zinc-950` fidelity while keeping DaisyUI component classes.
- Keep live API contract: `fetchLeads({search, company})`, `createLead`, `fetchLeadById`, `deleteLead`, `simulateError(type)`, `checkHealth`. Health payload already includes `tokenCache` (hasToken / expiresInSec) for the "Token Valid - Auto Refresh ON" badge.
- "Open in Zoho CRM" link: `https://crm.zoho.com/crm/org/<orgId>/tab/Leads/<recordId>` — org ID not in env; implement graceful fallback (link omitted, tooltip "Org ID not configured") or add optional `ZOHO_CRM_UI_DOMAIN`/`ZOHO_ORG_ID` env passthrough later.
- Component renames: `ErrorSimulator.jsx` → `ErrorTester.jsx`, `LeadDetailsModal.jsx` → `LeadModal.jsx`; update `App.jsx` imports.
- Initials avatar: derive from `fullName` words, deterministic hue fallback from name hash.
- Test after build via agent-browser: dark palette, search, create (modal opens), error triggers, toasts, responsiveness at 768px/1280px widths.
