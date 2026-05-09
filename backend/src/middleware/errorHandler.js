const logger = require('../config/logger');

/**
 * Global Express error handler.
 * Must be registered LAST (after all routes) with 4 parameters.
 */
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  logger.error('ErrorHandler', err.message, {
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  });
}

module.exports = { errorHandler };
