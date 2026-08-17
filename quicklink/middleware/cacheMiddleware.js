/**
 * @file       cacheMiddleware.js
 * @description Cache middleware filters for caching API responses and invalidating writes.
 * @module     middleware/cacheMiddleware
 */

'use strict';

const { getCache, setCache, deleteCachePattern } = require('../utils/cache');

/**
 * Middleware: Caches successful GET response bodies.
 * @param {number} [ttl] - Custom TTL in seconds.
 */
const cacheResponse = (ttl) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    if (process.env.ENABLE_CACHE === 'false') {
      return next();
    }

    // Build cache key based on route, query string and authentication context
    const userId = req.user ? req.user._id.toString() : 'guest';
    const key = `${req.method}_${req.originalUrl || req.url}_${userId}`;

    const cachedData = getCache(key);
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cachedData);
    }

    // Override res.json to capture response payload before it is sent to client
    const originalJson = res.json;
    res.json = function (body) {
      res.json = originalJson; // restore original function

      // Only cache successful JSON responses
      if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
        setCache(key, body, ttl);
      }

      res.setHeader('X-Cache', 'MISS');
      return originalJson.call(this, body);
    };

    next();
  };
};

/**
 * Middleware: Invalidates relevant user cache keys on write operations (POST, PUT, DELETE).
 */
const clearCacheOnWrite = (req, res, next) => {
  // Capture original res.json to verify write success
  const originalJson = res.json;
  res.json = function (body) {
    res.json = originalJson;

    if (res.statusCode >= 200 && res.statusCode < 300) {
      const isWrite = ['POST', 'PUT', 'DELETE'].includes(req.method);
      if (isWrite) {
        const userId = req.user ? req.user._id.toString() : null;
        if (userId) {
          // Invalidate all keys matching this user ID
          deleteCachePattern(userId);
        } else {
          // If guest, search key by codes query param or shortCode body/params
          const codes = req.query.codes || req.body.codes;
          if (codes) {
            const codesArray = codes.split(',');
            codesArray.forEach((code) => deleteCachePattern(code));
          }
          const shortCode = req.params.shortCode || req.body.shortCode;
          if (shortCode) {
            deleteCachePattern(shortCode);
          }
        }
      }
    }

    return originalJson.call(this, body);
  };

  next();
};

module.exports = {
  cacheResponse,
  clearCacheOnWrite,
};
