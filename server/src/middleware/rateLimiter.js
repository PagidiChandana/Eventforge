'use strict';
/**
 * rateLimiter.js
 * In-memory token-bucket rate-limiting middleware.
 * Protects login, registration, and AI endpoints against abuse.
 */

const requestCounts = new Map();

/**
 * Creates a rate limiting middleware instance.
 * @param {number} windowMs - Time window in milliseconds (default: 15 mins)
 * @param {number} maxRequests - Max allowed requests per IP within window (default: 100)
 */
function createRateLimiter({ windowMs = 15 * 60 * 1000, maxRequests = 100, message = 'Too many requests. Please try again later.' }) {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    const key = `${req.baseUrl}${req.path}:${ip}`;
    const now = Date.now();

    const record = requestCounts.get(key) || { count: 0, resetTime: now + windowMs };

    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
    } else {
      record.count += 1;
    }

    requestCounts.set(key, record);

    if (record.count > maxRequests) {
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: Math.ceil((record.resetTime - now) / 1000)
      });
    }

    next();
  };
}

module.exports = { createRateLimiter };
