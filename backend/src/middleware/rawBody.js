/**
 * Raw body capture middleware.
 *
 * MUST be registered BEFORE express.json() on /webhook routes.
 * Meta HMAC-SHA256 signature verification requires the exact raw body bytes.
 * If you parse JSON first, the body is reconstructed and the HMAC will not match.
 */
function rawBodyMiddleware(req, res, next) {
  const chunks = [];

  req.on('data', (chunk) => chunks.push(chunk));

  req.on('end', () => {
    const rawBody = Buffer.concat(chunks);
    req.rawBody = rawBody; // Attach for use in HMAC verification

    // Parse JSON from the raw buffer (replaces express.json() for this route)
    if (rawBody.length > 0) {
      try {
        req.body = JSON.parse(rawBody.toString('utf8'));
      } catch {
        req.body = {};
      }
    } else {
      req.body = {};
    }

    next();
  });

  req.on('error', next);
}

module.exports = { rawBodyMiddleware };
