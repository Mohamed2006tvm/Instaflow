const axios = require('axios');
const env = require('../config/env');
const logger = require('../config/logger');

const GRAPH_BASE = env.GRAPH_BASE_URL;       // https://graph.instagram.com/v19.0
const GRAPH_FB   = env.GRAPH_FB_BASE_URL;    // https://graph.facebook.com/v19.0
const TOKEN      = env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = env.INSTAGRAM_USER_ID;

/**
 * sendCommentReply()
 *
 * Publicly reply to an Instagram comment.
 * Uses: POST /{comment_id}/replies
 *
 * @param {string} commentId  - The comment ID to reply to
 * @param {string} replyText  - The reply message text
 * @returns {Promise<object>} - Meta API response { id: "..." }
 */
async function sendCommentReply(commentId, replyText) {
  logger.info('InstagramService', `Sending public reply to comment ${commentId}`);

  try {
    const response = await axios.post(
      `${GRAPH_BASE}/${commentId}/replies`,
      { message: replyText },
      {
        params: { access_token: TOKEN },
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    logger.info('InstagramService', `✅ Public reply sent`, {
      commentId,
      replyId: response.data.id,
    });

    return response.data;
  } catch (err) {
    const apiError = err.response?.data?.error;
    logger.error('InstagramService', `❌ Failed to send public reply`, {
      commentId,
      error: apiError || err.message,
    });
    throw new Error(apiError?.message || err.message);
  }
}

/**
 * sendInstagramDM()
 *
 * Send a Direct Message to an Instagram user.
 * Uses: POST /{ig-user-id}/messages (Facebook Graph API endpoint)
 *
 * NOTE: The DM endpoint uses graph.facebook.com, not graph.instagram.com.
 * The IG_USER_ID must be your Business Account's Instagram-scoped user ID.
 *
 * @param {string} recipientId  - The recipient's Instagram-scoped user ID
 * @param {string} messageText  - The DM message text
 * @returns {Promise<object>}   - Meta API response
 */
async function sendInstagramDM(recipientId, messageText) {
  logger.info('InstagramService', `Sending DM to user ${recipientId}`);

  try {
    const response = await axios.post(
      `${GRAPH_FB}/${IG_USER_ID}/messages`,
      {
        recipient: { id: recipientId },
        message:   { text: messageText },
      },
      {
        params: { access_token: TOKEN },
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );

    logger.info('InstagramService', `✅ DM sent`, {
      recipientId,
      messageId: response.data.message_id,
    });

    return response.data;
  } catch (err) {
    const apiError = err.response?.data?.error;
    logger.error('InstagramService', `❌ Failed to send DM`, {
      recipientId,
      error: apiError || err.message,
    });
    throw new Error(apiError?.message || err.message);
  }
}

module.exports = { sendCommentReply, sendInstagramDM };
