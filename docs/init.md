at first create a docs dir and save this as a init.md in the docs folder. also another rule to be added in AGENTS.md file that when creating any plan or document anything, the file name should consist year, month, day and then the file name like this convention: 2026-09-27-file-name.md


follow this initial prompt. create task list based on the plan and then let's start coding. Do minimal testing in current environment.

these credentials are saved in the .env file in the current project that you definately shouldn't view.

```
ZOHO_CLIENT_ID=1000.XXXXXXXXXXXXXXXXXXXXXXXX
ZOHO_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_REFRESH_TOKEN=1000.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ZOHO_ACCOUNTS_DOMAIN=https://accounts.zoho.com
ZOHO_API_DOMAIN=https://www.zohoapis.com
```

---

### Project Architecture ebong Folder Structure

Ekta clean monorepo/multi-folder structure use kora hobe, jate backend ebong frontend-er concern strictly separated thake:

```text
current-folder/
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── zoho.config.js       # Zoho credentials, scopes, domain URLs
│   │   ├── services/
│   │   │   └── zoho.service.js      # OAuth token refresh, Zoho API CRUD logic
│   │   ├── controllers/
│   │   │   └── lead.controller.js   # Request handlers for leads & errors
│   │   ├── routes/
│   │   │   └── lead.routes.js       # API route definitions
│   │   ├── middlewares/
│   │   │   └── errorHandler.js      # Centralized error handler
│   │   └── server.js                # Express app initialization & port listening
│   ├── .env.example
│   ├── .env
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # DaisyUI header with status badge
│   │   │   ├── LeadForm.jsx         # Form to create new CRM Lead
│   │   │   ├── LeadTable.jsx        # Table showing ID, Name, Email, Company
│   │   │   ├── LeadDetailsModal.jsx # Modal to show single lead by ID
│   │   │   └── ErrorSimulator.jsx   # Trigger API errors for demo
│   │   ├── services/
│   │   │   └── api.js               # Axios calls to Express backend
│   │   ├── App.jsx                  # Main dashboard layout
│   │   └── main.jsx
│   ├── tailwind.config.js           # Tailwind + DaisyUI config
│   └── package.json
└── README.md

```

---

### Core Requirements ebong Specifications

* **OAuth Flow**: Zoho Developer Console theke Client ID, Client Secret, ebong Refresh Token generate korte hobe; kono access token hard-code kora jabe na.


* **Auto-Refresh Mechanism**: Access token-er meyad 1 hour thakay Express backend auto-refresh logic implement korbe ebong in-memory token cache korbe.


* **Read Records**: Zoho CRM theke Leads list fetch kore Record ID, Full Name, Email, ebong Phone/Company field UI-te display korte hobe.


* **Create Record**: First Name, Last Name, Company, Email, ebong Phone submit kore Zoho CRM-e real lead insert korte hobe.


* **Retrieve by ID**: Insert houyar por Zoho theke asha Record ID diye oi specific record punoray fetch kore UI-te verify korte hobe.


* **Simulate & Handle Errors**: Invalid/expired token, missing required field, ba invalid module-er jonno standard error response ebong UI toast display thakbe.


* **Security**: Shob API keys ebong secrets `.env` file-e isolated thakbe ebong demo video ba repo-te direct token dekhano jabe na.



---

### Phased Implementation Plan (AI Agent Task List)

#### Phase 1: Environment & Zoho OAuth Setup

* **Task 1.1**: Zoho Developer Console-e (`api-console.zoho.com`) giye ekta "Self Client" ba "Server-based Application" create kora.


* **Task 1.2**: Scope hishebe `ZohoCRM.modules.ALL` ba `ZohoCRM.modules.leads.ALL` select kore ekta one-time Grant Token generate kora.


* **Task 1.3**: POST request pathiye Grant Token theke `refresh_token` ebong initial `access_token` shongroho kora.


