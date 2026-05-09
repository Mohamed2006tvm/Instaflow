require('dotenv').config();

const requiredVars = [
  'PORT',
  'DATABASE_URL',
  'VERIFY_TOKEN',
  'APP_SECRET',
  'INSTAGRAM_ACCESS_TOKEN',
  'INSTAGRAM_USER_ID',
  'ADMIN_EMAIL',
  'ADMIN_PASSWORD',
  'JWT_SECRET',
];

requiredVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`[Config] ❌ Missing required env var: ${key}`);
    process.exit(1);
  }
});

module.exports = {
  PORT: parseInt(process.env.PORT) || 3000,
  DATABASE_URL: process.env.DATABASE_URL,
  VERIFY_TOKEN: process.env.VERIFY_TOKEN,
  APP_SECRET: process.env.APP_SECRET,
  APP_ID: process.env.APP_ID || '',
  INSTAGRAM_ACCESS_TOKEN: process.env.INSTAGRAM_ACCESS_TOKEN,
  INSTAGRAM_USER_ID: process.env.INSTAGRAM_USER_ID,

  // Admin dashboard credentials
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  JWT_SECRET: process.env.JWT_SECRET,

  // Instagram Graph API base URLs
  GRAPH_API_VERSION: 'v19.0',
  GRAPH_BASE_URL: 'https://graph.instagram.com/v19.0',
  GRAPH_FB_BASE_URL: 'https://graph.facebook.com/v19.0',

  NODE_ENV: process.env.NODE_ENV || 'development',
};
