const { Pool } = require('@neondatabase/serverless');
const env = require('./env');
const logger = require('./logger');

// Connection pool - optimized for Serverless
const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

let isInitialized = false;

/**
 * Initialize database tables if they don't exist
 * Optimized to run only once per function instance
 */
async function initDatabase() {
  if (isInitialized) return;
  
  const client = await pool.connect();
  try {
    logger.info('Database', 'Ensuring schema is ready...');

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
      );

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
      );

      CREATE TABLE IF NOT EXISTS account_info (
        id TEXT PRIMARY KEY,
        username TEXT,
        name TEXT,
        profile_picture_url TEXT,
        account_type TEXT,
        follower_count INTEGER,
        token_expires_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    isInitialized = true;
    logger.info('Database', 'Schema check complete');
  } catch (err) {
    logger.error('Database', 'Schema initialization failed', { err: err.message });
    // Don't throw here, let the first query fail with a better error
  } finally {
    client.release();
  }
}

module.exports = {
  pool,
  initDatabase,
  query: async (text, params) => {
    if (!isInitialized) await initDatabase();
    return pool.query(text, params);
  },
};
