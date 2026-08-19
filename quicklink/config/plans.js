/**
 * @file       plans.js
 * @description Configuration defining Free, Pro, and Business subscription plan characteristics and limits.
 * @module     config/plans
 */

'use strict';

const PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    currency: 'usd',
    interval: null,
    stripePriceId: null,
    color: '#A0A0B0',
    icon: '🆓',
    popular: false,
    limits: {
      urlsPerMonth: 10,
      clicksPerMonth: 1000,
      customCodes: false,
      analyticsRetentionDays: 7,
      qrCodes: true,
      apiAccess: false,
      customDomain: false,
      bulkShortening: false,
      teamMembers: 1,
      urlExpiry: 7,
      passwordProtectedUrls: false,
      exportData: false,
      prioritySupport: false,
      whiteLabel: false,
    },
    features: [
      '10 short URLs per month',
      '1,000 clicks per month',
      'Basic click analytics',
      'QR code generation',
      '7 day link expiry',
      '7 day analytics history',
    ],
    notIncluded: [
      'Custom short codes',
      'Custom domain',
      'API access',
      'Bulk URL shortening',
      'Export data',
      'Priority support',
    ],
  },

  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 9,
    currency: 'usd',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_default',
    color: '#6C63FF',
    icon: '⚡',
    popular: true,
    limits: {
      urlsPerMonth: 500,
      clicksPerMonth: 50000,
      customCodes: true,
      analyticsRetentionDays: 90,
      qrCodes: true,
      apiAccess: true,
      customDomain: false,
      bulkShortening: true,
      teamMembers: 1,
      urlExpiry: 365,
      passwordProtectedUrls: true,
      exportData: true,
      prioritySupport: false,
      whiteLabel: false,
    },
    features: [
      '500 short URLs per month',
      '50,000 clicks per month',
      'Custom short codes',
      'Advanced analytics (90 days)',
      'API access',
      'Bulk URL shortening',
      'Password protected URLs',
      'Export data (CSV)',
      '1 year link expiry',
      'QR code generation',
    ],
    notIncluded: [
      'Custom domain',
      'Team members',
      'White label',
      'Priority support',
    ],
  },

  BUSINESS: {
    id: 'business',
    name: 'Business',
    price: 29,
    currency: 'usd',
    interval: 'month',
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business_default',
    color: '#3ECFCF',
    icon: '🚀',
    popular: false,
    limits: {
      urlsPerMonth: -1,
      clicksPerMonth: -1,
      customCodes: true,
      analyticsRetentionDays: 365,
      qrCodes: true,
      apiAccess: true,
      customDomain: true,
      bulkShortening: true,
      teamMembers: 10,
      urlExpiry: -1,
      passwordProtectedUrls: true,
      exportData: true,
      prioritySupport: true,
      whiteLabel: true,
    },
    features: [
      'Unlimited short URLs',
      'Unlimited clicks',
      'Custom short codes',
      'Full analytics (1 year)',
      'Custom domain support',
      'API access',
      'Bulk URL shortening',
      'Team members (up to 10)',
      'Password protected URLs',
      'Export data (CSV & JSON)',
      'Never expiring links',
      'White label solution',
      'Priority support',
    ],
    notIncluded: [],
  },
};

const PLAN_IDS = {
  FREE: 'free',
  PRO: 'pro',
  BUSINESS: 'business',
};

/**
 * Resolves a plan by its ID, fallback to FREE if invalid.
 * @param {string} planId
 * @returns {Object}
 */
function getPlanById(planId) {
  if (!planId) return PLANS.FREE;
  return Object.values(PLANS).find((p) => p.id === planId.toLowerCase()) || PLANS.FREE;
}

/**
 * Returns the usage limits config for a plan.
 * @param {string} planId
 * @returns {Object}
 */
function getPlanLimits(planId) {
  return getPlanById(planId).limits;
}

/**
 * Checks if a specific feature gate is enabled on the user plan.
 * @param {string} planId
 * @param {string} feature
 * @returns {boolean}
 */
function isFeatureAvailable(planId, feature) {
  const limits = getPlanLimits(planId);
  return limits[feature] === true || limits[feature] === -1 || (typeof limits[feature] === 'number' && limits[feature] > 0);
}

module.exports = {
  PLANS,
  PLAN_IDS,
  getPlanById,
  getPlanLimits,
  isFeatureAvailable,
};
