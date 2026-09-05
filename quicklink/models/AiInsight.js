/**
 * @file       AiInsight.js
 * @description Mongoose schema for AI-generated link insights, predictions, and safety analysis.
 * @module     models/AiInsight
 */

'use strict';

const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema(
  {
    urlId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Url',
      required: true,
      unique: true,
    },
    title: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: [
        'Technology',
        'E-commerce',
        'News',
        'Education',
        'Entertainment',
        'Finance',
        'Social Media',
        'Marketing',
        'Health',
        'Travel',
        'Other',
      ],
      default: 'Other',
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    summary: {
      type: String,
      default: '',
    },
    sentiment: {
      type: String,
      enum: ['Positive', 'Neutral', 'Negative', 'Unknown'],
      default: 'Neutral',
    },
    safetyScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    isMalicious: {
      type: Boolean,
      default: false,
    },
    maliciousReason: {
      type: String,
      default: null,
    },
    suggestedAliases: [
      {
        type: String,
      },
    ],
    optimalPostingTimes: [
      {
        dayOfWeek: String,
        hourOfDay: Number,
        predictedEngagement: String,
      },
    ],
    predictedClicksNext30Days: {
      type: Number,
      default: 0,
    },
    analyzedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for query optimization
aiInsightSchema.index({ category: 1 });
aiInsightSchema.index({ tags: 1 });
aiInsightSchema.index({ isMalicious: 1 });

module.exports = mongoose.model('AiInsight', aiInsightSchema);
