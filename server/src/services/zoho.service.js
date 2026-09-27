const axios = require('axios');
const config = require('../config/zoho.config');
const logger = require('../utils/logger');

/** Sleep helper for backoff delays. */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Parse a Retry-After response header (seconds or HTTP date) into milliseconds.
 * Returns null when absent or unparsable.
 */
function parseRetryAfter(headers) {
  const raw = headers?.['retry-after'];
  if (raw == null || raw === '') return null;
  const secs = Number(raw);
  if (Number.isFinite(secs) && secs >= 0) return secs * 1000;
  const at = Date.parse(raw);
  if (!Number.isNaN(at)) return Math.max(0, at - Date.now());
  return null;
}

/**
 * Resolve OAuth credentials for a tenant.
 * Today only the 'default' tenant exists (environment variables). Plug a
 * vault/DB lookup here to onboard additional tenants — each tenant gets its
 * own ZohoService instance (and therefore its own token cache), so tokens
 * and CRM data can never cross tenant boundaries.
 */
function resolveTenantCredentials(tenantId) {
  if (!tenantId || tenantId === 'default') {
    return {
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken,
      accountsDomain: config.accountsDomain,
      apiDomain: config.apiDomain,
    };
  }
  // Demo secondary tenant configured for multi-tenancy evaluation
  if (tenantId === 'tenant_demo') {
    return {
      clientId: process.env.ZOHO_CLIENT_ID_DEMO || config.clientId,
      clientSecret: process.env.ZOHO_CLIENT_SECRET_DEMO || config.clientSecret,
      refreshToken: process.env.ZOHO_REFRESH_TOKEN_DEMO || config.refreshToken,
      accountsDomain: config.accountsDomain,
      apiDomain: config.apiDomain,
    };
  }

  const err = new Error(`Unknown tenant: "${tenantId}". Supported tenants: default, tenant_demo`);
  err.status = 400;
  err.zohoError = 'UNKNOWN_TENANT';
  throw err;
}

/**
 * ZohoService handles OAuth2 token lifecycle and Zoho CRM Leads CRUD.
 * Access tokens are cached in memory and refreshed only when expired or on 401.
 * One instance serves exactly one tenant (see getZohoService factory below).
 */
class ZohoService {
  constructor(creds) {
    this.creds = creds || resolveTenantCredentials('default');
    this._accessToken = null;
    this._tokenExpiresAt = 0; // epoch ms
    // Recently created emails: { lowerEmail -> { id, expiresAt } }. Covers the
    // window where Zoho's /search index hasn't caught up with a fresh insert
    // (observed ~1min+ lag). Per instance like the token cache — on serverless
    // each instance guards its own recent writes; Zoho search + Unique-field
    // rules remain the cross-instance backstops.
    this._recentEmails = new Map();
  }

  get apiDomain() {
    return this.creds.apiDomain;
  }

  /**
   * Returns a valid access token. Uses in-memory cache when possible.
   * @param {boolean} forceRefresh - bypass cache (used after a 401).
   */
  async getAccessToken(forceRefresh = false) {
    if (!forceRefresh && this._accessToken && Date.now() < this._tokenExpiresAt - 60_000) {
      return this._accessToken;
    }

    const url = `${this.creds.accountsDomain}/oauth/v2/token`;
    const params = {
      refresh_token: this.creds.refreshToken,
      client_id: this.creds.clientId,
      client_secret: this.creds.clientSecret,
      grant_type: 'refresh_token',
    };

    const { data } = await axios.post(url, null, { params, timeout: 15_000 });

    if (!data.access_token) {
      const err = new Error(data.error || 'Failed to refresh Zoho access token');
      // Keep codes UPPER_SNAKE like the rest of the API; preserve Zoho's
      // raw snake_case string (e.g. "invalid_client_secret") in details.
      err.zohoError = 'INVALID_CREDENTIALS';
      if (data.error) err.zohoDetails = { zoho_error: data.error };
      err.status = 401;
      throw err;
    }

    this._accessToken = data.access_token;
    // expires_in is seconds; subtract a safety margin of 60s
    this._tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
    return this._accessToken;
  }

