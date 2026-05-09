const { Router } = require('express');
const { webhookController } = require('../controllers/webhook.controller');
const { rawBodyMiddleware } = require('../middleware/rawBody');

const router = Router();

/**
 * GET /webhook/instagram
 *
 * Meta webhook verification.
 * Called once when you first configure the webhook in Meta dashboard.
 * No authentication needed — Meta sends your own verify token.
 */
router.get('/instagram', webhookController.verify);

/**
 * POST /webhook/instagram
 *
 * Receive live webhook events from Meta.
 * rawBodyMiddleware MUST run before JSON parsing to enable HMAC verification.
 */
router.post('/instagram', rawBodyMiddleware, webhookController.receive);

module.exports = router;
