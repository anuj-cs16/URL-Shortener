/**
 * @file       Subscription.js
 * @description Mongoose schema and model definition for User subscriptions.
 * @module     models/Subscription
 * @requires   mongoose
 */

'use strict';

const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    planId: {
      type: String,
      enum: ['free', 'pro', 'business'],
      default: 'free',
    },
    status: {
      type: String,
      enum: [
        'active',
        'canceled',
        'past_due',
        'trialing',
        'incomplete',
        'paused',
        'free',
      ],
      default: 'free',
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
    },
    stripePriceId: {
      type: String,
      default: null,
    },
    currentPeriodStart: {
      type: Date,
      default: null,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: {
      type: Date,
      default: null,
    },
    trialEnd: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Checks if the subscription is in a usable state.
 * @returns {boolean} True if active, trialing, or free.
 */
subscriptionSchema.methods.isActive = function () {
  return ['active', 'trialing', 'free'].includes(this.status);
};

/**
 * Checks if the subscription is a valid Pro subscription.
 * @returns {boolean} True if planId is 'pro' and is active.
 */
subscriptionSchema.methods.isPro = function () {
  return this.planId === 'pro' && this.isActive();
};

/**
 * Checks if the subscription is a valid Business subscription.
 * @returns {boolean} True if planId is 'business' and is active.
 */
subscriptionSchema.methods.isBusiness = function () {
  return this.planId === 'business' && this.isActive();
};

/**
 * Calculates number of days remaining until currentPeriodEnd.
 * @returns {number|null} Days until renewal, or null if no period end defined.
 */
subscriptionSchema.methods.daysUntilRenewal = function () {
  if (!this.currentPeriodEnd) return null;
  const diffTime = new Date(this.currentPeriodEnd) - new Date();
  if (diffTime < 0) return 0;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Add indexes for query optimization
subscriptionSchema.index({ userId: 1 }, { unique: true });
subscriptionSchema.index({ stripeCustomerId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ status: 1 });

module.exports = mongoose.model('Subscription', subscriptionSchema);
