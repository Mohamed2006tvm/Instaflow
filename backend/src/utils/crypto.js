const crypto = require('crypto');

/**
 * Verify Meta webhook HMAC-SHA256 signature.
 *
 * Meta sends the header: X-Hub-Signature-256: sha256=<hex>
 * We compute our own HMAC using the raw body and APP_SECRET.
 * Timing-safe comparison prevents timing attacks.
 *
 * @param {Buffer} rawBody  - Raw request body buffer
 * @param {string} signature - Full header value e.g. "sha256=abc123"
 * @param {string} appSecret - Meta App Secret from env
 * @returns {boolean}
 */
function verifyHmacSignature(rawBody, signature, appSecret) {
  if (!signature || !signature.startsWith('sha256=')) return false;

  const expected = signature.slice('sha256='.length);
  const computed = crypto
    .createHmac('sha256', appSecret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(computed, 'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

module.exports = { verifyHmacSignature };
