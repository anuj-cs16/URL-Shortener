/**
 * @file notificationApi.js
 * @description Notification API calls — list, mark read, delete.
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../config/constants';

export const getNotifications = async () => {
  const response = await apiClient.get(API_ENDPOINTS.NOTIFICATIONS.ALL);
  return response.data;
};

export const markAllAsRead = async () => {
  const response = await apiClient.put(API_ENDPOINTS.NOTIFICATIONS.READ_ALL);
  return response.data;
};

export const markAsRead = async (notificationId) => {
  const response = await apiClient.put(
    `${API_ENDPOINTS.NOTIFICATIONS.READ_ONE}${notificationId}/read`,
  );
  return response.data;
};

export const deleteNotification = async (notificationId) => {
  const response = await apiClient.delete(
    `${API_ENDPOINTS.NOTIFICATIONS.DELETE}${notificationId}`,
  );
  return response.data;
};

export const getEmailSettings = async () => {
  const response = await apiClient.get(
    API_ENDPOINTS.NOTIFICATIONS.EMAIL_SETTINGS,
  );
  return response.data;
};

export const updateEmailSettings = async (settings) => {
  const response = await apiClient.put(
    API_ENDPOINTS.NOTIFICATIONS.EMAIL_SETTINGS,
    settings,
  );
  return response.data;
};
