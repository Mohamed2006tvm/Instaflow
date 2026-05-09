const db = require('../config/database');
const env = require('../config/env');
const logger = require('../config/logger');

/**
 * GET /api/account
 * Returns the connected Instagram account info from the database
 */
async function getAccount(req, res) {
  try {
    // Try to get account from DB
    const { rows } = await db.query('SELECT * FROM account_info LIMIT 1');
    
    if (rows.length > 0) {
      return res.json({ success: true, data: rows[0] });
    }

    // Fallback to env vars if no DB record yet (first time setup)
    if (env.INSTAGRAM_ACCESS_TOKEN && env.INSTAGRAM_USER_ID &&
        env.INSTAGRAM_ACCESS_TOKEN !== 'your_long_lived_access_token_here') {

      const fallbackAccount = {
        id: env.INSTAGRAM_USER_ID,
        username: 'instagram_user',
        name: 'Instagram Account',
        account_type: 'BUSINESS',
        follower_count: null,
        profile_picture_url: null,
        token_expires_at: null,
      };

      return res.json({ success: true, data: fallbackAccount });
    }

    // No account connected
    return res.json({ success: true, data: null });
  } catch (err) {
    logger.error('AccountController', 'Failed to get account', { err: err.message });
    res.status(500).json({ success: false, error: 'Database error' });
  }
}

/**
 * DELETE /api/account/disconnect
 * Clears the connected account from the database
 */
async function disconnectAccount(req, res) {
  try {
    await db.query('DELETE FROM account_info');
    logger.info('AccountController', 'Instagram account disconnected');
    res.json({ success: true, message: 'Account disconnected' });
  } catch (err) {
    logger.error('AccountController', 'Failed to disconnect account', { err: err.message });
    res.status(500).json({ success: false, error: 'Database error' });
  }
}

/**
 * Called by OAuth callback to store account info in the database
 */
async function setAccount(account) {
  try {
    const query = `
      INSERT INTO account_info (id, username, name, profile_picture_url, account_type, follower_count, token_expires_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        name = EXCLUDED.name,
        profile_picture_url = EXCLUDED.profile_picture_url,
        account_type = EXCLUDED.account_type,
        follower_count = EXCLUDED.follower_count,
        token_expires_at = EXCLUDED.token_expires_at,
        updated_at = CURRENT_TIMESTAMP
    `;
    const values = [
      account.id,
      account.username,
      account.name,
      account.profile_picture_url,
      account.account_type,
      account.follower_count,
      account.token_expires_at
    ];
    
    await db.query(query, values);
    logger.info('AccountController', 'Account info updated in database', { id: account.id });
  } catch (err) {
    logger.error('AccountController', 'Failed to save account info', { err: err.message });
  }
}

module.exports = { getAccount, disconnectAccount, setAccount };
