/**
 * @file       axiosConfig.js
 * @description Central API client configuration using Axios.
 *              Injects base credentials, logging interceptors, and global 401 handling.
 * @module     api/axiosConfig
 * @requires   axios
 * @created    2026-08-12
 */

import axios from 'axios';

// baseURL points to dev proxy or custom backend domain
const baseURL = process.env.REACT_APP_API_URL || '';

const axiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Logs details in development mode
axiosInstance.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[API Request]: ${config.method.toUpperCase()} ${config.url}`, config.data || '');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Catches errors globally (such as 401 Session Expired)
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;

    if (process.env.NODE_ENV === 'development') {
      console.error(`[API Error]:`, error.message, response?.data || '');
    }

    if (response) {
      // If unauthorized, clear local session storage and redirect
      if (response.status === 401 && !window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        // Clear token cookie by expiring it
        document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        window.location.href = '/login?expired=true';
      }
    } else {
      // Network connection error
      console.error('Network Error: Please check your internet connection.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
