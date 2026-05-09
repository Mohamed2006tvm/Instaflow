const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../config/logger');

/**
 * Middleware to protect API routes.
 * Checks for a valid JWT in the 'admin_token' cookie.
 */
function authenticate(req, res, next) {
  const token = req.cookies?.admin_token;

  if (!token) {
    logger.warn('AuthMiddleware', 'Unauthorized access attempt - no token', { path: req.path });
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    req.admin = payload;
    next();
  } catch (err) {
    logger.warn('AuthMiddleware', 'Unauthorized access attempt - invalid token', { path: req.path, err: err.message });
    res.clearCookie('admin_token');
    return res.status(401).json({ success: false, error: 'Session expired or invalid' });
  }
}

module.exports = { authenticate };
