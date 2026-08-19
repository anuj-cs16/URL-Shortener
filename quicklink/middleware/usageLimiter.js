/**
 * @file       usageLimiter.js
 * @description Middleware functions to verify user limits (URL limits, custom codes, bulk shortening, API access)
 *              against active subscription plans.
 * @module     middleware/usageLimiter
 */

'use strict';

const Subscription = require('../models/Subscription');
const UsageRecord = require('../models/UsageRecord');
const Url = require('../models/Url');
const { getPlanLimits, isFeatureAvailable } = require('../config/plans');
const { getCache, setCache } = require('../utils/cache');
const { getClientIP } = require('../utils/analyticsHelper');

/**
 * Resolves or creates the current month's usage record for a user.
 * @param {string} userId
 * @returns {Promise<Object>} Usage record instance.
 */
const getCurrentUsage = async (userId) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  let record = await UsageRecord.findOne({ userId, month, year });
  if (!record) {
    // Calculate reset date as first day of next month
    const nextMonth = new Date(year, now.getMonth() + 1, 1);
    try {
      record = await UsageRecord.create({
        userId,
        month,
        year,
        resetDate: nextMonth,
      });
    } catch (e) {
      // Handle race condition on parallel requests creating the same record
      record = await UsageRecord.findOne({ userId, month, year });
    }
  }
  return record;
};

/**
 * Returns the usage limits corresponding to a user's subscription.
 * @param {string} userId
 * @returns {Promise<Object>} limits object.
 */
const getPlanLimitsForUser = async (userId) => {
  const sub = await Subscription.findOne({ userId });
  const planId = sub ? sub.planId : 'free';
  return getPlanLimits(planId);
};

/**
 * Middleware: Checks monthly URL shortening count limits.
 * Applied to URL creation.
 */
const checkUrlLimit = async (req, res, next) => {
  try {
    if (!req.user) {
      // Guest users: limit to 5 creations per hour per IP
      const ip = getClientIP(req);
      const cacheKey = `guest_url_limit_${ip}`;
      const cachedCount = getCache(cacheKey) || 0;

      if (cachedCount >= 5) {
        return res.status(429).json({
          success: false,
          message: 'Guest URL creation limit reached. Please register or wait an hour.',
          limit: 5,
          used: cachedCount,
        });
      }

      setCache(cacheKey, cachedCount + 1, 3600); // 1 hour TTL
      return next();
    }

    // Logged in users
    const limits = await getPlanLimitsForUser(req.user._id);
    if (limits.urlsPerMonth === -1) {
      return next(); // Unlimited
    }

    const usage = await getCurrentUsage(req.user._id);
    if (usage.urlsCreated >= limits.urlsPerMonth) {
      return res.status(403).json({
        success: false,
        message: 'Monthly URL limit reached',
        limit: limits.urlsPerMonth,
        used: usage.urlsCreated,
        resetDate: usage.resetDate,
        upgradeUrl: '/pricing',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Verifies if custom codes are allowed on user plan.
 */
const checkCustomCodeAllowed = async (req, res, next) => {
  try {
    const { customCode } = req.body;
    if (!customCode) {
      return next();
    }

    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'Custom codes require a Pro or Business account. Please register.',
        feature: 'customCodes',
        requiredPlan: 'pro',
        upgradeUrl: '/pricing',
      });
    }

    const sub = await Subscription.findOne({ userId: req.user._id });
    const planId = sub ? sub.planId : 'free';

    if (!isFeatureAvailable(planId, 'customCodes')) {
      return res.status(403).json({
        success: false,
        message: 'Custom codes require Pro plan',
        feature: 'customCodes',
        requiredPlan: 'pro',
        upgradeUrl: '/pricing',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Gates API Access endpoints.
 */
const checkApiAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'API access requires Pro plan',
        feature: 'apiAccess',
        requiredPlan: 'pro',
        upgradeUrl: '/pricing',
      });
    }

    const sub = await Subscription.findOne({ userId: req.user._id });
    const planId = sub ? sub.planId : 'free';

    if (!isFeatureAvailable(planId, 'apiAccess')) {
      return res.status(403).json({
        success: false,
        message: 'API access requires Pro plan',
        feature: 'apiAccess',
        requiredPlan: 'pro',
        upgradeUrl: '/pricing',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Gates Bulk URL shortening.
 */
const checkBulkAccess = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(403).json({
        success: false,
        message: 'Bulk URL shortening requires Pro plan',
        feature: 'bulkShortening',
        requiredPlan: 'pro',
        upgradeUrl: '/pricing',
      });
    }

    const sub = await Subscription.findOne({ userId: req.user._id });
    const planId = sub ? sub.planId : 'free';

    if (!isFeatureAvailable(planId, 'bulkShortening')) {
      return res.status(403).json({
        success: false,
        message: 'Bulk URL shortening requires Pro plan',
        feature: 'bulkShortening',
        requiredPlan: 'pro',
        upgradeUrl: '/pricing',
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Increments URLs created counter for the user.
 * Applied after successful URL creation.
 */
const incrementUrlUsage = async (req, res, next) => {
  try {
    if (req.user) {
      const usage = await getCurrentUsage(req.user._id);
      usage.urlsCreated += 1;
      await usage.save();
    }
    next();
  } catch (error) {
    console.error(`Failed to increment URL usage: ${error.message}`);
    next(); // Soft fail: proceed anyway
  }
};

/**
 * Helper: Increments click analytics usage logs for URL owner.
 * @param {string} userId - URL owner's Mongoose ID.
 */
const incrementClickUsage = async (userId) => {
  if (!userId) return;
  try {
    const usage = await getCurrentUsage(userId);
    usage.clicksReceived += 1;
    await usage.save();
  } catch (error) {
    console.error(`Failed to increment click usage: ${error.message}`);
  }
};

module.exports = {
  checkUrlLimit,
  checkCustomCodeAllowed,
  checkApiAccess,
  checkBulkAccess,
  incrementUrlUsage,
  incrementClickUsage,
  getCurrentUsage,
  getPlanLimitsForUser,
};
