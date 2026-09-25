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
      err.zohoError = data.error || 'INVALID_CREDENTIALS';
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

  /** Fetch Leads: returns Record ID, Full Name, Email, Phone, Company. */
  async getLeads() {
    const url = `${config.apiDomain}/crm/v3/Leads`;
    const params = { fields: 'First_Name,Last_Name,Email,Phone,Company', per_page: 50 };
    const data = await this._request('get', url, { params });
    return (data.data || []).map((r) => ({
      id: r.id,
      fullName: [r.First_Name, r.Last_Name].filter(Boolean).join(' ') || r.Last_Name || '—',
      email: r.Email || null,
      phone: r.Phone || null,
      company: r.Company || null,
    }));
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
    const data = await this._request('get', url);
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
      raw: r,
    };
  }

  /** Simulate an invalid-module request (GET /crm/v3/InvalidModuleName). */
  async getInvalidModule() {
    const url = `${config.apiDomain}/crm/v3/InvalidModuleName`;
    return this._request('get', url);
  }
}

module.exports = new ZohoService();
