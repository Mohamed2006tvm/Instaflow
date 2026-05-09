const { verifyWebhook, receiveWebhook } = require('../webhooks/instagram.webhook');

const webhookController = {
  /**
   * GET /webhook/instagram
   * Meta webhook verification handshake.
   */
  verify: (req, res) => verifyWebhook(req, res),

  /**
   * POST /webhook/instagram
   * Receive and process webhook events.
   */
  receive: (req, res) => receiveWebhook(req, res),
};

module.exports = { webhookController };
