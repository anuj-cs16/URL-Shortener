/**
 * @file       UrlCollection.js
 * @description Mongoose schema for Team URL Folders/Collections.
 * @module     models/UrlCollection
 */

'use strict';

const mongoose = require('mongoose');

const urlCollectionSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Team',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '#6C63FF',
  },
  icon: {
    type: String,
    default: '📁',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  urlCount: {
    type: Number,
    default: 0,
  },
  order: {
    type: Number,
    default: 0,
  },
  isShared: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
urlCollectionSchema.index({ teamId: 1 });
urlCollectionSchema.index({ createdBy: 1 });

module.exports = mongoose.model('UrlCollection', urlCollectionSchema);
