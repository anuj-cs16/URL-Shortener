/**
 * @file       stripeService.js
 * @description SDK bindings for Stripe customers, checkout sessions, customer portal sessions, and webhook processing.
 * @module     utils/stripeService
 * @requires   stripe
 */

'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'dummy_key');
const User = require('../models/User');

const getBaseUrl = () => {
  return process.env.BASE_URL || 'http://localhost:5000';
};

/**
 * Creates a Stripe customer for a user.
 * @param {Object} user - User document instance.
 * @returns {Promise<Object>} Stripe Customer object.
 */
const createCustomer = async (user) => {
  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: {
        userId: user._id.toString(),
      },
    });

    user.stripeCustomerId = customer.id;
    await user.save();

    return customer;
  } catch (error) {
    console.error(`Stripe customer creation failed: ${error.message}`);
    throw error;
  }
};

/**
 * Generates a Stripe checkout redirect URL for a specific plan price.
 * @param {string} userId - User Mongoose ID.
 * @param {string} priceId - Stripe Price ID.
 * @returns {Promise<string>} Checkout session redirect URL.
 */
const createCheckoutSession = async (userId, priceId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await createCustomer(user);
      customerId = customer.id;
    }

    const baseUrl = getBaseUrl();
    const sessionConfig = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing`,
      customer: customerId,
      allow_promotion_codes: true,
      metadata: {
        userId: userId.toString(),
      },
    };

    // Apply 14-day free trial if the user hasn't used their trial yet
    if (!user.trialUsed) {
      sessionConfig.subscription_data = {
        trial_period_days: 14,
        metadata: {
          userId: userId.toString(),
        },
      };
    } else {
      sessionConfig.subscription_data = {
        metadata: {
          userId: userId.toString(),
        },
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    return session.url;
  } catch (error) {
    console.error(`Stripe checkout session generation failed: ${error.message}`);
    throw error;
  }
};

/**
 * Creates a Stripe billing portal session URL.
 * @param {string} userId
 * @returns {Promise<string>} Portal session URL.
 */
const createPortalSession = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user || !user.stripeCustomerId) {
      throw new Error('No active payment customer profile found');
    }

    const baseUrl = getBaseUrl();
    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl}/billing`,
    });

    return session.url;
  } catch (error) {
    console.error(`Stripe billing portal session creation failed: ${error.message}`);
    throw error;
  }
};

/**
 * Retrieves Stripe subscription object.
 * @param {string} subscriptionId
 * @returns {Promise<Object>}
 */
const getSubscription = async (subscriptionId) => {
  return await stripe.subscriptions.retrieve(subscriptionId);
};

/**
 * Cancels a subscription at the end of the current billing period.
 * @param {string} subscriptionId
 * @returns {Promise<Object>} Updated subscription details.
 */
const cancelSubscription = async (subscriptionId) => {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
};

/**
 * Reactivates a cancel-at-period-end subscription.
 * @param {string} subscriptionId
 * @returns {Promise<Object>} Updated subscription details.
 */
const reactivateSubscription = async (subscriptionId) => {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
};

/**
 * Retrieves invoice history for a customer.
 * @param {string} customerId
 * @param {number} limit
 * @returns {Promise<Array>} List of formatted invoices.
 */
const getInvoices = async (customerId, limit = 12) => {
  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });

    return invoices.data.map((inv) => ({
      id: inv.id,
      number: inv.number,
      amount: inv.amount_paid || inv.total,
      currency: inv.currency,
      status: inv.status,
      hostedInvoiceUrl: inv.hosted_invoice_url,
      pdfUrl: inv.invoice_pdf,
      created: new Date(inv.created * 1000),
    }));
  } catch (error) {
    console.error(`Stripe invoices retrieval failed: ${error.message}`);
    return [];
  }
};

/**
 * Validates Stripe webhook event payload and signature.
 * @param {Buffer|string} payload - Raw HTTP request body.
 * @param {string} sig - Stripe signature header.
 * @returns {Object} Verified Stripe Event object.
 */
const constructWebhookEvent = (payload, sig) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET || 'dummy_webhook_secret';
  return stripe.webhooks.constructEvent(payload, sig, secret);
};

module.exports = {
  createCustomer,
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  cancelSubscription,
  reactivateSubscription,
  getInvoices,
  constructWebhookEvent,
};
