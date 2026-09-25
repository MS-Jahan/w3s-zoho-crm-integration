/**
 * Lead payload validator.
 * Trims strings, validates email format, and enforces mandatory Zoho fields
 * (Last_Name, Company) so bad requests fail fast with clear 400s.
 */
function validateLeadPayload(body) {
  const errors = [];

  const str = (v) => (typeof v === 'string' ? v.trim() : '');

  const clean = {
    First_Name: str(body.firstName) || undefined,
    Last_Name: str(body.lastName),
    Company: str(body.company),
    Email: str(body.email) || undefined,
    Phone: str(body.phone) || undefined,
  };

  if (!clean.Last_Name) errors.push({ field: 'lastName', message: 'Last Name is required' });
  if (!clean.Company) errors.push({ field: 'company', message: 'Company is required' });

  if (clean.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.Email)) {
    errors.push({ field: 'email', message: 'Email format is invalid' });
  }

  return { valid: errors.length === 0, errors, clean };
}

module.exports = { validateLeadPayload };
