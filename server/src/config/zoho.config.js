require('dotenv').config();
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

module.exports = {
  clientId: process.env.ZOHO_CLIENT_ID,
  clientSecret: process.env.ZOHO_CLIENT_SECRET,
  refreshToken: process.env.ZOHO_REFRESH_TOKEN,
  accountsDomain: (process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.com').replace(/\/$/, ''),
  apiDomain: (process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.com').replace(/\/$/, ''),
  port: parseInt(process.env.PORT || '5000', 10),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',

  // OAuth scopes used when generating the refresh token (informational)
  scopes: ['ZohoCRM.modules.ALL', 'ZohoCRM.settings.ALL'],

  validate() {
    const missing = ['clientId', 'clientSecret', 'refreshToken'].filter((k) => !this[k]);
    if (missing.length) {
      console.warn(`[config] Missing Zoho env vars: ${missing.join(', ')}. API calls will fail auth.`);
    }
    return missing.length === 0;
  },
};
