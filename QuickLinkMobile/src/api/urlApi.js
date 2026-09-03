/**
 * @file urlApi.js
 * @description URL shortening API calls — create, list, stats, delete, QR code.
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../config/constants';

export const createShortUrl = async (longUrl, customCode = null) => {
  const payload = { longUrl };
  if (customCode) {
    payload.customCode = customCode;
  }
  const response = await apiClient.post(API_ENDPOINTS.URLS.SHORTEN, payload);
  return response.data;
};

export const getAllUrls = async (page = 1, limit = 20) => {
  const response = await apiClient.get(API_ENDPOINTS.URLS.ALL, {
    params: { page, limit },
  });
  return response.data;
};

export const getUrlStats = async (shortCode) => {
  const response = await apiClient.get(
    `${API_ENDPOINTS.URLS.DETAIL}${shortCode}`,
  );
  return response.data;
};

export const getUrlQrCode = async (shortCode) => {
  const response = await apiClient.get(
    `${API_ENDPOINTS.URLS.QR}${shortCode}/qr`,
  );
  return response.data;
};

export const deleteUrl = async (shortCode) => {
  const response = await apiClient.delete(
    `${API_ENDPOINTS.URLS.DELETE}${shortCode}`,
  );
  return response.data;
};
