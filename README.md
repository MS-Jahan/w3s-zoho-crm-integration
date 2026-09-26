# Zoho CRM Integration Dashboard

Full-stack integration between Node.js/Express and Zoho CRM, paired with a React (Vite) + DaisyUI frontend.

## Tech Stack

- **Backend:** Node.js, Express, Axios, dotenv, cors
- **Frontend:** React (Vite), Tailwind CSS, DaisyUI, lucide-react, Axios

## Setup

### 1. Zoho credentials (Developer Console)

1. Create a **Self Client** at [api-console.zoho.com](https://api-console.zoho.com).
2. Select scope `ZohoCRM.modules.ALL` (or `ZohoCRM.modules.leads.ALL`) and generate a one-time **Grant Token**.
3. Exchange it for tokens:
   ```bash
   curl -X POST "https://accounts.zoho.com/oauth/v2/token" \
     -d "grant_type=authorization_code" \
     -d "client_id=<CLIENT_ID>" \
     -d "client_secret=<CLIENT_SECRET>" \
     -d "code=<GRANT_TOKEN>"
   ```
4. Copy the returned `refresh_token` into `server/.env`.

### 2. Environment variables (`server/.env`)

See `server/.env.example`:

| Variable | Example |
|---|---|
| `ZOHO_CLIENT_ID` | `1000.XXXX...` |
| `ZOHO_CLIENT_SECRET` | `xxxx...` |
| `ZOHO_REFRESH_TOKEN` | `1000.xxxx...` |
| `ZOHO_ACCOUNTS_DOMAIN` | `https://accounts.zoho.com` |
| `ZOHO_API_DOMAIN` | `https://www.zohoapis.com` |
| `PORT` | `5000` |

Optional (client, `client/.env`):

| Variable | Example | Purpose |
|---|---|---|
| `VITE_ZOHO_CRM_UI_DOMAIN` | `https://crm.zoho.com/crm/org/12345678/tab/Leads` | Enables "Open in Zoho CRM" deep link in the details modal |

Never commit `.env` or hardcode tokens.

### 3. Run

```bash
# Backend
cd server && npm install && npm run dev     # http://localhost:5000

# Frontend (new terminal)
cd client && npm install && npm run dev     # http://localhost:5173
```

The Vite dev server proxies `/api` → `http://localhost:5000`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health: version, uptime, Zoho config, token-cache state |
| GET | `/api/leads` | Paginated list — `?page=` & `per_page=` (default 25, max 200), `?search=`, `?company=` |
| POST | `/api/leads` | Create lead (validated: `lastName`, `company` required, email format) |
| GET | `/api/leads/:id` | Get lead by Record ID (incl. mobile, website, lead status/source, industry, owner) |
| PUT | `/api/leads/:id` | Update lead fields (`firstName`, `lastName`, `company`, `email`, `phone`) |
| DELETE | `/api/leads/:id` | Delete lead by Record ID |
| GET | `/api/test-error?type=token\|field\|module` | Error simulation (alias: `/api/simulate-error`) |

All requests are rate-limited to 120 req/min per IP (`429` beyond that).
Errors return a consistent contract: `{ success: false, error: { code, message, status, details? } }`.

### Sample: POST /api/leads

Request:
```json
{ "firstName": "John", "lastName": "Doe", "company": "Acme Inc.", "email": "john@acme.com", "phone": "+1 555 000 1234" }
```

Response (201):
```json
{ "success": true, "data": { "id": "1234567890123456789", "status": "success", "message": "Lead created" } }
```

### Sample: Error response

`GET /api/test-error?type=token` → 401:
```json
{ "success": false, "error": { "code": "INVALID_TOKEN", "message": "Authentication failed: invalid or expired OAuth token", "status": 401 } }
```

### Sample: PUT /api/leads/:id

Request:
```json
{ "company": "Updated Co", "phone": "555-9999" }
```

Response:
```json
{ "success": true, "data": { "id": "1234567890123456789", "status": "success", "message": "record updated", "updatedFields": ["Company", "Phone"] } }
```

### Sample: DELETE /api/leads/:id

Response:
```json
{ "success": true, "data": { "id": "1234567890123456789", "status": "success", "message": "record deleted" } }
```

## OAuth Auto-Refresh

`ZohoService.getAccessToken()` caches the access token in memory and refreshes via the Refresh Token grant only when expired (60s safety margin) or when a 401 is received (single retry).

## Features

### Dashboard (React + DaisyUI)
- Linear/Vercel-style dark zinc "Studio" theme (glassmorphism cards, gradient accents), light mode still available
- Stats cards: Total Leads, Ingested Today, API Health with live token badge ("Token Valid · Auto Refresh ON · 58m") polled every 60s
- Lead rows: initials avatars (deterministic gradient), company pills, truncated copyable Record IDs
- Page-size selector (10/25/50) wired to backend `per_page`
- Shimmer skeleton loading states, staggered entrance animations, animated toasts
- **Search** across name, email, and Record ID; **company filter** with autocomplete suggestions
- **Pagination** (25/page, Prev/Next with Zoho `more_records` awareness)
- **Edit leads** via prefilled modal (PUT), delete with confirmation, copy-to-clipboard Record IDs, mailto links
- Lead details modal (auto-opens after creation) with categorized sections — Lead Info & Zoho System Metadata — "Not set in CRM" placeholders for empty fields, and a JSON payload toggle
- Error testing panel triggering real handled Zoho API errors

### Backend (Express)
- OAuth2 refresh-token flow with in-memory access-token cache (auto-refresh on expiry or 401)
- Fail-fast payload validation with per-field error details
- Rate limiting, security headers, request logging with duration, graceful shutdown
- Enriched health check (version, uptime, token-cache expiry — never the token itself)

## Error Handling

Zoho errors (e.g. `INVALID_TOKEN`, `MANDATORY_NOT_FOUND`, `INVALID_MODULE`) are parsed by the centralized error middleware and returned as clean JSON; the frontend shows matching toasts.

Example validation error:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed: Last Name is required; Company is required",
    "status": 400,
    "details": { "fields": [{ "field": "lastName", "message": "Last Name is required" }] }
  }
}
```

