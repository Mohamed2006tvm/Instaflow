const { createApp } = require('../src/app');

let app;
try {
  app = createApp();
} catch (err) {
  console.error('Failed to create Express app:', err);
  // Create a minimal app to report the error
  const express = require('express');
  app = express();
  app.get('*', (req, res) => {
    res.status(500).json({ 
      error: 'Backend startup failed', 
      message: err.message,
      stack: err.stack 
    });
  });
}

// Add a direct test route for Vercel
app.get('/api/test-backend', (req, res) => {
  res.json({ 
    status: 'Backend is alive!', 
    env_check: {
      has_db_url: !!process.env.DATABASE_URL,
      has_jwt_secret: !!process.env.JWT_SECRET,
      node_env: process.env.NODE_ENV,
      vercel: process.env.VERCEL
    }
  });
});

module.exports = app;