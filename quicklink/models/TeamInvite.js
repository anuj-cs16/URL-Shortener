/**
 * @file       TeamInvite.js
 * @description Mongoose schema and model for Team Invitations.
 * @module     models/TeamInvite
 */

'use strict';

const mongoose = require('mongoose');

const teamInviteSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    default: 'viewer',
  },
  inviteCode: {
    type: String,
    required: true,
    unique: true,
  },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'expired', 'revoked'],
    default: 'pending',
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
  acceptedAt: {
    type: Date,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
teamInviteSchema.index({ inviteCode: 1 }, { unique: true });
teamInviteSchema.index({ teamId: 1 });
teamInviteSchema.index({ email: 1 });
teamInviteSchema.index({ status: 1 });

/**
 * Check if invitation is expired
 */
teamInviteSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

/**
 * Check if invitation is pending and valid
 */
teamInviteSchema.methods.isPending = function () {
  return this.status === 'pending' && !this.isExpired();
};

module.exports = mongoose.model('TeamInvite', teamInviteSchema);
