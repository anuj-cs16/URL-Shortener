/**
 * @file       domainApi.js
 * @description API functions for custom domain management endpoints.
 * @module     api/domainApi
 * @requires   api/axiosConfig
 */

import axiosInstance from './axiosConfig';

/**
 * Adds a new custom domain.
 * @param {string} domain - The domain to add.
 * @returns {Promise<Object>} API response.
 */
export const addDomain = async (domain) => {
  const response = await axiosInstance.post('/api/domains', { domain });
  return response.data;
};

/**
 * Gets all custom domains for the current user.
 * @returns {Promise<Object>} API response with domains array.
 */
export const getDomains = async () => {
  const response = await axiosInstance.get('/api/domains');
  return response.data;
};

/**
 * Verifies DNS ownership for a domain.
 * @param {string} domain - The domain to verify.
 * @returns {Promise<Object>} API response with verification result.
 */
export const verifyDomain = async (domain) => {
  const response = await axiosInstance.post(`/api/domains/${domain}/verify`);
  return response.data;
};

/**
 * Gets detailed status for a domain.
 * @param {string} domain - The domain to check.
 * @returns {Promise<Object>} API response with status details.
 */
export const getDomainStatus = async (domain) => {
  const response = await axiosInstance.get(`/api/domains/${domain}/status`);
  return response.data;
};

/**
 * Sets a domain as the default for new short URLs.
 * @param {string} domain - The domain to set as default.
 * @returns {Promise<Object>} API response.
 */
export const setDefaultDomain = async (domain) => {
  const response = await axiosInstance.put(`/api/domains/${domain}/default`);
  return response.data;
};

/**
 * Removes a custom domain.
 * @param {string} domain - The domain to remove.
 * @returns {Promise<Object>} API response.
 */
export const removeDomain = async (domain) => {
  const response = await axiosInstance.delete(`/api/domains/${domain}`);
  return response.data;
};

/**
 * Forces a DNS recheck on a domain.
 * @param {string} domain - The domain to recheck.
 * @returns {Promise<Object>} API response.
 */
export const recheckDns = async (domain) => {
  const response = await axiosInstance.post(`/api/domains/${domain}/recheck`);
  return response.data;
};

/**
 * Gets DNS setup guide for popular providers.
 * @returns {Promise<Object>} API response with provider guides.
 */
export const getSetupGuide = async () => {
  const response = await axiosInstance.get('/api/domains/setup-guide');
  return response.data;
};
