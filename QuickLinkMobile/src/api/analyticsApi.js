/**
 * @file analyticsApi.js
 * @description Analytics API calls — dashboard stats, charts, breakdowns, per-URL analytics.
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../config/constants';

export const getDashboardStats = async () => {
  const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.DASHBOARD);
  return response.data;
};

export const getClicksOverTime = async (days = 7) => {
  const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.CLICKS, {
    params: { days },
  });
  return response.data;
};

export const getDeviceStats = async () => {
  const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.DEVICES);
  return response.data;
};

export const getBrowserStats = async () => {
  const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.BROWSERS);
  return response.data;
};

export const getCountryStats = async () => {
  const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.COUNTRIES);
  return response.data;
};

export const getUrlAnalytics = async (shortCode) => {
  const response = await apiClient.get(
    `${API_ENDPOINTS.ANALYTICS.URL}${shortCode}`,
  );
  return response.data;
};

export const getTopUrls = async (limit = 5) => {
  const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.TOP_URLS, {
    params: { limit },
  });
  return response.data;
};

export const getReferrerStats = async () => {
  const response = await apiClient.get(API_ENDPOINTS.ANALYTICS.REFERRERS);
  return response.data;
};
