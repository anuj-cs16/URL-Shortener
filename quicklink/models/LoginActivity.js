/**
 * @file       LoginActivity.js
 * @description Mongoose schema and model definition for tracking user login and security actions.
 *              Includes TTL index to auto-delete logs older than 90 days.
 * @module     models/LoginActivity
 * @requires   mongoose
 */

'use strict';

const mongoose = require('mongoose');

const loginActivitySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    activityType: {
      type: String,
      enum: [
        'login_success',
        'login_failed',
        'logout',
        'password_changed',
        'two_factor_enabled',
        'two_factor_disabled',
        'two_factor_success',
        'two_factor_failed',
        'account_locked',
        'account_unlocked',
        'suspicious_activity',
      ],
      required: [true, 'Activity type is required'],
    },
    ipAddress: {
      type: String,
      default: 'unknown',
    },
    country: {
      type: String,
      default: 'Unknown',
    },
    city: {
      type: String,
      default: 'Unknown',
    },
    browser: {
      type: String,
      default: 'Unknown',
    },
    operatingSystem: {
      type: String,
      default: 'Unknown',
    },
    deviceType: {
      type: String,
      default: 'unknown',
    },
    isSuspicious: {
      type: Boolean,
      default: false,
    },
    suspiciousReason: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Indexes
loginActivitySchema.index({ userId: 1 });
loginActivitySchema.index({ activityType: 1 });
loginActivitySchema.index({ createdAt: -1 });
loginActivitySchema.index({ isSuspicious: 1 });
loginActivitySchema.index({ ipAddress: 1 });

// TTL index to auto-expire records after 90 days (7,776,000 seconds)
loginActivitySchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

module.exports = mongoose.model('LoginActivity', loginActivitySchema);
