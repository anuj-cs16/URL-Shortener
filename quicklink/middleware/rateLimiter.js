/**
 * @file       rateLimiter.js
 * @description Express middleware to rate limit public endpoints.
 * @module     middleware/rateLimiter
 * @requires   express-rate-limit
 */

'use strict';

const rateLimit = require('express-rate-limit');

/**
 * Rate limiter configuration.
 * Limits clients to 10 requests per 10 minutes.
 */
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes window
  max: 10, // Limit each IP to 10 requests per windowMs
  statusCode: 429,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

module.exports = limiter;
