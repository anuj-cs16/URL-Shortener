/**
 * @file       UsageRecord.js
 * @description Mongoose schema and model definition for monthly subscription usage.
 * @module     models/UsageRecord
 * @requires   mongoose
 */

'use strict';

const mongoose = require('mongoose');

const usageRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    month: {
      type: String, // '01' - '12'
      required: true,
    },
    year: {
      type: Number, // e.g. 2026
      required: true,
    },
    urlsCreated: {
      type: Number,
      default: 0,
    },
    clicksReceived: {
      type: Number,
      default: 0,
    },
    apiCallsMade: {
      type: Number,
      default: 0,
    },
    bulkOperations: {
      type: Number,
      default: 0,
    },
    resetDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to guarantee uniqueness of monthly tracking records per user
usageRecordSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('UsageRecord', usageRecordSchema);
