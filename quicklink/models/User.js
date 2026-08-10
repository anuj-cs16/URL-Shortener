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
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
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

module.exports = mongoose.model('User', userSchema);
