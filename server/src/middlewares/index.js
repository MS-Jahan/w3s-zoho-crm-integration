const logger = require('../utils/logger');

/** Request logging middleware: method, path, status, duration. */
function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();
  res.on('finish', () => {
    const ms = Number(process.hrtime.bigint() - start) / 1e6;
    logger.info(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms.toFixed(1)}ms)`);
  });
  next();
}

/** Minimal security headers (helmet-style, no dependency). */
function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
}

/** Simple in-memory rate limiter: windowMs per IP. */
function rateLimit({ windowMs = 60_000, max = 120 } = {}) {
  const hits = new Map(); // ip → { count, resetAt }
  setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) if (entry.resetAt < now) hits.delete(ip);
  }, windowMs).unref();

  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = hits.get(ip);
    if (!entry || entry.resetAt < now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(ip, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      const err = new Error('Too many requests, please slow down');
      err.status = 429;
      err.zohoError = 'RATE_LIMITED';
      err.retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return next(err);
    }
    next();
  };
}

/**
 * Tenant context: reads an optional `X-Client-Id` header, sanitizes it, and
 * attaches `req.tenantId` (defaults to 'default'). Unknown tenants fail fast
 * with 400 UNKNOWN_TENANT when their service is first resolved. Credential
 * lookup itself lives in resolveTenantCredentials (zoho.service) — point it
 * at a vault/DB to onboard real tenants.
 */
function tenantContext(req, _res, next) {
  const raw = String(req.headers['x-client-id'] || 'default').trim().toLowerCase();
  if (!/^[a-z0-9_-]{1,64}$/.test(raw)) {
    const err = new Error('Invalid X-Client-Id header (use 1-64 chars: a-z, 0-9, _ -)');
    err.status = 400;
    err.zohoError = 'INVALID_TENANT_ID';
    return next(err);
  }
  req.tenantId = raw;
  next();
}

/** Graceful shutdown on SIGTERM/SIGINT. */
function gracefulShutdown(server, loggerRef) {
  const shutdown = (signal) => {
    loggerRef.info(`${signal} received — closing server...`);
    server.close(() => {
      loggerRef.info('Server closed cleanly');
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

module.exports = { requestLogger, securityHeaders, rateLimit, tenantContext, gracefulShutdown };
