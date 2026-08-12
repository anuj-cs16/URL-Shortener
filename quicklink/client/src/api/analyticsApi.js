/**
 * @file       analyticsApi.js
 * @description API module for retrieving aggregated URL clicks analytics.
 * @module     api/analyticsApi
 * @requires   api/axiosConfig
 * @created    2026-08-12
 */

import axiosInstance from './axiosConfig';

/**
 * Retrieves high level numbers (total links, clicks, active, monthly counts) for dashboard cards.
 * @returns {Promise<Object>} Dashboard overview stats.
 */
export const getDashboardStats = async () => {
  const response = await axiosInstance.get('/api/analytics/dashboard');
  return response.data;
};

/**
 * Retrieves daily click frequency arrays over a duration (e.g. 7 or 30 days).
 * @param {number} [days=7] - Number of past days to query.
 * @returns {Promise<Object>} Time series frequency charts data.
 */
export const getClicksOverTime = async (days = 7) => {
  const response = await axiosInstance.get(`/api/analytics/clicks-over-time?days=${days}`);
  return response.data;
};

/**
 * Retrieves user device type breakdown (mobile, desktop, tablet, unknown) counts.
 * @returns {Promise<Object>} Device analytics charts data.
 */
export const getDeviceStats = async () => {
  const response = await axiosInstance.get('/api/analytics/devices');
  return response.data;
};

/**
 * Retrieves user web browser breakdown counts.
 * @returns {Promise<Object>} Browser analytics charts data.
 */
export const getBrowserStats = async () => {
  const response = await axiosInstance.get('/api/analytics/browsers');
  return response.data;
};

/**
 * Retrieves user country geolocations breakdown counts.
 * @returns {Promise<Object>} Geographic location charts data.
 */
export const getCountryStats = async () => {
  const response = await axiosInstance.get('/api/analytics/countries');
  return response.data;
};

/**
 * Retrieves detailed analytics and recent clicks list for a specific shortened code.
 * @param {string} shortCode - The short code identifier.
 * @returns {Promise<Object>} Individual link click analytics log.
 */
export const getUrlAnalytics = async (shortCode) => {
  const response = await axiosInstance.get(`/api/analytics/url/${shortCode}`);
  return response.data;
};

/**
 * Retrieves the user's top performing URLs sorted by click volume.
 * @param {number} [limit=5] - Maximum URLs to return.
 * @returns {Promise<Object>} Popular URLs summary.
 */
export const getTopUrls = async (limit = 5) => {
  const response = await axiosInstance.get(`/api/analytics/top-urls?limit=${limit}`);
  return response.data;
};

/**
 * Retrieves HTTP referrers/traffic sources statistics.
 * @returns {Promise<Object>} Referrers analytic chart data.
 */
export const getReferrerStats = async () => {
  const response = await axiosInstance.get('/api/analytics/referrers');
  return response.data;
};
