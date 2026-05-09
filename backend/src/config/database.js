const { Pool } = require('pg');
const env = require('./env');
const logger = require('./logger');

const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon
  }
});

/**
 * Initialize database tables if they don't exist
 */
async function initDatabase() {
  const client = await pool.connect();
  try {
    logger.info('Database', 'Initializing tables...');

    // Automations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS automations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        post_id TEXT,
        trigger_keywords TEXT[] NOT NULL,
        reply_message TEXT,
        dm_message TEXT,
        is_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS automation_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        automation_id UUID REFERENCES automations(id) ON DELETE SET NULL,
        comment_id TEXT,
        comment_text TEXT,
        commenter_username TEXT,
        commenter_ig_id TEXT,
        matched_keyword TEXT,
        public_reply_sent BOOLEAN DEFAULT false,
        dm_sent BOOLEAN DEFAULT false,
        status TEXT DEFAULT 'pending',
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Account info table (to persist account details across restarts)
    await client.query(`
      CREATE TABLE IF NOT EXISTS account_info (
        id TEXT PRIMARY KEY,
        username TEXT,
        name TEXT,
        profile_picture_url TEXT,
        account_type TEXT,
        follower_count INTEGER,
        token_expires_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    logger.info('Database', 'Tables initialized successfully');
  } catch (err) {
    logger.error('Database', 'Failed to initialize tables', { err: err.message });
    throw err;
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDatabase,
  query: (text, params) => pool.query(text, params),
};
