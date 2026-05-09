const { sendCommentReply, sendInstagramDM } = require('./instagram.service');
const db = require('../config/database');
const { addLog } = require('../controllers/logs.controller');
const logger = require('../config/logger');

/**
 * findMatchingAutomation()
 *
 * Find a matching automation rule from the database.
 * Filters:
 * 1. Must be enabled (is_enabled = true)
 * 2. If post_id is set in DB, must match the mediaId from webhook
 * 3. Text must contain one of the trigger_keywords
 *
 * @param {string} commentText
 * @param {string} mediaId
 * @returns {object|null}
 */
async function findMatchingAutomation(commentText, mediaId) {
  if (!commentText || typeof commentText !== 'string') return null;

  const normalized = commentText.toLowerCase().trim();

  try {
    // Fetch all enabled automations
    const { rows: automations } = await db.query(
      'SELECT * FROM automations WHERE is_enabled = true'
    );

    for (const auto of automations) {
      // 1. Check mediaId constraint if it exists
      if (auto.post_id && auto.post_id !== mediaId) {
        continue;
      }

      // 2. Check keywords
      const matchedKeyword = auto.trigger_keywords.find((kw) =>
        normalized.includes(kw.toLowerCase().trim())
      );

      if (matchedKeyword) {
        return {
          automation_id: auto.id,
          matchedKeyword,
          publicReply: auto.reply_message,
          dmMessage: auto.dm_message,
        };
      }
    }
  } catch (err) {
    logger.error('AutomationService', 'Error fetching automations from DB', { err: err.message });
  }

  return null; // No match
}

/**
 * processComment()
 *
 * Full automation flow for a single comment event:
 * 1. matchKeywords() — check for trigger keywords in database
 * 2. sendCommentReply() — public reply on the post
 * 3. sendInstagramDM() — private DM to the commenter
 * 4. Log everything to the database
 *
 * @param {object} commentData - Parsed comment from webhook entry
 */
async function processComment(commentData) {
  const { commentId, commentText, commenterId, commenterUsername, mediaId } = commentData;

  logger.info('AutomationService', `Processing comment`, {
    commentId,
    commenterId,
    commenterUsername,
    mediaId,
    preview: commentText.substring(0, 80),
  });

  // Step 1: Find matching automation in DB
  const match = await findMatchingAutomation(commentText, mediaId);

  if (!match) {
    logger.debug('AutomationService', `No keyword match for comment ${commentId}`);
    return;
  }

  logger.info('AutomationService', `✅ Match found: "${match.matchedKeyword}"`, {
    automationId: match.automation_id,
    commentId,
  });

  let public_reply_sent = false;
  let dm_sent = false;
  let error_message = null;

  // Step 2: Send public reply (if configured)
  if (match.publicReply) {
    try {
      await sendCommentReply(commentId, match.publicReply);
      public_reply_sent = true;
    } catch (err) {
      logger.error('AutomationService', `Failed to send public reply`, {
        commentId,
        error: err.message,
      });
      error_message = `Public reply failed: ${err.message}`;
    }
  }

  // Step 3: Send DM (if configured)
  if (match.dmMessage) {
    try {
      await sendInstagramDM(commenterId, match.dmMessage);
      dm_sent = true;
    } catch (err) {
      logger.error('AutomationService', `Failed to send DM`, {
        commenterId,
        error: err.message,
      });
      error_message = error_message 
        ? `${error_message} | DM failed: ${err.message}` 
        : `DM failed: ${err.message}`;
    }
  }

  // Step 4: Final Status
  let status = 'success';
  if (!public_reply_sent && !dm_sent) {
    status = 'failed';
  } else if ((match.publicReply && !public_reply_sent) || (match.dmMessage && !dm_sent)) {
    status = 'partial';
  }

  // Step 5: PERSIST LOG TO DATABASE
  try {
    await addLog({
      automation_id: match.automation_id,
      comment_id: commentId,
      comment_text: commentText,
      commenter_username: commenterUsername,
      commenter_ig_id: commenterId,
      matched_keyword: match.matchedKeyword,
      public_reply_sent,
      dm_sent,
      status,
      error_message
    });
  } catch (err) {
    logger.error('AutomationService', 'Failed to save log to DB', { err: err.message });
  }

  logger.info('AutomationService', `Automation complete for comment ${commentId}`, {
    status,
    replySent: public_reply_sent,
    dmSent: dm_sent,
  });
}

module.exports = { processComment, findMatchingAutomation };
