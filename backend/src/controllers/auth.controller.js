const jwt = require('jsonwebtoken');
const env = require('../config/env');
const logger = require('../config/logger');

/**
 * POST /auth/login
 * Validate email + password, issue JWT in httpOnly cookie.
 */
function login(req, res) {
  const { email, password } = req.body || {};

  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) {
    logger.warn('AuthController', 'Failed login attempt', { email });
    return res.status(401).json({ success: false, error: 'Invalid credentials' });
  }

  const token = jwt.sign({ email }, env.JWT_SECRET, { expiresIn: '7d' });

  res.cookie('admin_token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  logger.info('AuthController', 'Admin logged in', { email });
  res.json({ success: true, message: 'Logged in successfully' });
}

/**
 * POST /auth/logout
 */
function logout(_req, res) {
  res.clearCookie('admin_token');
  res.json({ success: true, message: 'Logged out' });
}

/**
 * GET /auth/me
 * Returns the current session's email if the cookie token is valid.
 */
function me(req, res) {
  const token = req.cookies?.admin_token;

  if (!token) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET);
    res.json({ success: true, data: { email: payload.email } });
  } catch {
    res.clearCookie('admin_token');
    res.status(401).json({ success: false, error: 'Session expired' });
  }
}

/**
 * GET /auth/instagram — initiate OAuth flow
 */
function initiateOAuth(req, res) {
  const params = new URLSearchParams({
    client_id: env.APP_ID,
    redirect_uri: `${req.protocol}://${req.get('host')}/auth/instagram/callback`,
    scope: [
      'instagram_business_basic',
      'instagram_manage_comments',
      'instagram_business_manage_messages',
    ].join(','),
    response_type: 'code',
  });

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  logger.info('AuthController', 'Redirecting to Instagram OAuth');
  res.redirect(authUrl);
}

/**
 * GET /auth/instagram/callback
 */
function handleOAuthCallback(req, res) {
  const { code, error } = req.query;

  if (error || !code) {
    logger.error('AuthController', 'OAuth callback error', { error });
    return res.redirect('http://localhost:5173/account?error=' + encodeURIComponent(error || 'No code'));
  }

  logger.info('AuthController', 'OAuth callback received');
  res.redirect('http://localhost:5173/account?success=true');
}

module.exports = { login, logout, me, initiateOAuth, handleOAuthCallback };
