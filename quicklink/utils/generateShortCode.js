/**
 * @file       generateShortCode.js
 * @description Utility function to generate a unique 7-character alphanumeric short code.
 * @module     utils/generateShortCode
 * @requires   nanoid
 * @requires   models/Url
 */

'use strict';

const { customAlphabet } = require('nanoid');
const Url = require('../models/Url');

// Define safe alphabet consisting of alphanumeric characters only
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const nanoid = customAlphabet(alphabet, 7);

/**
 * Generates a unique 7-character short code.
 * Validates uniqueness against the database.
 * @returns {Promise<string>} The unique short code.
 */
const generateShortCode = async () => {
  try {
    let isUnique = false;
    let shortCode = '';

    while (!isUnique) {
      shortCode = nanoid();
      const existing = await Url.findOne({ shortCode });
      if (!existing) {
        isUnique = true;
      }
    }

    return shortCode;
  } catch (error) {
    console.error(`Error generating short code: ${error.message}`);
    throw error;
  }
};

module.exports = generateShortCode;
