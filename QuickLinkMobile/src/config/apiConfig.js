/**
 * @file apiConfig.js
 * @description API connection configuration — base URLs, timeouts, and retry policy.
 */

import { Platform } from 'react-native';

const API_CONFIG = {
  // Development URLs (localhost behaves differently on iOS simulator vs Android emulator)
  BASE_URL: __DEV__
    ? Platform.OS === 'android'
      ? 'http://10.0.2.2:8080'   // Android emulator localhost alias
      : 'http://localhost:8080'   // iOS simulator
    : 'https://quicklink-app.run.app', // TODO: Replace with your Cloud Run URL

  // Explicit iOS URL for the client.js platform-specific selector
  BASE_URL_IOS: __DEV__
    ? 'http://localhost:8080'
    : 'https://quicklink-app.run.app',

  // Request timeout in milliseconds
  TIMEOUT: 15000,

  // Retry configuration for failed requests
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // Base delay in ms (exponential backoff multiplied per attempt)
};

export default API_CONFIG;
