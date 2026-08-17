/**
 * @file       securityApi.js
 * @description API module for advanced security services (2FA, audit logs, active sessions, risk reports).
 * @module     api/securityApi
 * @requires   api/axiosConfig
 */

import axiosInstance from './axiosConfig';

/**
 * Initiates TOTP 2FA secret configuration.
 * @returns {Promise<Object>} Base32 secret and base64 QR code image payload.
 */
export const setup2FA = async () => {
  const response = await axiosInstance.post('/api/security/2fa/setup');
  return response.data;
};

/**
 * Enables Two-Factor authentication by verifying a TOTP token.
 * @param {string} token - 6-digit TOTP code.
 * @param {string} secret - Plain text base32 secret.
 * @returns {Promise<Object>} Backup codes array.
 */
export const enable2FA = async (token, secret) => {
  const response = await axiosInstance.post('/api/security/2fa/enable', { token, secret });
  return response.data;
};

/**
 * Disables Two-Factor authentication.
 * @param {string} password - User's current account password.
 * @param {string} token - 6-digit TOTP code.
 * @returns {Promise<Object>} Success response.
 */
export const disable2FA = async (password, token) => {
  const response = await axiosInstance.post('/api/security/2fa/disable', { password, token });
  return response.data;
};

/**
 * Verifies a 2FA TOTP code or backup code during the login flow.
 * @param {string} token - TOTP token or backup code.
 * @returns {Promise<Object>} Fully authenticated user profile and token.
 */
export const verify2FA = async (token) => {
  const response = await axiosInstance.post('/api/security/2fa/verify', { token });
  return response.data;
};

/**
 * Retrieves remaining backup codes metadata.
 * @param {string} password - Account password.
 * @returns {Promise<Object>} Count of remaining and used backup codes.
 */
export const getBackupCodes = async (password) => {
  const response = await axiosInstance.get(`/api/security/2fa/backup-codes?password=${encodeURIComponent(password)}`);
  return response.data;
};

/**
 * Regenerates the set of backup codes.
 * @param {string} token - Current 6-digit TOTP token.
 * @returns {Promise<Object>} New backup codes array.
 */
export const regenerateBackupCodes = async (token) => {
  const response = await axiosInstance.post('/api/security/2fa/backup-codes/regenerate', { token });
  return response.data;
};

/**
 * Retrieves paginated list of user login activities.
 * @param {number} page - Page number.
 * @param {number} limit - Records per page.
 * @param {string} type - Filter type ('all', 'login_success', 'login_failed', 'suspicious').
 * @returns {Promise<Object>} Paginated activity list.
 */
export const getLoginActivity = async (page = 1, limit = 20, type = 'all') => {
  const response = await axiosInstance.get(`/api/security/activity?page=${page}&limit=${limit}&type=${type}`);
  return response.data;
};

/**
 * Retrieves account security overview containing score and recommendations.
 * @returns {Promise<Object>} Security score, metrics, and recommendations.
 */
export const getSecurityOverview = async () => {
  const response = await axiosInstance.get('/api/security/overview');
  return response.data;
};

/**
 * Reports a specific login activity log as suspicious.
 * @param {string} activityId - Login activity document ID.
 * @returns {Promise<Object>} Success response.
 */
export const reportSuspiciousActivity = async (activityId) => {
  const response = await axiosInstance.post('/api/security/report', { activityId });
  return response.data;
};

/**
 * Retrieves a list of active login sessions.
 * @returns {Promise<Object>} Active sessions list.
 */
export const getActiveSessions = async () => {
  const response = await axiosInstance.get('/api/security/sessions');
  return response.data;
};

/**
 * Terminates all sessions (except the current one) by resetting the user token key.
 * @param {string} password - Current password.
 * @returns {Promise<Object>} Success response.
 */
export const terminateAllSessions = async (password) => {
  const response = await axiosInstance.post('/api/security/sessions/terminate-all', { password });
  return response.data;
};

/**
 * Admins endpoint to block/blacklist a specific IP address.
 * @param {string} ip - IP address to block.
 * @param {string} reason - Reason for blocking.
 * @param {number} [duration] - Expiry duration in minutes.
 * @returns {Promise<Object>} Success response.
 */
export const blockIpAddress = async (ip, reason, duration) => {
  const response = await axiosInstance.post('/api/security/block-ip', { ip, reason, duration });
  return response.data;
};
