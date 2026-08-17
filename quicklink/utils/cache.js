/**
 * @file       cache.js
 * @description Configures NodeCache instance and exports cache CRUD helper utilities.
 * @module     utils/cache
 */

'use strict';

const NodeCache = require('node-cache');

// Setup NodeCache instance
const defaultTTL = parseInt(process.env.CACHE_TTL_SECONDS, 10) || 300;
const cacheInstance = new NodeCache({
  stdTTL: defaultTTL,
  checkperiod: 60,
  useClones: false,
});

/**
 * Gets a value from cache by key.
 * @param {string} key - Cache key.
 * @returns {any|null} The cached value or null if not found.
 */
const getCache = (key) => {
  if (process.env.ENABLE_CACHE === 'false') return null;
  const value = cacheInstance.get(key);
  return value !== undefined ? value : null;
};

/**
 * Sets a value in the cache.
 * @param {string} key - Cache key.
 * @param {any} value - Value to cache.
 * @param {number} [ttl] - Optional custom Time-To-Live in seconds.
 * @returns {boolean} True on success.
 */
const setCache = (key, value, ttl) => {
  if (process.env.ENABLE_CACHE === 'false') return false;
  const expiry = ttl !== undefined ? ttl : defaultTTL;
  return cacheInstance.set(key, value, expiry);
};

/**
 * Deletes a single key from the cache.
 * @param {string} key - Cache key.
 * @returns {boolean} True if deleted.
 */
const deleteCache = (key) => {
  return cacheInstance.del(key) > 0;
};

/**
 * Deletes all keys matching a specific regex pattern.
 * @param {string|RegExp} pattern - Regex or string pattern to match against cache keys.
 * @returns {number} The count of keys deleted.
 */
const deleteCachePattern = (pattern) => {
  const keys = cacheInstance.keys();
  const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;
  const matchedKeys = keys.filter((key) => regex.test(key));
  if (matchedKeys.length > 0) {
    return cacheInstance.del(matchedKeys);
  }
  return 0;
};

/**
 * Flushes all data from the cache.
 */
const clearAllCache = () => {
  cacheInstance.flushAll();
};

/**
 * Returns cache performance statistics.
 * @returns {Object} Cache statistics metrics.
 */
const getCacheStats = () => {
  const stats = cacheInstance.getStats();
  const keys = cacheInstance.keys();
  
  // Basic calculation for approximate size
  let ksize = 0;
  let vsize = 0;
  
  keys.forEach((key) => {
    ksize += Buffer.byteLength(key, 'utf8');
    const val = cacheInstance.get(key);
    if (val) {
      try {
        vsize += Buffer.byteLength(JSON.stringify(val), 'utf8');
      } catch (e) {
        // Fallback for circular or un-stringifiable objects
        vsize += 100;
      }
    }
  });

  return {
    keys: keys.length,
    hits: stats.hits,
    misses: stats.misses,
    ksize,
    vsize,
  };
};

module.exports = {
  cacheInstance,
  getCache,
  setCache,
  deleteCache,
  deleteCachePattern,
  clearAllCache,
  getCacheStats,
};
