# 2026-09-25-pagination-and-lead-editing.md

Add pagination and lead editing to the CRM dashboard (extends the redesign doc).

## Backend
1. `ZohoService.getLeads({ page, per_page })` — pass Zoho's `page`/`per_page` params, return `{ leads, page, perPage, moreRecords }` from Zoho's `info` block.
2. `ZohoService.updateLead(recordId, fields)` — `PUT /crm/v3/Leads` with `{ data: [{ id, ...fields }] }`; only send provided/changed fields.
3. Routes: `PUT /api/leads/:id`; `GET /api/leads?page=&per_page=` (defaults 1 / 25).

## Frontend
4. `api.js`: `fetchLeads(filters)` gains page params and returns pagination info; add `updateLead(id, data)`.
5. `LeadTable`: pagination footer (Prev / page N / Next, disabled states), per-page selector (10/25/50), Edit button per row.
6. New `LeadEditModal.jsx`: prefilled form (First/Last name, Company, Email, Phone) with the same validation as create; PUT on save → toast → table refresh.
7. `App.jsx`: page state, reset to page 1 on refresh; pass handlers.

## Editing options included
- Edit core fields: First/Last Name, Company, Email, Phone.
- Delete (existing) + copy ID (existing).
- View full record metadata (existing modal).

## Verification
- Live: PUT round-trip (update then get-by-ID), pagination params against Zoho.
- Browser E2E: pagination controls, edit flow with toast, table refresh.
