/**
 * @file       useAnalytics.js
 * @description Hook managing user dashboard metrics, time series clicks,
 *              browsers, devices, geolocations, and traffic referrers.
 * @module     hooks/useAnalytics
 * @requires   api/analyticsApi
 * @requires   react
 * @created    2026-08-12
 */

import { useState, useEffect, useCallback } from 'react';
import * as analyticsApi from '../api/analyticsApi';


export const useAnalytics = () => {
  const [stats, setStats] = useState({ totalUrls: 0, totalClicks: 0, activeUrls: 0, urlsThisMonth: 0 });
  const [clicksData, setClicksData] = useState([]);
  const [deviceData, setDeviceData] = useState({});
  const [browserData, setBrowserData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [referrerData, setReferrerData] = useState([]);
  const [topUrls, setTopUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dateRange, setDateRange] = useState(7); // 7, 30, 90 days filter

  const fetchAllAnalytics = useCallback(async () => {
    const stored = localStorage.getItem('quicklink_codes');
    const codes = stored ? JSON.parse(stored) : [];

    if (codes.length === 0) {
      setStats({ totalUrls: 0, totalClicks: 0, activeUrls: 0, urlsThisMonth: 0 });
      setClicksData([]);
      setDeviceData({});
      setBrowserData([]);
      setCountryData([]);
      setReferrerData([]);
      setTopUrls([]);
      return;
    }

    setIsLoading(true);
    try {
      const [
        dashboardStatsRes,
        clicksOverTimeRes,
        deviceRes,
        browserRes,
        countryRes,
        referrerRes,
        topUrlsRes,
      ] = await Promise.all([
        analyticsApi.getDashboardStats(codes),
        analyticsApi.getClicksOverTime(dateRange, codes),
        analyticsApi.getDeviceStats(codes),
        analyticsApi.getBrowserStats(codes),
        analyticsApi.getCountryStats(codes),
        analyticsApi.getReferrerStats(codes),
        analyticsApi.getTopUrls(5, codes),
      ]);

      if (dashboardStatsRes.success) setStats(dashboardStatsRes.data || {});
      if (clicksOverTimeRes.success) setClicksData(clicksOverTimeRes.data || []);
      if (deviceRes.success) setDeviceData(deviceRes.data || {});
      if (browserRes.success) setBrowserData(browserRes.data || []);
      if (countryRes.success) setCountryData(countryRes.data || []);
      if (referrerRes.success) setReferrerData(referrerRes.data || []);
      if (topUrlsRes.success) setTopUrls(topUrlsRes.data || []);
    } catch (error) {
      console.error('Failed to load analytics datasets:', error);
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  // Load analytics when authentication state or date filters change
  useEffect(() => {
    fetchAllAnalytics();
  }, [fetchAllAnalytics]);

  const changeDateRange = (days) => {
    setDateRange(days);
  };

  const refreshData = () => {
    fetchAllAnalytics();
  };

  return {
    stats,
    clicksData,
    deviceData,
    browserData,
    countryData,
    referrerData,
    topUrls,
    isLoading,
    dateRange,
    changeDateRange,
    refreshData,
  };
};
