/**
 * @file       subscriptionController.js
 * @description Controllers managing plans retrieval, checkout sessions, billing portal,
 *              subscription status transitions, payments history, and Stripe webhook handling.
 * @module     controllers/subscriptionController
 */

'use strict';

const User = require('../models/User');
const Subscription = require('../models/Subscription');
const UsageRecord = require('../models/UsageRecord');
const PaymentHistory = require('../models/PaymentHistory');
const Notification = require('../models/Notification');
const { PLANS, getPlanById } = require('../config/plans');
const stripeService = require('../utils/stripeService');
const emailService = require('../utils/emailService');

/**
 * Returns available plans. Mark current plan if user is authenticated.
 * @route   GET /api/subscription/plans
 */
const getPlans = async (req, res, next) => {
  try {
    const plansList = Object.values(PLANS);
    let currentPlan = 'free';

    if (req.user) {
      const sub = await Subscription.findOne({ userId: req.user._id });
      if (sub) {
        currentPlan = sub.planId;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        plans: plansList,
        currentPlan,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the current user's subscription details and monthly usage statistics.
 * @route   GET /api/subscription/current
 */
const getCurrentSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let sub = await Subscription.findOne({ userId });
    if (!sub) {
      // Create lazy subscription if missing
      sub = await Subscription.create({
        userId,
        planId: 'free',
        status: 'free',
      });
    }

    const { getCurrentUsage } = require('../middleware/usageLimiter');
    const usage = await getCurrentUsage(userId);
    const plan = getPlanById(sub.planId);

    // Calculate usage percentage bars
    const urlsPercentage = plan.limits.urlsPerMonth === -1 ? 0 : Math.min(100, Math.round((usage.urlsCreated / plan.limits.urlsPerMonth) * 100));
    const clicksPercentage = plan.limits.clicksPerMonth === -1 ? 0 : Math.min(100, Math.round((usage.clicksReceived / plan.limits.clicksPerMonth) * 100));

    res.status(200).json({
      success: true,
      data: {
        subscription: {
          planId: sub.planId,
          status: sub.status,
          currentPeriodStart: sub.currentPeriodStart,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
          daysUntilRenewal: sub.daysUntilRenewal(),
          trialEnd: sub.trialEnd,
        },
        plan: {
          name: plan.name,
          price: plan.price,
          features: plan.features,
          limits: plan.limits,
          color: plan.color,
          icon: plan.icon,
        },
        usage: {
          urlsCreated: usage.urlsCreated,
          urlsLimit: plan.limits.urlsPerMonth,
          urlsPercentage,
          clicksReceived: usage.clicksReceived,
          clicksLimit: plan.limits.clicksPerMonth,
          clicksPercentage,
          resetDate: usage.resetDate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initiates checkout redirects session.
 * @route   POST /api/subscription/checkout
 */
const createCheckoutSession = async (req, res, next) => {
  try {
    const { planId } = req.body;
    if (!planId || !['pro', 'business'].includes(planId.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: 'Please choose a valid premium subscription tier (Pro or Business)',
      });
    }

    const plan = getPlanById(planId);
    let priceId = planId.toLowerCase() === 'pro' ? process.env.STRIPE_PRO_PRICE_ID : process.env.STRIPE_BUSINESS_PRICE_ID;
    if (!priceId || priceId.startsWith('price_')) {
      priceId = plan.stripePriceId;
    }

    if (!priceId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription pricing mapping is not configured. Please contact support.',
      });
    }

    const checkoutUrl = await stripeService.createCheckoutSession(req.user._id, priceId);

    res.status(200).json({
      success: true,
      data: {
        checkoutUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Initiates billing portal redirect session.
 * @route   POST /api/subscription/portal
 */
const createPortalSession = async (req, res, next) => {
  try {
    if (!req.user.stripeCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'No active payment customer profile found',
      });
    }

    const portalUrl = await stripeService.createPortalSession(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        portalUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cancels user subscription.
 * @route   POST /api/subscription/cancel
 */
const cancelSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const sub = await Subscription.findOne({ userId });

    if (!sub || sub.planId === 'free' || !sub.stripeSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'No active paid subscription found',
      });
    }

    const updatedStripeSub = await stripeService.cancelSubscription(sub.stripeSubscriptionId);

    sub.cancelAtPeriodEnd = true;
    sub.canceledAt = new Date();
    sub.status = 'canceled';
    await sub.save();

    // Notify user via Email asynchronously
    emailService.sendSubscriptionCanceledEmail(req.user, sub).catch(err => {
      console.error(`Canceled subscription email background dispatch failed: ${err.message}`);
    });

    // Create Notification
    await Notification.create({
      userId,
      type: 'subscription_canceled',
      title: 'Subscription Canceled ⏳',
      message: `Your subscription will remain active until the end of your billing cycle on ${sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : ''}.`,
      isEmailSent: true,
      emailSentAt: new Date(),
    });

    res.status(200).json({
      success: true,
      message: `Subscription will cancel on ${sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : ''}`,
      data: {
        cancelDate: sub.currentPeriodEnd,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reactivates user subscription before it lapses.
 * @route   POST /api/subscription/reactivate
 */
const reactivateSubscription = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const sub = await Subscription.findOne({ userId });

    if (!sub || !sub.stripeSubscriptionId || !sub.cancelAtPeriodEnd) {
      return res.status(400).json({
        success: false,
        message: 'No cancel-pending subscription found to reactivate',
      });
    }

    await stripeService.reactivateSubscription(sub.stripeSubscriptionId);

    sub.cancelAtPeriodEnd = false;
    sub.canceledAt = null;
    sub.status = 'active';
    await sub.save();

    // Create Notification
    await Notification.create({
      userId,
      type: 'welcome',
      title: 'Subscription Reactivated! 🎉',
      message: 'Your subscription has been successfully reactivated. Thank you for staying with us!',
    });

    res.status(200).json({
      success: true,
      message: 'Subscription successfully reactivated!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validates Stripe coupon / promo code.
 * @route   POST /api/subscription/promo
 */
const applyPromoCode = async (req, res, next) => {
  try {
    const { promoCode } = req.body;
    if (!promoCode) {
      return res.status(400).json({
        success: false,
        message: 'Promo code is required',
      });
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'dummy');
    const promotionCodes = await stripe.promotionCodes.list({
      code: promoCode,
      active: true,
    });

    if (!promotionCodes.data || promotionCodes.data.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired promo code',
      });
    }

    const promo = promotionCodes.data[0];
    const coupon = promo.coupon;
    const discountStr = coupon.percent_off
      ? `${coupon.percent_off}% off`
      : `$${(coupon.amount_off / 100).toFixed(2)} off`;

    res.status(200).json({
      success: true,
      data: {
        discount: `${discountStr} applied`,
        validUntil: promo.expires_at ? new Date(promo.expires_at * 1000) : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves payment transaction invoice history.
 * @route   GET /api/subscription/payments
 */
const getPaymentHistory = async (req, res, next) => {
  try {
    const payments = await PaymentHistory.find({ userId: req.user._id }).sort({ paidAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        payments,
        total: payments.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves general usage counters.
 * @route   GET /api/subscription/usage
 */
const getUsageStats = async (req, res, next) => {
  try {
    const { getCurrentUsage, getPlanLimitsForUser } = require('../middleware/usageLimiter');
    const usage = await getCurrentUsage(req.user._id);
    const limits = await getPlanLimitsForUser(req.user._id);

    const sub = await Subscription.findOne({ userId: req.user._id });
    const planId = sub ? sub.planId : 'free';

    const urlsPercent = limits.urlsPerMonth === -1 ? 0 : Math.min(100, Math.round((usage.urlsCreated / limits.urlsPerMonth) * 100));
    const clicksPercent = limits.clicksPerMonth === -1 ? 0 : Math.min(100, Math.round((usage.clicksReceived / limits.clicksPerMonth) * 100));
    const apiPercent = limits.apiAccess === false ? 0 : 0; // fallback

    const daysUntilReset = usage.resetDate ? Math.ceil((new Date(usage.resetDate) - new Date()) / (1000 * 60 * 60 * 24)) : 0;

    res.status(200).json({
      success: true,
      data: {
        currentMonth: `${usage.year}-${usage.month}`,
        usage: {
          urlsCreated: { used: usage.urlsCreated, limit: limits.urlsPerMonth, percent: urlsPercent },
          clicksReceived: { used: usage.clicksReceived, limit: limits.clicksPerMonth, percent: clicksPercent },
          apiCalls: { used: usage.apiCallsMade, limit: limits.apiAccess ? -1 : 0, percent: apiPercent },
        },
        resetDate: usage.resetDate,
        daysUntilReset,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handles Webhook updates sent by Stripe.
 * @route   POST /api/subscription/webhook
 */
const handleWebhook = async (req, res, next) => {
  let event;
  try {
    const sig = req.headers['stripe-signature'];
    event = stripeService.constructWebhookEvent(req.body, sig);
  } catch (error) {
    console.error(`⚠️ Webhook signature verification failed: ${error.message}`);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    const stripeObj = event.data.object;

    switch (event.type) {
      case 'checkout.session.completed': {
        const userId = stripeObj.metadata.userId;
        if (userId) {
          const user = await User.findById(userId);
          const stripeSubscriptionId = stripeObj.subscription;

          if (user && stripeSubscriptionId) {
            const stripeSub = await stripeService.getSubscription(stripeSubscriptionId);
            const priceId = stripeSub.items.data[0].price.id;

            // Resolve plan type
            let planId = 'free';
            if (priceId === process.env.STRIPE_PRO_PRICE_ID || priceId === 'price_pro_test_id') {
              planId = 'pro';
            } else if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID || priceId === 'price_business_test_id') {
              planId = 'business';
            }

            user.planId = planId;
            user.stripeCustomerId = stripeObj.customer;
            user.trialUsed = true; // Mark free trial as used
            await user.save();

            await Subscription.findOneAndUpdate(
              { userId: user._id },
              {
                planId,
                status: stripeSub.status,
                stripeCustomerId: stripeObj.customer,
                stripeSubscriptionId,
                stripePriceId: priceId,
                currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
                cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
                trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
              },
              { upsert: true, new: true }
            );

            // Make sure current usage record is initialized
            const { getCurrentUsage } = require('../middleware/usageLimiter');
            await getCurrentUsage(user._id);

            // Dispatch welcome alerts
            emailService.sendSubscriptionWelcomeEmail(user, planId).catch(err => {
              console.error(`Welcome premium email background dispatch failed: ${err.message}`);
            });

            await Notification.create({
              userId: user._id,
              type: 'welcome',
              title: `Welcome to QuickLink ${planId === 'pro' ? 'Pro ⚡' : 'Business 🚀'}!`,
              message: `Your account was successfully upgraded. Enjoy your new features!`,
            });
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const stripeSubscriptionId = stripeObj.id;
        const sub = await Subscription.findOne({ stripeSubscriptionId });
        if (sub) {
          const user = await User.findById(sub.userId);
          if (user) {
            const priceId = stripeObj.items.data[0].price.id;

            // Resolve plan type
            let planId = 'free';
            if (priceId === process.env.STRIPE_PRO_PRICE_ID || priceId === 'price_pro_test_id') {
              planId = 'pro';
            } else if (priceId === process.env.STRIPE_BUSINESS_PRICE_ID || priceId === 'price_business_test_id') {
              planId = 'business';
            }

            const oldPlanId = user.planId;
            user.planId = planId;
            await user.save();

            sub.planId = planId;
            sub.status = stripeObj.status;
            sub.currentPeriodStart = new Date(stripeObj.current_period_start * 1000);
            sub.currentPeriodEnd = new Date(stripeObj.current_period_end * 1000);
            sub.cancelAtPeriodEnd = stripeObj.cancel_at_period_end;
            sub.trialEnd = stripeObj.trial_end ? new Date(stripeObj.trial_end * 1000) : null;
            await sub.save();

            // Send notification on upgrade/downgrade transition
            if (oldPlanId !== planId) {
              await Notification.create({
                userId: user._id,
                type: 'welcome',
                title: 'Plan Updated ⚡',
                message: `Your plan has changed from ${oldPlanId.toUpperCase()} to ${planId.toUpperCase()}.`,
              });
            }
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const stripeSubscriptionId = stripeObj.id;
        const sub = await Subscription.findOne({ stripeSubscriptionId });
        if (sub) {
          sub.planId = 'free';
          sub.status = 'canceled';
          sub.cancelAtPeriodEnd = false;
          await sub.save();

          const user = await User.findById(sub.userId);
          if (user) {
            user.planId = 'free';
            await user.save();

            // Notify user
            emailService.sendSubscriptionCanceledEmail(user, sub).catch(err => {
              console.error(`Ended subscription email background dispatch failed: ${err.message}`);
            });

            await Notification.create({
              userId: user._id,
              type: 'welcome',
              title: 'Subscription Ended ⏳',
              message: 'Your premium features have expired. Your account was returned to the Free tier.',
            });
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const chargeId = stripeObj.charge;
        const paymentIntentId = stripeObj.payment_intent;

        if (paymentIntentId) {
          const subscriptionId = stripeObj.subscription;
          const sub = await Subscription.findOne({ stripeSubscriptionId: subscriptionId });

          if (sub) {
            const user = await User.findById(sub.userId);
            if (user) {
              // Avoid duplicate logs (webhook idempotency)
              const existingHistory = await PaymentHistory.findOne({ stripePaymentIntentId: paymentIntentId });
              if (!existingHistory) {
                const receiptUrl = stripeObj.hosted_invoice_url || null;

                const payment = await PaymentHistory.create({
                  userId: user._id,
                  stripePaymentIntentId: paymentIntentId,
                  stripeInvoiceId: stripeObj.id,
                  amount: stripeObj.amount_paid,
                  currency: stripeObj.currency,
                  status: 'succeeded',
                  planId: sub.planId,
                  description: stripeObj.description || `QuickLink ${sub.planId.toUpperCase()} subscription renewal`,
                  receiptUrl,
                  periodStart: sub.currentPeriodStart,
                  periodEnd: sub.currentPeriodEnd,
                });

                emailService.sendPaymentReceiptEmail(user, payment).catch(err => {
                  console.error(`Payment receipt email background dispatch failed: ${err.message}`);
                });

                await Notification.create({
                  userId: user._id,
                  type: 'welcome',
                  title: 'Payment Confirmed ✅',
                  message: `Thank you! Your payment of ${(stripeObj.amount_paid / 100).toFixed(2)} ${stripeObj.currency.toUpperCase()} was successful.`,
                });
              }
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const paymentIntentId = stripeObj.payment_intent || `failed_${Date.now()}`;
        const subscriptionId = stripeObj.subscription;
        const sub = await Subscription.findOne({ stripeSubscriptionId: subscriptionId });

        if (sub) {
          const user = await User.findById(sub.userId);
          if (user) {
            sub.status = 'past_due';
            await sub.save();

            const payment = await PaymentHistory.create({
              userId: user._id,
              stripePaymentIntentId: paymentIntentId,
              stripeInvoiceId: stripeObj.id,
              amount: stripeObj.amount_due,
              currency: stripeObj.currency,
              status: 'failed',
              planId: sub.planId,
              description: `Failed charge for subscription renewal`,
            });

            emailService.sendPaymentFailedEmail(user, payment).catch(err => {
              console.error(`Payment failed email background dispatch failed: ${err.message}`);
            });

            await Notification.create({
              userId: user._id,
              type: 'welcome',
              title: '⚠️ Renewal Payment Failed',
              message: 'Stripe could not charge your credit card. Please update details in your Billing section to maintain premium features.',
            });
          }
        }
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const stripeSubscriptionId = stripeObj.id;
        const sub = await Subscription.findOne({ stripeSubscriptionId });
        if (sub) {
          const user = await User.findById(sub.userId);
          if (user) {
            emailService.sendTrialEndingEmail(user, 3).catch(err => {
              console.error(`Trial ending email background dispatch failed: ${err.message}`);
            });

            await Notification.create({
              userId: user._id,
              type: 'welcome',
              title: 'Free Trial Ending Soon ⏰',
              message: 'Your 14-day free trial will end in 3 days. Your card will be charged automatically.',
            });
          }
        }
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error(`Webhook processing exception: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
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
};
