/**
 * @file       PaymentHistory.js
 * @description Mongoose schema and model definition for user subscription transaction history.
 * @module     models/PaymentHistory
 * @requires   mongoose
 */

'use strict';

const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    stripePaymentIntentId: {
      type: String,
      required: true,
      unique: true,
    },
    stripeInvoiceId: {
      type: String,
      default: null,
    },
    amount: {
      type: Number, // In cents/pence (stored as integer)
      required: true,
    },
    currency: {
      type: String,
      default: 'usd',
    },
    status: {
      type: String,
      enum: ['succeeded', 'failed', 'pending', 'refunded'],
      required: true,
    },
    planId: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    receiptUrl: {
      type: String,
      default: null,
    },
    periodStart: {
      type: Date,
      default: null,
    },
    periodEnd: {
      type: Date,
      default: null,
    },
    paidAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for history lookups and webhook idempotency checking
paymentHistorySchema.index({ userId: 1 });
paymentHistorySchema.index({ stripePaymentIntentId: 1 }, { unique: true });
paymentHistorySchema.index({ status: 1 });
paymentHistorySchema.index({ paidAt: -1 });

module.exports = mongoose.model('PaymentHistory', paymentHistorySchema);
