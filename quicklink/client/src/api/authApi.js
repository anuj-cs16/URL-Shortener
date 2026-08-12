/**
 * @file       authApi.js
 * @description API module for user session registration, logins, profile updates, and logout.
 * @module     api/authApi
 * @requires   api/axiosConfig
 * @created    2026-08-12
 */

import axiosInstance from './axiosConfig';

/**
 * Registers a new user account.
 * @param {string} name - Name of the user.
 * @param {string} email - Email address.
 * @param {string} password - Raw password.
 * @returns {Promise<Object>} Created user details and session token.
 */
export const register = async (name, email, password) => {
  const response = await axiosInstance.post('/api/auth/register', { name, email, password });
  return response.data;
};

/**
 * Logs in a user with email and password.
 * @param {string} email - Email address.
 * @param {string} password - Raw password.
 * @returns {Promise<Object>} Authenticated user profile and session token.
 */
export const login = async (email, password) => {
  const response = await axiosInstance.post('/api/auth/login', { email, password });
  return response.data;
};

/**
 * Logs out the user session and invalidates token cookie.
 * @returns {Promise<Object>} Success message payload.
 */
export const logout = async () => {
  const response = await axiosInstance.post('/api/auth/logout');
  return response.data;
};

/**
 * Retrieves the current session user profile data.
 * @returns {Promise<Object>} Current authenticated user document.
 */
export const getMe = async () => {
  const response = await axiosInstance.get('/api/auth/me');
  return response.data;
};

/**
 * Updates profile properties (name, email) for current user.
 * @param {string} name - User's display name.
 * @param {string} email - User's email.
 * @returns {Promise<Object>} Updated user profile data.
 */
export const updateProfile = async (name, email) => {
  const response = await axiosInstance.put('/api/auth/profile', { name, email });
  return response.data;
};

/**
 * Changes user credentials/password.
 * @param {string} currentPassword - Current user password.
 * @param {string} newPassword - New password.
 * @returns {Promise<Object>} Success confirmation details.
 */
export const changePassword = async (currentPassword, newPassword) => {
  const response = await axiosInstance.put('/api/auth/password', { currentPassword, newPassword });
  return response.data;
};
