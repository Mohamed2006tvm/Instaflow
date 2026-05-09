const db = require('../config/database');
const logger = require('../config/logger');

async function getLogs(req, res) {
  try {
    const { page = 1, limit = 25, status } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    const params = [limit, offset];
    
    if (status) {
      whereClause = 'WHERE status = $3';
      params.push(status);
    }
    
    const countQuery = `SELECT COUNT(*) FROM automation_logs ${whereClause}`;
    const dataQuery = `
      SELECT * FROM automation_logs 
      ${whereClause} 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;
    
    const [countRes, dataRes] = await Promise.all([
      db.query(countQuery, status ? [status] : []),
      db.query(dataQuery, params)
    ]);
    
    const total = parseInt(countRes.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: dataRes.rows,
      pagination: {
        total,
        page: parseInt(page),
        totalPages,
      },
    });
  } catch (err) {
    logger.error('LogsController', 'Failed to get logs', { err: err.message });
    res.status(500).json({ success: false, error: 'Database error' });
  }
}

async function getStats(req, res) {
  try {
    const query = `
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'success') as success,
        COUNT(*) FILTER (WHERE status = 'failed') as failed,
        COUNT(*) FILTER (WHERE status = 'partial') as partial
      FROM automation_logs
    `;
    const { rows } = await db.query(query);
    
    const stats = {
      total: parseInt(rows[0].total),
      success: parseInt(rows[0].success),
      failed: parseInt(rows[0].failed),
      partial: parseInt(rows[0].partial),
    };
    
    res.json({ success: true, data: stats });
  } catch (err) {
    logger.error('LogsController', 'Failed to get stats', { err: err.message });
    res.status(500).json({ success: false, error: 'Database error' });
  }
}

/**
 * Add a new log entry to the database
 */
async function addLog(logData) {
  try {
    const query = `
      INSERT INTO automation_logs (
        automation_id, comment_id, comment_text, commenter_username, 
        commenter_ig_id, matched_keyword, public_reply_sent, 
        dm_sent, status, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING id
    `;
    const values = [
      logData.automation_id,
      logData.comment_id,
      logData.comment_text,
      logData.commenter_username,
      logData.commenter_ig_id,
      logData.matched_keyword,
      logData.public_reply_sent || false,
      logData.dm_sent || false,
      logData.status || 'pending',
      logData.error_message
    ];
    
    const { rows } = await db.query(query, values);
    return rows[0].id;
  } catch (err) {
    logger.error('LogsController', 'Failed to add log', { err: err.message });
  }
}

module.exports = { getLogs, getStats, addLog };
