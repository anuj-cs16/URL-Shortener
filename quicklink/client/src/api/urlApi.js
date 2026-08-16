/**
 * @file       urlApi.js
 * @description API module for shortened URL CRUD transactions.
 * @module     api/urlApi
 * @requires   api/axiosConfig
 * @created    2026-08-12
 */

import axiosInstance from './axiosConfig';

/**
 * Shortens a long URL, with an optional custom short code alias.
 * @param {string} longUrl - Original target URL.
 * @param {string} [customCode] - Custom short code alias.
 * @returns {Promise<Object>} URL response object.
 */
export const createShortUrl = async (longUrl, customCode = '') => {
  const response = await axiosInstance.post('/api/shorten', {
    longUrl,
    customCode: customCode || undefined,
  });
  return response.data;
};

/**
 * Fetches all URL documents created by the user (or session).
 * @returns {Promise<Array>} List of URL documents.
 */
export const getAllUrls = async (codes = []) => {
  const params = codes.length > 0 ? { codes: codes.join(',') } : {};
  const response = await axiosInstance.get('/api/urls', { params });
  return response.data;
};

/**
 * Retrieves analytics and metadata stats for a specific short code.
 * @param {string} shortCode - The short code identifier.
 * @returns {Promise<Object>} URL stats document.
 */
export const getUrlStats = async (shortCode) => {
  const response = await axiosInstance.get(`/api/urls/${shortCode}`);
  return response.data;
};

/**
 * Deletes/deactivates a shortened URL by its short code.
 * @param {string} shortCode - Short code identifier.
 * @returns {Promise<Object>} Success message details.
 */
export const deleteUrl = async (shortCode) => {
  const response = await axiosInstance.delete(`/api/urls/${shortCode}`);
  return response.data;
};
