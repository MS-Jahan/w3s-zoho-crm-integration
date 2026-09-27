const express = require('express');
const cors = require('cors');
const config = require('./config/zoho.config');
const zohoService = require('./services/zoho.service');
const leadRoutes = require('./routes/lead.routes');
const errorHandler = require('./middlewares/errorHandler');
const { requestLogger, securityHeaders, rateLimit, tenantContext, gracefulShutdown } = require('./middlewares');
const logger = require('./utils/logger');

const app = express();
app.set('trust proxy', true);

app.use(securityHeaders);
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json({ limit: '100kb' }));
app.use(requestLogger);
app.use(tenantContext);
app.use('/api', rateLimit({ windowMs: 60_000, max: 120 }));

// Health check: uptime + token cache state (never exposes the token itself)
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    version: process.env.npm_package_version || '1.0.0',
    uptimeSeconds: Math.round(process.uptime()),
    zohoConfigured: config.validate(),
    tokenCache: {
      hasToken: !!zohoService._accessToken,
      expiresInSec: zohoService._accessToken
        ? Math.max(0, Math.round((zohoService._tokenExpiresAt - Date.now()) / 1000))
        : 0,
    },
    time: new Date().toISOString(),
  });
});

app.use('/api', leadRoutes);

// 404 for unknown routes
app.use((_req, _res, next) => {
  const err = new Error('Route not found');
  err.status = 404;
  err.zohoError = 'ROUTE_NOT_FOUND';
  next(err);
});

app.use(errorHandler);

if (require.main === module) {
  const server = app.listen(config.port, () => {
    logger.info(`Zoho CRM integration server listening on http://localhost:${config.port}`);
    if (config.validate()) {
      // Warm up the token cache on startup to avoid cold-start UX latency
      zohoService.getAccessToken().catch((err) => {
        logger.warn(`Failed initial token warm-up: ${err.message}`);
      });
    } else {
      logger.warn('Zoho env vars incomplete — API calls will fail auth');
    }
  });
  gracefulShutdown(server, logger);
}

module.exports = app;
