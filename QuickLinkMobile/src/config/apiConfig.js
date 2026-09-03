/**
 * @file apiConfig.js
 * @description API configuration for QuickLink mobile app.
 *              Switches between local dev server and Cloud Run production URL.
 */

const API_CONFIG = {
  // Toggle between local dev and production API
  BASE_URL: __DEV__
    ? 'http://10.0.2.2:8080'  // Android emulator → host machine localhost
    : 'https://quicklink-xxxx-uc.a.run.app', // Replace with your Cloud Run URL

  // iOS Simulator uses localhost directly
  BASE_URL_IOS: __DEV__
    ? 'http://localhost:8080'
    : 'https://quicklink-xxxx-uc.a.run.app',

  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

export default API_CONFIG;
