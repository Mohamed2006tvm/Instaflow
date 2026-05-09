/**
 * In-memory deduplication store.
 *
 * Tracks processed comment IDs to prevent double-processing
 * when Meta retries webhook delivery.
 *
 * TTL: entries auto-expire after 24 hours.
 * For production with restarts, use Redis instead.
 */

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Map: eventId -> expiry timestamp
const store = new Map();

/**
 * Check if an event has already been processed.
 * @param {string} eventId
 * @returns {boolean}
 */
function isDuplicate(eventId) {
  const expiry = store.get(eventId);
  if (!expiry) return false;

  // Clean up expired entry
  if (Date.now() > expiry) {
    store.delete(eventId);
    return false;
  }

  return true;
}

/**
 * Mark an event as processed.
 * @param {string} eventId
 */
function markProcessed(eventId) {
  store.set(eventId, Date.now() + TTL_MS);
}

/**
 * Clean up all expired entries (call periodically).
 */
function cleanExpired() {
  const now = Date.now();
  for (const [id, expiry] of store) {
    if (now > expiry) store.delete(id);
  }
}

// Auto-cleanup every hour
setInterval(cleanExpired, 60 * 60 * 1000);

module.exports = { isDuplicate, markProcessed };
