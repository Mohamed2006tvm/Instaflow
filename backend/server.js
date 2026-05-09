// Load env FIRST before anything else
require('./src/config/env');

const { createApp } = require('./src/app');
const logger = require('./src/config/logger');
const env = require('./src/config/env');

const { initDatabase } = require('./src/config/database');

async function startServer() {
  try {
    // Initialize DB
    await initDatabase();

    // Only listen if not running as a Vercel function
    if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
      const server = app.listen(env.PORT, () => {
        logger.info('Server', `🚀 Server running on http://localhost:${env.PORT}`);
        logger.info('Server', `Webhook URL: http://localhost:${env.PORT}/webhook/instagram`);
        logger.info('Server', `Health check: http://localhost:${env.PORT}/health`);
      });

      function shutdown(signal) {
        logger.info('Server', `${signal} received — shutting down`);
        server.close(() => {
          logger.info('Server', 'Server closed');
          process.exit(0);
        });
      }

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT',  () => shutdown('SIGINT'));
    }
  } catch (err) {
    logger.error('Server', 'Failed to start server', { err: err.message });
    if (process.env.NODE_ENV !== 'production') {
      process.exit(1);
    }
  }
}

// Start DB/Server
startServer();

// Export for Vercel
module.exports = app;

process.on('uncaughtException', (err) => {
  logger.error('Server', 'Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.error('Server', 'Unhandled rejection', { reason: String(reason) });
  process.exit(1);
});
