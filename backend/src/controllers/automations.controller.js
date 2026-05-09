const db = require('../config/database');
const logger = require('../config/logger');

async function listAutomations(req, res) {
  try {
    const { rows } = await db.query('SELECT * FROM automations ORDER BY created_at DESC');
    res.json({ success: true, data: rows });
  } catch (err) {
    logger.error('AutomationsController', 'Failed to list automations', { err: err.message });
    res.status(500).json({ success: false, error: 'Database error' });
  }
}

async function getAutomation(req, res) {
  try {
    const { id } = req.params;
    const { rows } = await db.query('SELECT * FROM automations WHERE id = $1', [id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Automation not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error('AutomationsController', 'Failed to get automation', { err: err.message });
    res.status(500).json({ success: false, error: 'Database error' });
  }
}

async function createAutomation(req, res) {
  try {
    const { name, post_id, trigger_keywords, reply_message, dm_message } = req.body;
    
    const query = `
      INSERT INTO automations (name, post_id, trigger_keywords, reply_message, dm_message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const values = [name, post_id, trigger_keywords, reply_message, dm_message];
    
    const { rows } = await db.query(query, values);
    logger.info('AutomationsController', 'Created new automation', { id: rows[0].id });
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error('AutomationsController', 'Failed to create automation', { err: err.message });
    res.status(500).json({ success: false, error: 'Database error' });
  }
}

async function updateAutomation(req, res) {
  try {
    const { id } = req.params;
    const { name, post_id, trigger_keywords, reply_message, dm_message } = req.body;
    
    const query = `
      UPDATE automations 
      SET name = $1, post_id = $2, trigger_keywords = $3, reply_message = $4, dm_message = $5, updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING *
    `;
    const values = [name, post_id, trigger_keywords, reply_message, dm_message, id];
    
    const { rows } = await db.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Automation not found' });
    }
    
    logger.info('AutomationsController', 'Updated automation', { id });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error('AutomationsController', 'Failed to update automation', { err: err.message });
    res.status(500).json({ success: false, error: 'Database error' });
  }
}

async function toggleAutomation(req, res) {
  try {
    const { id } = req.params;
    const { is_enabled } = req.body;
    
    const { rows } = await db.query(
      'UPDATE automations SET is_enabled = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [is_enabled, id]
    );
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Automation not found' });
    }
    
    logger.info('AutomationsController', 'Toggled automation', { id, is_enabled });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    logger.error('AutomationsController', 'Failed to toggle automation', { err: err.message });
    res.status(500).json({ success: false, error: 'Database error' });
  }
}

async function deleteAutomation(req, res) {
  try {
    const { id } = req.params;
    const { rowCount } = await db.query('DELETE FROM automations WHERE id = $1', [id]);
    
    if (rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Automation not found' });
    }
    
    logger.info('AutomationsController', 'Deleted automation', { id });
    res.json({ success: true, message: 'Automation deleted' });
  } catch (err) {
    logger.error('AutomationsController', 'Failed to delete automation', { err: err.message });
    res.status(500).json({ success: false, error: 'Database error' });
  }
}

module.exports = {
  listAutomations,
  getAutomation,
  createAutomation,
  updateAutomation,
  toggleAutomation,
  deleteAutomation,
};
