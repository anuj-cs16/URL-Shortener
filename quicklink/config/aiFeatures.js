/**
 * @file       aiFeatures.js
 * @description Defines AI capabilities, feature gates, and usage limits by subscription plan tier.
 * @module     config/aiFeatures
 */

'use strict';

const AI_TIERS = {
  FREE: {
    safetyScan: true,
    smartAliasLimitPerMonth: 0,
    autoTagging: false,
    clickPrediction: false,
    aiCopilot: false,
    smartUtmBuilder: false,
    sentimentAnalysis: false,
    competitorLinkAnalysis: false,
  },
  PRO: {
    safetyScan: true,
    smartAliasLimitPerMonth: 100,
    autoTagging: true,
    clickPrediction: true,
    aiCopilot: false,
    smartUtmBuilder: true,
    sentimentAnalysis: false,
    competitorLinkAnalysis: false,
  },
  BUSINESS: {
    safetyScan: true,
    smartAliasLimitPerMonth: -1, // unlimited
    autoTagging: true,
    clickPrediction: true,
    aiCopilot: true,
    smartUtmBuilder: true,
    sentimentAnalysis: true,
    competitorLinkAnalysis: true,
  },
};

/**
 * Gets AI tier feature matrix for a plan ID.
 * @param {string} planId
 * @returns {Object}
 */
function getAiTierConfig(planId) {
  const normalized = (planId || 'free').toUpperCase();
  return AI_TIERS[normalized] || AI_TIERS.FREE;
}

/**
 * Checks if a specific AI feature is allowed for a user plan.
 * @param {string} planId
 * @param {string} featureName
 * @returns {boolean}
 */
function canAccessAiFeature(planId, featureName) {
  const config = getAiTierConfig(planId);
  const val = config[featureName];
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val !== 0;
  return false;
}

module.exports = {
  AI_TIERS,
  getAiTierConfig,
  canAccessAiFeature,
};
