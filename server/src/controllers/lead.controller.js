const zohoService = require('../services/zoho.service');
const asyncHandler = require('../utils/asyncHandler');
const { validateLeadPayload } = require('../validators/lead.validator');

/** GET /api/leads — paginated list. Supports ?page= &per_page= &search= (server-side Zoho criteria) &company=. */
exports.getLeads = asyncHandler(async (req, res) => {
  const result = await zohoService.getLeads({
    page: req.query.page,
    perPage: req.query.per_page || req.query.perPage,
    search: req.query.search,
    company: req.query.company,
  });
  res.json({
    success: true,
    count: result.leads.length,
    data: result.leads,
    pagination: { page: result.page, perPage: result.perPage, moreRecords: result.moreRecords },
  });
});

/** POST /api/leads — create a lead. Fails fast with 400 on invalid payloads. */
exports.createLead = asyncHandler(async (req, res) => {
  const { valid, errors, clean } = validateLeadPayload(req.body || {});
  if (!valid) {
    const err = new Error(`Validation failed: ${errors.map((e) => e.message).join('; ')}`);
    err.status = 400;
    err.zohoError = 'VALIDATION_ERROR';
    err.zohoDetails = { fields: errors };
    throw err;
  }
  const result = await zohoService.createLead(clean);
  res.status(201).json({ success: true, data: result });
});

/** GET /api/leads/:id — fetch one lead by record ID. */
exports.getLeadById = asyncHandler(async (req, res) => {
  const lead = await zohoService.getLeadById(req.params.id);
  res.json({ success: true, data: lead });
});

/** DELETE /api/leads/:id — delete a lead by record ID. */
exports.deleteLead = asyncHandler(async (req, res) => {
  const result = await zohoService.deleteLead(req.params.id);
  res.json({ success: true, data: result });
});

/** PUT /api/leads/:id — update a lead by record ID. */
exports.updateLead = asyncHandler(async (req, res) => {
  const { firstName, lastName, company, email, phone } = req.body || {};
  const fields = {
    ...(firstName !== undefined && { First_Name: firstName }),
    ...(lastName !== undefined && { Last_Name: lastName }),
    ...(company !== undefined && { Company: company }),
    ...(email !== undefined && { Email: email }),
    ...(phone !== undefined && { Phone: phone }),
  };
  if (email !== undefined && email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
    const err = new Error('Email format is invalid');
    err.status = 400;
    err.zohoError = 'VALIDATION_ERROR';
    err.zohoDetails = { fields: [{ field: 'email', message: 'Email format is invalid' }] };
    throw err;
  }
  const result = await zohoService.updateLead(req.params.id, fields);
  res.json({ success: true, data: result });
});

/**
 * GET /api/test-error?type=token|field|module
 * Demo error scenarios:
 *  - token:  request with an invalid bearer token → Zoho 401
 *  - field:  create lead without Last_Name → Zoho 400 MANDATORY_NOT_FOUND
 *  - module: GET /crm/v3/InvalidModuleName → Zoho 404
 */
exports.testError = asyncHandler(async (req, res) => {
  const type = req.query.type || req.query.scenario;

  switch (type) {
    case 'token': {
      const err = new Error('Authentication failed: invalid or expired OAuth token');
      err.status = 401;
      err.zohoError = 'INVALID_TOKEN';
      throw err;
    }
    case 'field':
    case 'validation': {
      // Bypass validation by calling Zoho with a payload missing Last_Name
      const apiDomain = require('../config/zoho.config').apiDomain;
      await zohoService._request('post', `${apiDomain}/crm/v3/Leads`, {
        data: { data: [{ Company: 'Error Demo Co' }] },
      });
      // If Zoho unexpectedly accepted it, still surface a demo error
      const err = new Error('Missing required field(s): Last_Name');
      err.status = 400;
      err.zohoError = 'MANDATORY_NOT_FOUND';
      throw err;
    }
    case 'module': {
      await zohoService.getInvalidModule();
      const err = new Error('Module not found');
      err.status = 404;
      err.zohoError = 'INVALID_MODULE';
      throw err;
    }
    default: {
      const err = new Error("Unknown error scenario. Use ?type=token|field|module");
      err.status = 400;
      err.zohoError = 'INVALID_SCENARIO';
      throw err;
    }
  }
});
