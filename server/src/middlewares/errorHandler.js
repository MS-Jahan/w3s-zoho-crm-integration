/**
 * Centralized error handler.
 * Parses Zoho API error payloads and returns a clean JSON format:
 * { success, error: { code, message, status } }
 */
function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;
  const code = err.zohoError || err.code || 'INTERNAL_ERROR';
  const message = err.message || 'Unexpected server error';

  if (status >= 500) console.error('[error]', err);
  else console.warn(`[error] ${status} ${code}: ${message}`);

  // Surface rate-limit backoff hints (set by the rate limiter) as both
  // a Retry-After header and a response field; absent for all other errors.
  if (err.retryAfter) res.setHeader('Retry-After', String(err.retryAfter));

  res.status(status).json({
    success: false,
    error: {
      code,
      message,
      status,
      ...(err.retryAfter ? { retryAfter: err.retryAfter } : {}),
      ...(err.zohoDetails ? { details: err.zohoDetails } : {}),
    },
  });
}

module.exports = errorHandler;
