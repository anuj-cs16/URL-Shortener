/**
 * @file       BlockedIp.js
 * @description Mongoose schema and model definition for tracking blacklisted IP addresses.
 * @module     models/BlockedIp
 * @requires   mongoose
 */

'use strict';

const mongoose = require('mongoose');

const blockedIpSchema = new mongoose.Schema(
  {
    ipAddress: {
      type: String,
      required: [true, 'IP Address is required'],
      unique: true,
      trim: true,
    },
    reason: {
      type: String,
      required: [true, 'Block reason is required'],
      trim: true,
    },
    blockedBy: {
      type: String,
      enum: ['system', 'admin'],
      default: 'system',
    },
    blockedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    isPermanent: {
      type: Boolean,
      default: false,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
  }
);

// Indexes
blockedIpSchema.index({ expiresAt: 1 });
blockedIpSchema.index({ isPermanent: 1 });

module.exports = mongoose.model('BlockedIp', blockedIpSchema);
