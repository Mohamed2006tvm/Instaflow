const env = require('../config/env');
const logger = require('../config/logger');
const { verifyHmacSignature } = require('../utils/crypto');
const { isDuplicate, markProcessed } = require('../utils/deduplication');
const { processComment } = require('../services/automation.service');

/**
 * verifyWebhook()
 *
 * Handles: GET /webhook/instagram
 *
 * Meta sends a GET request with three query parameters to verify your endpoint:
 *   hub.mode         = "subscribe"
 *   hub.verify_token = the token you set in the Meta dashboard
 *   hub.challenge    = a random number Meta wants echoed back
 *
 * If the token matches, respond with hub.challenge (plain text, status 200).
 * Meta then activates the webhook subscription.
 */
function verifyWebhook(req, res) {
  const mode      = req.query['hub.mode'];
  const token     = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  logger.info('Webhook', 'Verification request received', { mode, token });

  if (mode === 'subscribe' && token === env.VERIFY_TOKEN) {
    logger.info('Webhook', '✅ Webhook verified successfully');
    res.status(200).send(challenge); // Must return plain text challenge
    return;
  }

  logger.warn('Webhook', '❌ Verification failed — invalid token or mode', { mode, token });
  res.status(403).json({ error: 'Verification failed' });
}

/**
 * receiveWebhook()
 *
 * Handles: POST /webhook/instagram
 *
 * CRITICAL: Respond 200 IMMEDIATELY.
 * If Meta does not receive a 200 within ~5 seconds, it retries — causing duplicate events.
 *
 * Flow:
 * 1. Verify HMAC-SHA256 signature (X-Hub-Signature-256 header)
 * 2. Send res.sendStatus(200) immediately
 * 3. Process payload asynchronously with setImmediate()
 */
function receiveWebhook(req, res) {
  // --- STEP 1: Verify HMAC signature ---
  const signature = req.headers['x-hub-signature-256'];
  const rawBody   = req.rawBody;

  if (!rawBody || !signature) {
    logger.warn('Webhook', 'Missing rawBody or signature header');
    return res.status(403).json({ error: 'Missing signature' });
  }

  const isValid = verifyHmacSignature(rawBody, signature, env.APP_SECRET);

  if (!isValid) {
    logger.warn('Webhook', '❌ HMAC signature verification failed');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  // --- STEP 2: Respond 200 IMMEDIATELY ---
  res.sendStatus(200);

  // --- STEP 3: Process asynchronously ---
  setImmediate(() => processWebhookPayload(req.body));
}

/**
 * processWebhookPayload()
 *
 * Runs after the 200 response is sent.
 * Parses the Meta webhook payload and dispatches each comment event.
 *
 * Meta Instagram webhook payload structure:
 * {
 *   object: "instagram",
 *   entry: [
 *     {
 *       id: "page_id",
 *       time: 1234567890,
 *       changes: [
 *         {
 *           field: "comments",
 *           value: {
 *             from: { id: "user_id", username: "username" },
 *             media: { id: "media_id" },
 *             id: "comment_id",
 *             text: "comment text",
 *             timestamp: "...",
 *             parent_id: "..." (only present if it's a reply to a comment)
 *           }
 *         }
 *       ]
 *     }
 *   ]
 * }
 */
async function processWebhookPayload(payload) {
  try {
    logger.info('Webhook', 'Processing webhook payload', {
      object: payload.object,
      entryCount: payload.entry?.length,
    });

    // Only process Instagram webhooks
    if (payload.object !== 'instagram') {
      logger.debug('Webhook', `Ignoring non-instagram object: ${payload.object}`);
      return;
    }

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {

        // Only process comment events
        if (change.field !== 'comments') {
          logger.debug('Webhook', `Ignoring field: ${change.field}`);
          continue;
        }

        const value = change.value;

        // Validate required fields
        if (!value?.id || !value?.text || !value?.from?.id) {
          logger.warn('Webhook', 'Comment event missing required fields', { value });
          continue;
        }

        // Skip replies to comments (parent_id indicates it's a reply, not a top-level comment)
        if (value.parent_id) {
          logger.debug('Webhook', `Skipping reply comment ${value.id}`);
          continue;
        }

        // Build unique event ID for deduplication
        const eventId = `${entry.id}_${value.id}_${entry.time}`;

        // Deduplication check
        if (isDuplicate(eventId)) {
          logger.warn('Webhook', `Duplicate event ignored: ${eventId}`);
          continue;
        }

        // Mark as processed BEFORE async work to prevent race conditions
        markProcessed(eventId);

        logger.info('Webhook', 'New comment event', {
          eventId,
          commentId: value.id,
          commenterId: value.from.id,
          commenterUsername: value.from.username,
          mediaId: value.media?.id,
          preview: value.text.substring(0, 80),
        });

        // Dispatch to automation engine
        await processComment({
          commentId:          value.id,
          commentText:        value.text,
          commenterId:        value.from.id,
          commenterUsername:  value.from.username,
          mediaId:            value.media?.id,
          timestamp:          value.timestamp,
        });
      }
    }
  } catch (err) {
    logger.error('Webhook', 'Error processing webhook payload', {
      error: err.message,
      stack: err.stack,
    });
  }
}

module.exports = { verifyWebhook, receiveWebhook };
