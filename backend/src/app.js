const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const logger = require('./config/logger');
const { errorHandler } = require('./middleware/errorHandler');
const { authenticate } = require('./middleware/auth');

function createApp() {
  const app = express();

  // Security headers
  app.use(helmet());


  // Trust proxy for Vercel
  app.set('trust proxy', 1);

  // CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      const allowedOrigins = [
        'http://localhost:5173', 
        'http://localhost:3000', 
        'https://instaflow-beta.vercel.app'
      ];
      if (!origin || allowedOrigins.includes(origin) || (origin && origin.endsWith('.vercel.app'))) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }));

  app.use(cookieParser());

  // Root route
  app.get('/', (req, res) => {
    res.json({ message: 'Instaflow API is running' });
  });

  // Health check
  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'instagram-automation',
    });
  });

  // Webhook routes - handle raw body internally
  const webhookRoutes = require('./routes/webhook.routes');
  app.use('/webhook', webhookRoutes);

  // JSON parser for other routes
  app.use(express.json());

  app.use((req, _res, next) => {
    logger.debug('Request', `${req.method} ${req.path}`);
    next();
  });

  // ─────────────────────────────────────────────
  // Other Routes
  // ─────────────────────────────────────────────
  const authRoutes = require('./routes/auth.routes');
  const accountRoutes = require('./routes/account.routes');
  const automationsRoutes = require('./routes/automations.routes');
  const logsRoutes = require('./routes/logs.routes');

  app.use('/auth', authRoutes);
  app.use('/api/account', authenticate, accountRoutes);
  app.use('/api/automations', authenticate, automationsRoutes);
  app.use('/api/logs', authenticate, logsRoutes);

  // 404 fallback
  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  // Centralized error handler (must be last)
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
