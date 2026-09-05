/**
 * @file       AiConversation.js
 * @description Mongoose schema for AI Copilot user chat conversations and message history.
 * @module     models/AiConversation
 */

'use strict';

const mongoose = require('mongoose');

const aiConversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
    },
    title: {
      type: String,
      default: 'New Chat',
    },
    messages: [
      {
        role: {
          type: String,
          enum: ['user', 'assistant', 'system'],
          required: true,
        },
        content: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
aiConversationSchema.index({ userId: 1 });
aiConversationSchema.index({ teamId: 1 });
aiConversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('AiConversation', aiConversationSchema);
