import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30000,
});

api.interceptors.request.use((reqConfig) => {
  const tenantId = localStorage.getItem('active_tenant_id') || 'default';
  reqConfig.headers['X-Client-Id'] = tenantId;
  return reqConfig;
});

/** Normalize axios/Zoho errors into a friendly message. */
function extractError(error) {
  const payload = error.response?.data;
  if (payload?.error) {
    return {
      code: payload.error.code,
      message: payload.error.message,
      status: payload.error.status,
      ...(payload.error.details ? { details: payload.error.details } : {}),
      ...(payload.error.retryAfter !== undefined ? { retryAfter: payload.error.retryAfter } : {}),
    };
  }
  return {
    code: error.code || 'NETWORK_ERROR',
    message: error.message || 'Unexpected error',
    status: error.response?.status || 0,
  };
}

export async function fetchLeads(filters = {}) {
  try {
    const res = await api.get('/leads', { params: filters });
    return {
      success: true,
      data: res.data.data,
      count: res.data.count,
      pagination: res.data.pagination || null,
    };
  } catch (error) {
    return { success: false, ...extractError(error) };
  }
}

export async function updateLead(id, fields) {
  try {
    const res = await api.put(`/leads/${encodeURIComponent(id)}`, fields);
    return { success: true, data: res.data.data };
  } catch (error) {
    return { success: false, ...extractError(error) };
  }
}

export async function deleteLead(id) {
  try {
    const res = await api.delete(`/leads/${encodeURIComponent(id)}`);
    return { success: true, data: res.data.data };
  } catch (error) {
    return { success: false, ...extractError(error) };
  }
}

export async function createLead(lead) {
  try {
    const res = await api.post('/leads', lead);
    return { success: true, data: res.data.data };
  } catch (error) {
    return { success: false, ...extractError(error) };
  }
}

export async function fetchLeadById(id) {
  try {
    const res = await api.get(`/leads/${encodeURIComponent(id)}`);
    return { success: true, data: res.data.data };
  } catch (error) {
    return { success: false, ...extractError(error) };
  }
}

export async function simulateError(type) {
  try {
    const res = await api.get('/test-error', { params: { type } });
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, ...extractError(error) };
  }
}

export async function checkHealth() {
  try {
    const res = await api.get('/health');
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, ...extractError(error) };
  }
}
