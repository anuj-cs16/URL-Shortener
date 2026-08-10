/**
 * @file       Click.js
 * @description Mongoose schema and model definition for URL click analytics records.
 * @module     models/Click
 * @requires   mongoose
 */

'use strict';

const mongoose = require('mongoose');

const clickSchema = new mongoose.Schema({
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: [true, 'URL ID reference is required'],
  },
  shortCode: {
    type: String,
    required: [true, 'Short code is required'],
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  ipAddress: {
    type: String,
    default: 'unknown',
  },
  country: {
    type: String,
    default: 'Unknown',
  },
  countryCode: {
    type: String,
    default: 'XX',
  },
  city: {
    type: String,
    default: 'Unknown',
  },
  browser: {
    type: String,
    default: 'Unknown',
  },
  browserVersion: {
    type: String,
    default: 'Unknown',
  },
  operatingSystem: {
    type: String,
    default: 'Unknown',
  },
  deviceType: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet', 'unknown'],
    default: 'unknown',
  },
  referrer: {
    type: String,
    default: 'Direct',
  },
  clickedAt: {
    type: Date,
    default: Date.now,
  },
});

// Configure database indexes for query optimization
clickSchema.index({ urlId: 1 });
clickSchema.index({ shortCode: 1 });
clickSchema.index({ clickedAt: -1 });
clickSchema.index({ country: 1 });
clickSchema.index({ deviceType: 1 });

module.exports = mongoose.model('Click', clickSchema);
