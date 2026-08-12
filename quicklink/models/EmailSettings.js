/**
 * @file       EmailSettings.js
 * @description Mongoose schema and model definition for user notification preferences.
 * @module     models/EmailSettings
 * @requires   mongoose
 * @created    2026-08-12
 */

'use strict';

const mongoose = require('mongoose');

const emailSettingsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    weeklyReport: {
      type: Boolean,
      default: true,
    },
    urlCreated: {
      type: Boolean,
      default: false,
    },
    clickMilestone: {
      type: Boolean,
      default: true,
    },
    urlExpiring: {
      type: Boolean,
      default: true,
    },
    urlExpired: {
      type: Boolean,
      default: false,
    },
    loginAlert: {
      type: Boolean,
      default: true,
    },
    milestoneValues: {
      type: [Number],
      default: [10, 50, 100, 500, 1000],
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Pre-save hook to update updatedAt
emailSettingsSchema.pre('save', function () {
  this.updatedAt = Date.now();
});

module.exports = mongoose.model('EmailSettings', emailSettingsSchema);