  /** Build auth headers; accepts an explicit (possibly invalid) token for demos. */
  _headers(token) {
    return {
      Authorization: `Zoho-oauthtoken ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /** Map Zoho API errors into a normalized error object. */
  _mapZohoError(error) {
    if (error.response) {
      const { status, data } = error.response;
      // Zoho error shapes: { code, message, status } (auth) or { data: [{ code, details, message, status }] } (batch)
      const node = Array.isArray(data) ? data[0] : Array.isArray(data?.data) ? data.data[0] : data;
      const code = node?.code || 'ZOHO_API_ERROR';
      const message = node?.message || node?.detail || 'Zoho API request failed';
      const err = new Error(message);
      err.status = status === 400 ? 400 : status || 500;
      err.zohoError = code;
      err.zohoDetails = node?.details || null;
      return err;
    }
    const err = new Error(error.message || 'Network error contacting Zoho');
    err.status = 502;
    err.zohoError = 'ZOHO_UNREACHABLE';
    return err;
  }

  /**
   * Execute a Zoho request with a bounded retry strategy:
   *  - 401 (revoked/early-expiry): refresh token once and retry (any method).
   *  - 429: honor Retry-After when present, else exponential backoff (any method —
   *    a 429 means Zoho throttled the call without processing it, so retry is safe).
   *  - Network failure / 502 / 503 / 504: exponential backoff, but ONLY for
   *    idempotent methods (GET/DELETE). POST/PUT are not retried here because a
   *    response lost in transit could otherwise create/update a record twice.
   * Delays: 500ms * 2^attempt + jitter, capped at 10s; max 3 attempts total.
   */
  async _request(method, url, { data, params, token } = {}, attempt = 0) {
    const accessToken = token || (await this.getAccessToken());
    const idempotent = method === 'get' || method === 'delete';
    try {
      const res = await axios({ method, url, headers: this._headers(accessToken), data, params, timeout: 20_000 });
      return res.data;
    } catch (error) {
      if (error.response?.status === 401 && !token) {
        // Token may have been revoked/expired early — refresh once and retry.
        const fresh = await this.getAccessToken(true);
        const res = await axios({ method, url, headers: this._headers(fresh), data, params, timeout: 20_000 });
        return res.data;
      }
      const status = error.response?.status || 0;
      const retryAfterMs = parseRetryAfter(error.response?.headers);
      const retryable = status === 429 || (idempotent && (status === 0 || status >= 500));
      if (retryable && attempt < 2) {
        const delay = Math.min(retryAfterMs ?? (500 * 2 ** attempt + Math.random() * 250), 10_000);
        logger.warn(`[zoho] ${method.toUpperCase()} ${status || 'NETWORK'} — retry ${attempt + 1}/2 in ${Math.round(delay)}ms`);
        await sleep(delay);
        return this._request(method, url, { data, params, token }, attempt + 1);
      }
      throw this._mapZohoError(error);
    }
  }

  /**
   * Best-effort duplicate lookup by exact email. Returns { id, email } of the
   * first match, or null. Fails OPEN (returns null) so a search hiccup never
   * blocks legitimate creation — the hard backstop is a Unique-field rule in
   * Zoho CRM, whose DUPLICATE_DATA response is mapped to 409 below.
   */
  async findLeadByEmail(email) {
    const clean = String(email || '').trim();
    if (!clean) return null;
    const escaped = clean.replace(/["'\\;()*]/g, '');
    if (!escaped) return null;
    try {
      const data = await this._request('get', `${this.creds.apiDomain}/crm/v3/Leads/search`, {
        params: { fields: 'Email', per_page: 1, page: 1, criteria: `(Email:equals:${escaped})` },
      });
      const hit = (data.data || [])[0];
      return hit ? { id: hit.id, email: hit.Email || clean } : null;
    } catch (error) {
      logger.warn(`[zoho] duplicate pre-check skipped: ${error.message}`);
      return null;
    }
  }

  /**
   * Fetch Leads with pagination. When `search` is provided, queries Zoho
   * server-side via criteria (Last_Name/Email/Company contains) — falls back
   * to post-fetch filtering if Zoho rejects the criteria.
   * @param {{page?: number, perPage?: number, search?: string, company?: string}} [opts]
   */
  async getLeads(opts = {}) {
    const page = Math.max(1, parseInt(opts.page, 10) || 1);
    const perPage = Math.min(200, Math.max(1, parseInt(opts.perPage, 10) || 25));
    const url = `${this.creds.apiDomain}/crm/v3/Leads`;

    const mapLead = (r) => ({
      id: r.id,
      fullName: [r.First_Name, r.Last_Name].filter(Boolean).join(' ') || r.Last_Name || '—',
      email: r.Email || null,
      phone: r.Phone || null,
      company: r.Company || null,
      createdTime: r.Created_Time || null,
    });

    const q = opts.search ? String(opts.search).trim() : '';

    if (q) {
      // Server-side search via the dedicated /search endpoint. Note: Zoho's
      // 'equals' operator behaves like 'contains' per the Search Records docs.
      const escaped = q.replace(/["'\\;()*]/g, ''); // strip chars that break criteria
      if (escaped) {
        const criteria = `((Last_Name:equals:${escaped}) or (First_Name:equals:${escaped}) or (Email:equals:${escaped}) or (Company:equals:${escaped}))`;
        try {
          const params = { fields: 'First_Name,Last_Name,Email,Phone,Company,Created_Time', per_page: perPage, page, criteria };
          const data = await this._request('get', `${url}/search`, { params });
          return {
            leads: (data.data || []).map(mapLead),
            page,
            perPage,
            moreRecords: !!data.info?.more_records,
          };
        } catch (error) {
          // Criteria unsupported / no results edge cases — fall through to post-fetch fallback.
          if (error.status !== 400) throw error;
        }
      }
    }

    // Default (no search or criteria fallback): plain paginated fetch + post-filter
    const params = { fields: 'First_Name,Last_Name,Email,Phone,Company,Created_Time', per_page: perPage, page };
    const data = await this._request('get', url, { params });
    let leads = (data.data || []).map(mapLead);

    if (q) {
      const lq = q.toLowerCase();
      leads = leads.filter(
        (l) =>
          (l.fullName || '').toLowerCase().includes(lq) ||
          (l.email || '').toLowerCase().includes(lq) ||
          (l.company || '').toLowerCase().includes(lq)
      );
    }
    if (opts.company) {
      const c = String(opts.company).toLowerCase();
      leads = leads.filter((l) => (l.company || '').toLowerCase().includes(c));
    }
    return {
      leads,
      page,
      perPage,
      moreRecords: !!data.info?.more_records,
    };
  }

  /** Create a Lead with mandatory fields validated and duplicate email rejected. */
  async createLead(leadData) {
    const required = ['Last_Name', 'Company'];
    const missing = required.filter((f) => !leadData[f] || !String(leadData[f]).trim());
    if (missing.length) {
      const err = new Error(`Missing required field(s): ${missing.join(', ')}`);
      err.status = 400;
      err.zohoError = 'MANDATORY_NOT_FOUND';
      throw err;
    }

    // Duplicate prevention (three layers):
    //  1. Recent-writes guard below — catches double-submits before Zoho indexes them.
    //  2. Zoho /search pre-check (findLeadByEmail) — catches older records.
    //  3. CRM Unique-field rule on Email (configured in Zoho) — atomic backstop;
    //     its DUPLICATE_DATA response is mapped to 409 further below.
    if (leadData.Email) {
      const key = String(leadData.Email).trim().toLowerCase();
      const recent = this._recentEmails.get(key);
      if (recent && recent.expiresAt > Date.now()) {
        const err = new Error(`A lead with email ${leadData.Email.trim()} already exists (Record ID: ${recent.id})`);
        err.status = 409;
        err.zohoError = 'DUPLICATE_DATA';
        err.zohoDetails = { existingId: recent.id, email: leadData.Email.trim(), source: 'recent' };
        throw err;
      }
      if (recent) this._recentEmails.delete(key); // expired entry
      const existing = await this.findLeadByEmail(leadData.Email);
      if (existing) {
        const err = new Error(`A lead with email ${existing.email} already exists (Record ID: ${existing.id})`);
        err.status = 409;
        err.zohoError = 'DUPLICATE_DATA';
        err.zohoDetails = { existingId: existing.id, email: existing.email, source: 'crm' };
        throw err;
      }
    }

    const url = `${this.creds.apiDomain}/crm/v3/Leads`;
    const payload = { data: [leadData] };
    const result = await this._request('post', url, { data: payload });
    const row = (result.data && result.data[0]) || {};
    if (row.status === 'error') {
      const err = new Error(row.message || 'Zoho rejected the lead');
      // DUPLICATE_DATA is also Zoho's code when a CRM Unique-field rule fires
      // (race between pre-check and insert) — surface it as 409 either way.
      err.status = row.code === 'DUPLICATE_DATA' ? 409 : 400;
      err.zohoError = row.code || 'LEAD_CREATE_FAILED';
      if (row.details) err.zohoDetails = row.details;
      throw err;
    }
    const createdId = row.details?.id;
    if (leadData.Email && createdId) {
      // Remember this write so an immediate retry/double-submit 409s even
      // before Zoho's search index catches up. Prune occasionally to bound size.
      this._recentEmails.set(String(leadData.Email).trim().toLowerCase(), {
        id: createdId,
        expiresAt: Date.now() + 10 * 60_000,
      });
      if (this._recentEmails.size > 1000) {
        const now = Date.now();
        for (const [k, v] of this._recentEmails) if (v.expiresAt <= now) this._recentEmails.delete(k);
      }
    }
    return { id: createdId, status: row.status || 'success', message: row.message || 'Lead created' };
  }

  /** Fetch a single Lead by Record ID. */
  async getLeadById(recordId) {
    const url = `${this.creds.apiDomain}/crm/v3/Leads/${encodeURIComponent(recordId)}`;
    const data = await this._request('get', url, {
      params: { fields: 'First_Name,Last_Name,Email,Phone,Company,Mobile,Website,Lead_Status,Lead_Source,Industry,Created_Time,Modified_Time' },
    });
    const r = (data.data || [])[0];
    if (!r) {
      const err = new Error('Lead not found');
      err.status = 404;
      err.zohoError = 'INVALID_DATA';
      throw err;
    }
    return {
      id: r.id,
      firstName: r.First_Name || null,
      lastName: r.Last_Name || null,
      fullName: [r.First_Name, r.Last_Name].filter(Boolean).join(' ') || null,
      email: r.Email || null,
      phone: r.Phone || null,
      company: r.Company || null,
      createdTime: r.Created_Time || null,
      modifiedTime: r.Modified_Time || null,
      // Additional profile fields (may legitimately be empty in CRM)
      mobile: r.Mobile || null,
      website: r.Website || null,
      leadStatus: r.Lead_Status || null,
      leadSource: r.Lead_Source || null,
      industry: r.Industry || null,
      owner: r.Owner?.name || null,
    };
  }

  /** Simulate an invalid-module request (GET /crm/v3/InvalidModuleName). */
  async getInvalidModule() {
    const url = `${this.creds.apiDomain}/crm/v3/InvalidModuleName`;
    return this._request('get', url);
  }

  /** Delete a Lead by Record ID. */
  async deleteLead(recordId) {
    const url = `${this.creds.apiDomain}/crm/v3/Leads/${encodeURIComponent(recordId)}`;
    const data = await this._request('delete', url);
    const row = (data.data && data.data[0]) || {};
    if (row.status === 'error') {
      const err = new Error(row.message || 'Zoho rejected the delete');
      err.status = 400;
      err.zohoError = row.code || 'LEAD_DELETE_FAILED';
      throw err;
    }
    return { id: row.details?.id || recordId, status: row.status || 'success', message: row.message || 'Lead deleted' };
  }

  /**
   * Update a Lead by Record ID. Only sends the whitelisted fields provided.
   * @param {string} recordId
   * @param {{First_Name?: string, Last_Name?: string, Company?: string, Email?: string, Phone?: string}} fields
   */
  async updateLead(recordId, fields) {
    const allowed = ['First_Name', 'Last_Name', 'Company', 'Email', 'Phone'];
    const payload = {};
    for (const key of allowed) {
      if (fields[key] !== undefined && fields[key] !== null && String(fields[key]).trim() !== '') {
        payload[key] = String(fields[key]).trim();
      }
    }
    if (Object.keys(payload).length === 0) {
      const err = new Error('No updatable fields provided');
      err.status = 400;
      err.zohoError = 'VALIDATION_ERROR';
      throw err;
    }
    if (payload.Last_Name !== undefined && !payload.Last_Name) {
      const err = new Error('Last Name cannot be empty');
      err.status = 400;
      err.zohoError = 'MANDATORY_NOT_FOUND';
      throw err;
    }

    const url = `${this.creds.apiDomain}/crm/v3/Leads`;
    const body = { data: [{ id: recordId, ...payload }] };
    const data = await this._request('put', url, { data: body });
    const row = (data.data && data.data[0]) || {};
    if (row.status === 'error') {
      const err = new Error(row.message?.message || row.message || 'Zoho rejected the update');
      err.status = row.code === 'DUPLICATE_DATA' ? 409 : 400;
      err.zohoError = row.code || 'LEAD_UPDATE_FAILED';
      if (row.details) err.zohoDetails = row.details;
      throw err;
    }
    return { id: row.details?.id || recordId, status: row.status || 'success', message: row.message || 'Lead updated', updatedFields: Object.keys(payload) };
  }
}

/**
 * Per-tenant service factory. Each tenant resolves to its own ZohoService
 * instance with an isolated token cache — credentials and access tokens are
 * never shared across tenants. The default export preserves the original
 * singleton behavior for single-tenant use.
 */
const _tenantServices = new Map();
function getZohoService(tenantId) {
  const key = tenantId || 'default';
  if (!_tenantServices.has(key)) {
    _tenantServices.set(key, new ZohoService(resolveTenantCredentials(key)));
  }
  return _tenantServices.get(key);
}

const defaultService = getZohoService('default');
module.exports = defaultService;
module.exports.getZohoService = getZohoService;
module.exports.resolveTenantCredentials = resolveTenantCredentials;
