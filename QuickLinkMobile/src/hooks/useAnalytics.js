/**
 * @file useAnalytics.js
 * @description Hook for analytics data fetching with date range support.
 */

import { useState, useCallback } from 'react';
import * as analyticsApi from '../api/analyticsApi';

const useAnalytics = () => {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [clicksData, setClicksData] = useState(null);
  const [deviceStats, setDeviceStats] = useState(null);
  const [browserStats, setBrowserStats] = useState(null);
  const [countryStats, setCountryStats] = useState(null);
  const [topUrls, setTopUrls] = useState([]);
  const [urlAnalytics, setUrlAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsApi.getDashboardStats();
      if (response.success) {
        setDashboardStats(response.data);
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load dashboard');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchClicksOverTime = useCallback(async (days = 7) => {
    try {
      const response = await analyticsApi.getClicksOverTime(days);
      if (response.success) {
        setClicksData(response.data);
      }
    } catch (err) {
      // Silently fail — chart just won't render
    }
  }, []);

  const fetchDeviceStats = useCallback(async () => {
    try {
      const response = await analyticsApi.getDeviceStats();
      if (response.success) {
        setDeviceStats(response.data);
      }
    } catch (err) {
      // Silently fail
    }
  }, []);

  const fetchBrowserStats = useCallback(async () => {
    try {
      const response = await analyticsApi.getBrowserStats();
      if (response.success) {
        setBrowserStats(response.data);
      }
    } catch (err) {
      // Silently fail
    }
  }, []);

  const fetchCountryStats = useCallback(async () => {
    try {
      const response = await analyticsApi.getCountryStats();
      if (response.success) {
        setCountryStats(response.data);
      }
    } catch (err) {
      // Silently fail
    }
  }, []);

  const fetchTopUrls = useCallback(async (limit = 5) => {
    try {
      const response = await analyticsApi.getTopUrls(limit);
      if (response.success) {
        setTopUrls(response.data || []);
      }
    } catch (err) {
      // Silently fail
    }
  }, []);

  const fetchUrlAnalytics = useCallback(async (shortCode) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsApi.getUrlAnalytics(shortCode);
      if (response.success) {
        setUrlAnalytics(response.data);
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAllAnalytics = useCallback(async (days = 7) => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([
        fetchDashboard(),
        fetchClicksOverTime(days),
        fetchDeviceStats(),
        fetchBrowserStats(),
        fetchCountryStats(),
        fetchTopUrls(),
      ]);
    } catch (err) {
      setError(err.userMessage || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  }, [fetchDashboard, fetchClicksOverTime, fetchDeviceStats, fetchBrowserStats, fetchCountryStats, fetchTopUrls]);

  return {
    dashboardStats,
    clicksData,
    deviceStats,
    browserStats,
    countryStats,
    topUrls,
    urlAnalytics,
    isLoading,
    error,
    fetchDashboard,
    fetchClicksOverTime,
    fetchDeviceStats,
    fetchBrowserStats,
    fetchCountryStats,
    fetchTopUrls,
    fetchUrlAnalytics,
    fetchAllAnalytics,
  };
};

export default useAnalytics;
