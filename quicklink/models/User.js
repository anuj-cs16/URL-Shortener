/**
 * @file       User.js
 * @description Mongoose schema and model definition for User accounts. Includes password hashing, JWT generation, and token matching.
 * @module     models/User
 * @requires   mongoose
 * @requires   bcryptjs
 * @requires   jsonwebtoken
 * @requires   crypto
 */

'use strict';

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please enter your email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email address',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Prevents password from being returned in query responses by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  totalUrlsCreated: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLoginAt: {
    type: Date,
    default: null,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpire: {
    type: Date,
    default: null,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
    default: null,
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false,
  },
  isBanned: {
    type: Boolean,
    default: false,
  },
  bannedReason: {
    type: String,
    default: null,
  },
  lastLoginIp: {
    type: String,
    default: null,
  },
  knownIpAddresses: {
    type: [String],
    default: [],
  },
  securityScore: {
    type: Number,
    default: 50,
    min: 0,
    max: 100,
  },
  jwtSecret: {
    type: String,
    default: () => require('crypto').randomBytes(32).toString('hex'),
  },
  planId: {
    type: String,
    enum: ['free', 'pro', 'business'],
    default: 'free',
  },
  stripeCustomerId: {
    type: String,
    default: null,
  },
  isLifetimeMember: {
    type: Boolean,
    default: false,
  },
  referralCode: {
    type: String,
    default: () => require('crypto').randomBytes(4).toString('hex'),
    unique: true,
    sparse: true,
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  trialUsed: {
    type: Boolean,
    default: false,
  },
});

/**
 * Pre-save Mongoose hook to hash user passwords prior to persistence.
 */
userSchema.pre('save', async function () {
  // Only encrypt if the password field is new or modified
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Compares a plain text password against the hashed user password.
 * @param {string} enteredPassword - The plain text password entered by the client.
 * @returns {Promise<boolean>} True if match, false otherwise.
 */
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

/**
 * Generates a signed JWT token containing the user's ID as the payload.
 * @returns {string} The signed JWT token string.
 */
userSchema.methods.getJwtToken = function (twoFactorVerified = false) {
  const secret = process.env.JWT_SECRET + (this.jwtSecret || '');
  return jwt.sign(
    { id: this._id, twoFactorVerified },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

/**
 * Generates and hashes a reset token. Sets expiration limits.
 * @returns {string} The unhashed raw reset token.
 */
userSchema.methods.getResetPasswordToken = function () {
  // Generate random token string
  const resetToken = crypto.randomBytes(20).toString('hex');

  // Hash reset token and save to document field
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set reset expiration to 30 minutes from current timestamp
  this.resetPasswordExpire = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

/**
 * Checks if the account is currently locked.
 * Returns true if locked, false otherwise. If the lock has expired, resets attempts.
 * @returns {boolean}
 */
userSchema.methods.isAccountLocked = function () {
  if (this.lockUntil && this.lockUntil > Date.now()) {
    return true;
  }
  // If lock has expired but fields are still set
  if (this.isLocked || this.loginAttempts > 0) {
    this.isLocked = false;
    this.loginAttempts = 0;
    this.lockUntil = null;
    this.save().catch((err) => console.error(`Error resetting locked attempts: ${err.message}`));
  }
  return false;
};

/**
 * Increments failed login attempts. Locks account if threshold is met.
 * @returns {Promise<Object>}
 */
userSchema.methods.incrementLoginAttempts = async function () {
  this.loginAttempts += 1;
  const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS, 10) || 5;
  
  if (this.loginAttempts >= maxAttempts) {
    this.isLocked = true;
    const lockMinutes = parseInt(process.env.LOCK_TIME_MINUTES, 10) || 30;
    this.lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);

    // Log account locked event
    try {
      const LoginActivity = mongoose.model('LoginActivity');
      await LoginActivity.create({
        userId: this._id,
        activityType: 'account_locked',
        ipAddress: this.lastLoginIp || 'unknown',
        suspiciousReason: `Account locked due to ${this.loginAttempts} failed login attempts.`,
      });
    } catch (err) {
      console.error(`Failed to log account locked activity: ${err.message}`);
    }

    // Send email alert
    try {
      const emailService = require('../utils/emailService');
      emailService.sendAccountLockedEmail(this, this.lockUntil, this.lastLoginIp || 'unknown').catch((err) => {
        console.error(`Failed to send account locked email: ${err.message}`);
      });
    } catch (err) {
      console.error(`Failed to dispatch account locked email: ${err.message}`);
    }
  }
  return await this.save();
};

/**
 * Resets login attempts and unlocks user.
 * @returns {Promise<Object>}
 */
userSchema.methods.resetLoginAttempts = async function () {
  this.loginAttempts = 0;
  this.isLocked = false;
  this.lockUntil = null;
  return await this.save();
};

/**
 * Computes and updates the security score of the user document.
 * @returns {Promise<number>}
 */
userSchema.methods.calculateSecurityScore = async function () {
  let score = 50;

  if (this.isTwoFactorEnabled) {
    score += 20;
  }

  if (this.password && this.password.length > 12) {
    score += 10;
  }

  if (this.knownIpAddresses && this.knownIpAddresses.length > 0) {
    score += 10;
  }

  if (this.loginAttempts > 3) {
    score -= 20;
  }

  try {
    const LoginActivity = mongoose.model('LoginActivity');
    const recentSuspicious = await LoginActivity.countDocuments({
      userId: this._id,
      activityType: 'suspicious_activity',
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    });
    if (recentSuspicious > 0) {
      score -= 10;
    }
  } catch (err) {
    console.error(`Error auditing security score logs: ${err.message}`);
  }

  this.securityScore = Math.max(0, Math.min(100, score));
  await this.save();
  return this.securityScore;
};

module.exports = mongoose.model('User', userSchema);
