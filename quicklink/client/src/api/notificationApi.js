/**
 * @file       notificationApi.js
 * @description API module for user notification alerts and email subscription preferences.
 * @module     api/notificationApi
 * @requires   api/axiosConfig
 * @created    2026-08-12
 */

import axiosInstance from './axiosConfig';

/**
 * Fetches the user's notification alert logs (limit 50).
 * @returns {Promise<Object>} Notifications list and unread count.
 */
export const getNotifications = async () => {
  const response = await axiosInstance.get('/api/notifications');
  return response.data;
};

/**
 * Marks a specific notification as read.
 * @param {string} id - Notification database ID.
 * @returns {Promise<Object>} Updated notification details.
 */
export const markAsRead = async (id) => {
  const response = await axiosInstance.put(`/api/notifications/${id}/read`);
  return response.data;
};

/**
 * Marks all of the user's notifications as read.
 * @returns {Promise<Object>} Success details and modifications count.
 */
export const markAllAsRead = async () => {
  const response = await axiosInstance.put('/api/notifications/read-all');
  return response.data;
};

/**
 * Deletes a notification from history.
 * @param {string} id - Notification database ID.
 * @returns {Promise<Object>} Success confirmation details.
 */
export const deleteNotification = async (id) => {
  const response = await axiosInstance.delete(`/api/notifications/${id}`);
  return response.data;
};

/**
 * Retrieves the user's email subscription settings toggles.
 * @returns {Promise<Object>} Email settings preference document.
 */
export const getEmailSettings = async () => {
  const response = await axiosInstance.get('/api/notifications/email-settings');
  return response.data;
};

/**
 * Updates the user's email subscription toggles and preferred milestones list.
 * @param {Object} settings - Subscription preferences and settings switches.
 * @returns {Promise<Object>} Updated email settings pref document.
 */
export const updateEmailSettings = async (settings) => {
  const response = await axiosInstance.put('/api/notifications/email-settings', settings);
  return response.data;
};

/**
 * Dispatches a test welcome email to user's registered inbox.
 * @returns {Promise<Object>} Success message payload.
 */
export const sendTestEmail = async () => {
  const response = await axiosInstance.post('/api/notifications/test-email');
  return response.data;
};
