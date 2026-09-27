const axios = require('axios');
const config = require('../config/zoho.config');

/**
 * ZohoService handles OAuth2 token lifecycle and Zoho CRM Leads CRUD.
 * Access tokens are cached in memory and refreshed only when expired or on 401.
 */
class ZohoService {
  constructor() {
    this._accessToken = null;
    this._tokenExpiresAt = 0; // epoch ms
  }

  /**
   * Returns a valid access token. Uses in-memory cache when possible.
   * @param {boolean} forceRefresh - bypass cache (used after a 401).
   */
  async getAccessToken(forceRefresh = false) {
    if (!forceRefresh && this._accessToken && Date.now() < this._tokenExpiresAt - 60_000) {
      return this._accessToken;
    }

    const url = `${config.accountsDomain}/oauth/v2/token`;
    const params = {
      refresh_token: config.refreshToken,
      client_id: config.clientId,
      client_secret: config.clientSecret,
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

  /** Execute a Zoho request; on 401, refresh token once and retry. */
  async _request(method, url, { data, params, token } = {}) {
    const accessToken = token || (await this.getAccessToken());
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
      throw this._mapZohoError(error);
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
    const url = `${config.apiDomain}/crm/v3/Leads`;

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

  /** Create a Lead with mandatory fields validated. */
  async createLead(leadData) {
    const required = ['Last_Name', 'Company'];
    const missing = required.filter((f) => !leadData[f] || !String(leadData[f]).trim());
    if (missing.length) {
      const err = new Error(`Missing required field(s): ${missing.join(', ')}`);
      err.status = 400;
      err.zohoError = 'MANDATORY_NOT_FOUND';
      throw err;
    }

    const url = `${config.apiDomain}/crm/v3/Leads`;
    const payload = { data: [leadData] };
    const result = await this._request('post', url, { data: payload });
    const row = (result.data && result.data[0]) || {};
    if (row.status === 'error') {
      const err = new Error(row.message || 'Zoho rejected the lead');
      err.status = 400;
      err.zohoError = row.code || 'LEAD_CREATE_FAILED';
      throw err;
    }
    return { id: row.details?.id, status: row.status || 'success', message: row.message || 'Lead created' };
  }

  /** Fetch a single Lead by Record ID. */
  async getLeadById(recordId) {
    const url = `${config.apiDomain}/crm/v3/Leads/${encodeURIComponent(recordId)}`;
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
    const url = `${config.apiDomain}/crm/v3/InvalidModuleName`;
    return this._request('get', url);
  }

  /** Delete a Lead by Record ID. */
  async deleteLead(recordId) {
    const url = `${config.apiDomain}/crm/v3/Leads/${encodeURIComponent(recordId)}`;
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

    const url = `${config.apiDomain}/crm/v3/Leads`;
    const body = { data: [{ id: recordId, ...payload }] };
    const data = await this._request('put', url, { data: body });
    const row = (data.data && data.data[0]) || {};
    if (row.status === 'error') {
      const err = new Error(row.message?.message || row.message || 'Zoho rejected the update');
      err.status = 400;
      err.zohoError = row.code || 'LEAD_UPDATE_FAILED';
      throw err;
    }
    return { id: row.details?.id || recordId, status: row.status || 'success', message: row.message || 'Lead updated', updatedFields: Object.keys(payload) };
  }
}

module.exports = new ZohoService();
