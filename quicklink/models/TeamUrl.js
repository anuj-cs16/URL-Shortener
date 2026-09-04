/**
 * @file       TeamUrl.js
 * @description Mongoose schema for Team URLs associating Urls with Team Workspaces.
 * @module     models/TeamUrl
 */

'use strict';

const mongoose = require('mongoose');

const teamUrlSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  urlId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Url',
    required: true,
    unique: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  lastEditedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  collectionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'UrlCollection',
    default: null,
  },
  tags: [{
    type: String,
    trim: true,
  }],
  notes: {
    type: String,
    default: '',
    maxlength: 500,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  isArchived: {
    type: Boolean,
    default: false,
  },
  approvalStatus: {
    type: String,
    enum: ['approved', 'pending', 'rejected'],
    default: 'approved',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
teamUrlSchema.index({ teamId: 1 });
teamUrlSchema.index({ urlId: 1 }, { unique: true });
teamUrlSchema.index({ createdBy: 1 });
teamUrlSchema.index({ collectionId: 1 });
teamUrlSchema.index({ tags: 1 });
teamUrlSchema.index({ isPinned: 1 });

module.exports = mongoose.model('TeamUrl', teamUrlSchema);
