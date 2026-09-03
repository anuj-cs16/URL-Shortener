/**
 * @file client.js
 * @description Configured Axios instance with JWT interceptors, error handling, and device headers.
 */

import axios from 'axios';
import { Platform } from 'react-native';
import API_CONFIG from '../config/apiConfig';
import { getToken, clearAuth } from '../utils/storage';
import { APP_VERSION } from '../config/constants';

// Pick the right base URL based on platform
const baseURL = Platform.OS === 'ios' ? API_CONFIG.BASE_URL_IOS : API_CONFIG.BASE_URL;

const apiClient = axios.create({
  baseURL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Navigation reference for programmatic navigation from outside React tree
let navigationRef = null;
export const setNavigationRef = (ref) => {
  navigationRef = ref;
};

/**
 * Request interceptor — attaches JWT token and device headers to every request.
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // Token retrieval failed — proceed without auth
    }

    // Add device info headers
    config.headers['X-Device-Type'] = 'mobile';
    config.headers['X-Device-OS'] = Platform.OS;
    config.headers['X-Device-Version'] = Platform.Version?.toString();
    config.headers['X-App-Version'] = APP_VERSION;

    return config;
  },
  (error) => Promise.reject(error),
);

/**
 * Response interceptor — handles common error codes globally.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (!response) {
      // Network error — no response received
      error.userMessage = 'No internet connection. Please check your network.';
      error.isOffline = true;
      return Promise.reject(error);
    }

    switch (response.status) {
      case 401:
        // Session expired — clear auth and navigate to login
        await clearAuth();
        if (navigationRef?.current) {
          navigationRef.current.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        }
        error.userMessage = 'Session expired. Please log in again.';
        break;

      case 429:
        error.userMessage = 'Too many requests. Please wait a moment.';
        break;

      case 403:
        error.userMessage = 'You do not have permission for this action.';
        break;

      case 404:
        error.userMessage = 'The requested resource was not found.';
        break;

      case 500:
        error.userMessage = 'Server error. Please try again later.';
        break;

      default:
        error.userMessage =
          response.data?.message || 'Something went wrong. Please try again.';
    }

    return Promise.reject(error);
  },
);

/**
 * Retry wrapper for API calls with exponential backoff.
 */
export const apiWithRetry = async (apiCall, maxRetries = API_CONFIG.RETRY_ATTEMPTS) => {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      if (error.response?.status < 500 && error.response?.status !== 429) {
        throw error; // Don't retry client errors
      }
      if (attempt < maxRetries) {
        const delay = API_CONFIG.RETRY_DELAY * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  throw lastError;
};

export default apiClient;