* **Task 1.4**: `server/.env` file-e `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, `ZOHO_REFRESH_TOKEN`, `ZOHO_API_DOMAIN` (e.g., `[https://www.zohoapis.com](https://www.zohoapis.com)`), ebong `ZOHO_ACCOUNTS_DOMAIN` (e.g., `[https://accounts.zoho.com](https://accounts.zoho.com)`) set kora.



#### Phase 2: Express.js Backend Development

* **Task 2.1**: `server/src/services/zoho.service.js`-e ekta `ZohoService` class toiri kora. Ekhane `getAccessToken()` method thakbe ja current token valid thakle in-memory theke return korbe, ar expire hole `refresh_token` diye Zoho accounts URL-e call kore notun access token niye ashbe.


* **Task 2.2**: `getLeads()` method implement kora ja Zoho CRM API endpoint `GET /crm/v3/Leads` call kore records niye ashbe.


* **Task 2.3**: `createLead(leadData)` method implement kora ja payload validate kore `POST /crm/v3/Leads`-e `First_Name`, `Last_Name`, `Company`, `Email`, ebong `Phone` pathabe.


* **Task 2.4**: `getLeadById(recordId)` method implement kora ja `GET /crm/v3/Leads/{recordId}` call kore specific lead return korbe.


* **Task 2.5**: Error handling middleware toiri kora ja Zoho API-er status code (400, 401, 404, 500) ebong Zoho error code (jemon `OAUTH_SCOPE_MISMATCH`, `MANDATORY_NOT_FOUND`) clean format-e frontend-e pathabe.


* **Task 2.6**: Endpoints banano:
* `GET /api/leads`

* `POST /api/leads`

* `GET /api/leads/:id`

* `GET /api/test-error?type=token|field|module` (demo purpose)





#### Phase 3: Vite + React + DaisyUI Frontend Setup

* **Task 3.1**: Tailwind CSS ebong DaisyUI plugin configure kora.
* **Task 3.2**: `Navbar.jsx` banano ja connection status (Connected to Zoho CRM) ebong system overview dekhabe.
* **Task 3.3**: `LeadForm.jsx` toiri kora jekhane client-side validation thakbe (`First Name`, `Last Name`, `Company`, `Email`, `Phone`). Submit korle loading state ebong success toast dekhabe.


* **Task 3.4**: `LeadTable.jsx` toiri kora jekhane fetched leads display hobe columns: `Record ID`, `Full Name`, `Email`, `Company`, ebong `Actions` (View Details button).


* **Task 3.5**: `LeadDetailsModal.jsx` toiri kora, jate table theke ba lead create houyar por returned ID diye call kore lead details pop-up modal-e dekhano jay.



#### Phase 4: Error Handling & Edge Case Simulation

* **Task 4.1**: `ErrorSimulator.jsx` component banano, jekhane 3-ti button thakbe:
1. *Simulate Invalid/Expired Token*: Backend-ke force korbe ekta invalid bearer token pathate, jate HTTP 401 error capture kora jay.


2. *Simulate Missing Required Field*: Mandatory field (jemon `Last_Name`) chara payload submit kore Zoho-r 400 validation error trigger kora.


3. *Simulate Invalid Module*: `GET /crm/v3/InvalidModuleName` call kore 404 module error dekhano.




* **Task 4.2**: Frontend-e alert/toast banano ja error response-er exact reason (e.g. `INVALID_TOKEN`, `MANDATORY_NOT_FOUND`) shundor bhabe display korbe.


---

### Master Prompt for AI Coding Agent

Nicher prompt-ti copy kore AI agent-e dile se puro system shundor bhabe build kore dibe:

```markdown
Role: Senior Full-Stack Engineer specializing in Node.js, Express, and Zoho CRM API Integration.

Objective:
Build a complete, modular, and production-grade integration between Node.js/Express and Zoho CRM, paired with a modern React + DaisyUI frontend.

Tech Stack:
- Backend: Node.js, Express.js, Axios, dotenv, cors
- Frontend: React (Vite), Tailwind CSS, DaisyUI, Lucide-react, Axios

Key Deliverables:

1. Express Backend (`/server`):
- `src/config/zoho.config.js`: Centralize env vars (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN, ZOHO_API_DOMAIN, ZOHO_ACCOUNTS_DOMAIN).
- `src/services/zoho.service.js`:
  - Manage OAuth2 flow using Refresh Token grant.
  - Implement access token memory cache (refresh only when expired or on 401).
  - Implement `getLeads()`: GET `/crm/v3/Leads` (return Record ID, Name, Email, Company).
  - Implement `createLead(data)`: POST `/crm/v3/Leads` with fields: First_Name, Last_Name, Company, Email, Phone.
  - Implement `getLeadById(id)`: GET `/crm/v3/Leads/{id}`.
- `src/controllers/lead.controller.js` and `src/routes/lead.routes.js`:
  - Route: `GET /api/leads`
  - Route: `POST /api/leads`
  - Route: `GET /api/leads/:id`
  - Route: `GET /api/simulate-error?scenario=token|validation|module`
- `src/middlewares/errorHandler.js`:
  - Parse Zoho API error payloads and format friendly responses with status codes.

2. React + DaisyUI Frontend (`/client`):
- A clean single-page dashboard with DaisyUI components:
  - Header: System status badge, Refresh Leads button.
  - Left Column (Create Lead Form): Inputs for First Name, Last Name, Company, Email, Phone with loading spinner.
  - Right Column (CRM Data Table): Clean DaisyUI table listing Record ID, Full Name, Email, Company, and "View Record" button.
  - Record Modal: Displays full JSON / attributes retrieved by Record ID after creation.
  - Error Testing Panel: 3 buttons to trigger and display handled errors (Invalid Token, Missing Field, Invalid Module).
  - Alert Toasts: Real-time feedback for success and handled API errors.

Requirements & Edge Cases:
- Never hardcode Access Tokens.
- Gracefully handle token expiration.
- Sanitize inputs and validate mandatory Zoho fields.
- Include `.env.example` in both client and server.
- Write clean, self-documenting code with English comments and function names.

```
no more questions. keep your questions in docs folder in a doc and keep going with recommended options. full coding part should be done even if you can't test for some reason. if coding part is done, test as much as possible.
