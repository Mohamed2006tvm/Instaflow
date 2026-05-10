const fs = require('fs');
const path = require('path');

let app;
let startupError = null;
try {
  console.log('Attempting to load backend app...');
  const { createApp } = require('../src/app');
  app = createApp();
  console.log('Backend app loaded successfully.');
} catch (err) {
  console.error('CRITICAL: Backend startup failed:', err);
  startupError = err;
  const express = require('express');
  app = express();
  
  app.all('*', (req, res) => {
    const packageJsonPath = path.join(__dirname, '../package.json');
    const hasPackageJson = fs.existsSync(packageJsonPath);
    const nodeModulesPath = path.join(__dirname, '../node_modules');
    const hasNodeModules = fs.existsSync(nodeModulesPath);
    
    res.status(500).json({
      error: 'CRITICAL_STARTUP_FAILURE',
      message: err.message,
      stack: err.stack,
      debug: {
        hasPackageJson,
        hasNodeModules,
        cwd: process.cwd(),
        dirname: __dirname,
        env: {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL
        }
      }
    });
  });
}

// Add a direct test route for Vercel
app.get('/api/test-backend', (req, res) => {
  res.json({ 
    status: startupError ? 'Backend startup error' : 'Backend is alive!',
    error: startupError ? startupError.message : undefined,
    env_check: {
      has_db_url: !!process.env.DATABASE_URL,
      has_jwt_secret: !!process.env.JWT_SECRET,
      node_env: process.env.NODE_ENV,
      vercel: process.env.VERCEL
    }
  });
});

module.exports = (req, res, next) => app(req, res, next);
