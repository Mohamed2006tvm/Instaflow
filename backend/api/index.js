const { createApp } = require('../src/app');
const app = createApp();

// Add a direct test route for Vercel
app.get('/test-backend', (req, res) => {
  res.json({ 
    status: 'Backend is alive!', 
    env_check: {
      has_db_url: !!process.env.DATABASE_URL,
      has_jwt_secret: !!process.env.JWT_SECRET
    }
  });
});

module.exports = app;
