/**
 * @file       subscriptionRoutes.js
 * @description Route definitions for plan tiers, checkout sessions, customer portal sessions,
 *              billing cancellations, payments history, and Stripe webhook.
 * @module     routes/subscriptionRoutes
 * @requires   express
 * @requires   controllers/subscriptionController
 * @requires   middleware/auth
 */

'use strict';

const express = require('express');
const router = express.Router();

const {
  getPlans,
  getCurrentSubscription,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  reactivateSubscription,
  applyPromoCode,
  getPaymentHistory,
  getUsageStats,
  handleWebhook,
} = require('../controllers/subscriptionController');

const { isAuthenticated, optionalAuth } = require('../middleware/auth');

// Public route to view plans (optionally authenticated to mark current plan)
router.get('/plans', optionalAuth, getPlans);

// Stripe Webhook: public access (Stripe calls this). Needs raw body, which is handled in server.js middleware setup.
router.post('/webhook', handleWebhook);

// Protected routes (require active authentication session)
router.use(isAuthenticated);

router.get('/current', getCurrentSubscription);
router.post('/checkout', createCheckoutSession);
router.post('/portal', createPortalSession);
router.post('/cancel', cancelSubscription);
router.post('/reactivate', reactivateSubscription);
router.post('/promo', applyPromoCode);
router.get('/payments', getPaymentHistory);
router.get('/usage', getUsageStats);

module.exports = router;
