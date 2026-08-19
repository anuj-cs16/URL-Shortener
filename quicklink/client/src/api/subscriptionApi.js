/**
 * @file       subscriptionApi.js
 * @description API module wrapping subscription, billing, payments, and checkout endpoints.
 * @module     api/subscriptionApi
 * @requires   api/axiosConfig
 */

import axiosInstance from './axiosConfig';

/**
 * Retrieves the list of pricing plan tiers.
 * @returns {Promise<Object>}
 */
export const getPlans = async () => {
  const response = await axiosInstance.get('/api/subscription/plans');
  return response.data;
};

/**
 * Retrieves details on the user's active plan.
 * @returns {Promise<Object>}
 */
export const getCurrentSubscription = async () => {
  const response = await axiosInstance.get('/api/subscription/current');
  return response.data;
};

/**
 * Spawns a Stripe checkout session for plan upgrade.
 * @param {string} planId
 * @returns {Promise<Object>} Stripe checkout session URL data.
 */
export const createCheckoutSession = async (planId) => {
  const response = await axiosInstance.post('/api/subscription/checkout', { planId });
  return response.data;
};

/**
 * Spawns a billing portal session URL.
 * @returns {Promise<Object>} Stripe Customer Portal redirect URL.
 */
export const createPortalSession = async () => {
  const response = await axiosInstance.post('/api/subscription/portal');
  return response.data;
};

/**
 * Initiates plan cancellation.
 * @returns {Promise<Object>}
 */
export const cancelSubscription = async () => {
  const response = await axiosInstance.post('/api/subscription/cancel');
  return response.data;
};

/**
 * Reactivates a cancel-pending plan.
 * @returns {Promise<Object>}
 */
export const reactivateSubscription = async () => {
  const response = await axiosInstance.post('/api/subscription/reactivate');
  return response.data;
};

/**
 * Fetches user invoice payment records.
 * @returns {Promise<Object>}
 */
export const getPaymentHistory = async () => {
  const response = await axiosInstance.get('/api/subscription/payments');
  return response.data;
};

/**
 * Retrieves detailed monthly limit usage stats.
 * @returns {Promise<Object>}
 */
export const getUsageStats = async () => {
  const response = await axiosInstance.get('/api/subscription/usage');
  return response.data;
};

/**
 * Validates and applies a promotion code.
 * @param {string} promoCode
 * @returns {Promise<Object>}
 */
export const applyPromoCode = async (promoCode) => {
  const response = await axiosInstance.post('/api/subscription/promo', { promoCode });
  return response.data;
};
