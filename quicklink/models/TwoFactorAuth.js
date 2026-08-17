/**
 * @file       TwoFactorAuth.js
 * @description Mongoose schema and model definition for user two-factor credentials (TOTP secret, backup codes).
 * @module     models/TwoFactorAuth
 * @requires   mongoose
 */

'use strict';

const mongoose = require('mongoose');

const twoFactorAuthSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    secret: {
      type: String,
      required: [true, '2FA Secret is required'],
    },
    isEnabled: {
      type: Boolean,
      default: false,
    },
    backupCodes: {
      type: [String],
      default: [],
    },
    usedBackupCodes: {
      type: [String],
      default: [],
    },
    enabledAt: {
      type: Date,
      default: null,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
  }
);

// Indexes

module.exports = mongoose.model('TwoFactorAuth', twoFactorAuthSchema);
