/**
 * @file       Url.js
 * @description Mongoose schema and model definition for URL records.
 * @module     models/Url
 * @requires   mongoose
 */

'use strict';

const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  longUrl: {
    type: String,
    required: [true, 'Original URL is required'],
    trim: true,
  },
  shortCode: {
    type: String,
    required: [true, 'Short code is required'],
    unique: true,
    trim: true,
  },
  customCode: {
    type: String,
    default: null,
  },
  clicks: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days expiry
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastClickedAt: {
    type: Date,
    default: null,
  },
});

// Add indexes on shortCode and createdAt
urlSchema.index({ shortCode: 1 }, { unique: true });
urlSchema.index({ createdAt: -1 });

/**
 * Checks if the shortened URL has expired.
 * @returns {boolean} True if the current date is past expiresAt, false otherwise.
 */
urlSchema.methods.isExpired = function () {
  return this.expiresAt && new Date() > this.expiresAt;
};

module.exports = mongoose.model('Url', urlSchema);
