/**
 * @file       AuditLog.js
 * @description Mongoose schema for Team Activity Audit Logs with 1-year TTL.
 * @module     models/AuditLog
 */

'use strict';

const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: [
      'team_created',
      'member_invited',
      'member_joined',
      'member_removed',
      'member_role_changed',
      'url_created',
      'url_edited',
      'url_deleted',
      'url_archived',
      'collection_created',
      'collection_deleted',
      'settings_changed',
      'domain_added',
      'domain_removed',
      'billing_changed',
      'team_deleted',
    ],
    required: true,
  },
  resourceType: {
    type: String,
    enum: ['team', 'member', 'url', 'collection', 'settings', 'domain'],
    default: null,
  },
  resourceId: {
    type: String,
    default: null,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  ipAddress: {
    type: String,
    default: 'unknown',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 31536000, // 1 year TTL
  },
});

// Indexes
auditLogSchema.index({ teamId: 1 });
auditLogSchema.index({ userId: 1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
