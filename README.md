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
| GET | `/api/health` | Health + config check |
| GET | `/api/leads` | List leads (ID, Name, Email, Phone, Company) |
| POST | `/api/leads` | Create lead |
| GET | `/api/leads/:id` | Get lead by Record ID |
| GET | `/api/test-error?type=token\|field\|module` | Error simulation (alias: `/api/simulate-error`) |

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

## OAuth Auto-Refresh

`ZohoService.getAccessToken()` caches the access token in memory and refreshes via the Refresh Token grant only when expired (60s safety margin) or when a 401 is received (single retry).

## Error Handling

Zoho errors (e.g. `INVALID_TOKEN`, `MANDATORY_NOT_FOUND`, `INVALID_MODULE`) are parsed by the centralized error middleware and returned as clean JSON; the frontend shows matching toasts.

