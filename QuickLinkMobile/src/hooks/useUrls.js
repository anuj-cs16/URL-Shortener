/**
 * @file useUrls.js
 * @description Hook for URL CRUD operations with loading/error state management.
 */

import { useState, useCallback } from 'react';
import * as urlApi from '../api/urlApi';
import { showSuccess, showError } from '../utils/helpers';

const useUrls = () => {
  const [urls, setUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchUrls = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await urlApi.getAllUrls();
      if (response.success) {
        setUrls(response.data?.urls || response.data || []);
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load URLs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const createUrl = useCallback(async (longUrl, customCode = null) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await urlApi.createShortUrl(longUrl, customCode);
      if (response.success) {
        showSuccess('URL Shortened! 🔗');
        // Prepend new URL to list
        setUrls((prev) => [response.data, ...prev]);
        return { success: true, data: response.data };
      }
      return { success: false, message: response.message };
    } catch (err) {
      const message = err.response?.data?.message || err.userMessage || 'Failed to shorten URL';
      showError('Error', message);
      return { success: false, message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteUrlByCode = useCallback(async (shortCode) => {
    try {
      const response = await urlApi.deleteUrl(shortCode);
      if (response.success) {
        setUrls((prev) => prev.filter((url) => url.shortCode !== shortCode));
        showSuccess('URL deleted');
        return { success: true };
      }
      return { success: false };
    } catch (err) {
      showError('Error', err.userMessage || 'Failed to delete URL');
      return { success: false };
    }
  }, []);

  const getStats = useCallback(async (shortCode) => {
    try {
      const response = await urlApi.getUrlStats(shortCode);
      if (response.success) {
        return { success: true, data: response.data };
      }
      return { success: false };
    } catch (err) {
      return { success: false, message: err.userMessage };
    }
  }, []);

  return {
    urls,
    isLoading,
    isRefreshing,
    error,
    fetchUrls,
    createUrl,
    deleteUrlByCode,
    getStats,
  };
};

export default useUrls;
