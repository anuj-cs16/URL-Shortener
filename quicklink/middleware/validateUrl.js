/**
 * @file       validateUrl.js
 * @description Express middleware to validate that the provided URL is well-formed and uses HTTP/HTTPS protocols.
 * @module     middleware/validateUrl
 * @requires   valid-url
 */

'use strict';

const validUrl = require('valid-url');

/**
 * Validates the longUrl parameter in the request body.
 * Returns HTTP 400 if validation fails.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 * @returns {void}
 */
const validateUrl = (req, res, next) => {
  const { longUrl } = req.body;

  if (!longUrl) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid URL',
    });
  }

  // Trim whitespace
  const trimmedUrl = longUrl.trim();

  // Validate format and http/https protocols
  const isValidFormat = validUrl.isWebUri(trimmedUrl);
  const hasValidProtocol = trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://');

  if (!isValidFormat || !hasValidProtocol) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid URL',
    });
  }

  // Update body with trimmed url
  req.body.longUrl = trimmedUrl;
  next();
};

module.exports = validateUrl;
