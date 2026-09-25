const express = require('express');
const cors = require('cors');
const config = require('./config/zoho.config');
const leadRoutes = require('./routes/lead.routes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    status: 'ok',
    zohoConfigured: config.validate(),
    time: new Date().toISOString(),
  });
});

app.use('/api', leadRoutes);

// 404 for unknown API routes
app.use('/api', (_req, _res, next) => {
  const err = new Error('Route not found');
  err.status = 404;
  err.zohoError = 'ROUTE_NOT_FOUND';
  next(err);
});

app.use(errorHandler);

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Zoho CRM integration server listening on http://localhost:${config.port}`);
    config.validate();
  });
}

module.exports = app;
