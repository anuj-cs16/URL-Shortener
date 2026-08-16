/**
 * @file       useUrls.js
 * @description Hook managing user url list state, link creations, and removals.
 * @module     hooks/useUrls
 * @requires   api/urlApi
 * @requires   react
 * @requires   react-hot-toast
 * @created    2026-08-12
 */

import { useState, useEffect, useCallback } from 'react';
import * as urlApi from '../api/urlApi';
import { toast } from 'react-hot-toast';


export const useUrls = () => {
  const [urls, setUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUrls = useCallback(async () => {
    const stored = localStorage.getItem('quicklink_codes');
    const codes = stored ? JSON.parse(stored) : [];

    if (codes.length === 0) {
      setUrls([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await urlApi.getAllUrls(codes);
      if (response.success) {
        setUrls(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch URLs');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Network error fetching URLs');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch URLs automatically on mount
  useEffect(() => {
    fetchUrls();
  }, [fetchUrls]);

  const shorten = async (longUrl, customCode = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await urlApi.createShortUrl(longUrl, customCode);
      if (response.success) {
        toast.success(response.message || 'Short URL created successfully!');
        
        // Store created short code in local storage
        const newUrl = response.data;
        const stored = localStorage.getItem('quicklink_codes');
        const codes = stored ? JSON.parse(stored) : [];
        if (!codes.includes(newUrl.shortCode)) {
          codes.push(newUrl.shortCode);
          localStorage.setItem('quicklink_codes', JSON.stringify(codes));
        }
        
        fetchUrls();
        return response.data;
      }
      throw new Error(response.message || 'Failed to shorten URL');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to shorten URL';
      toast.error(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async (shortCode) => {
    try {
      const response = await urlApi.deleteUrl(shortCode);
      if (response.success) {
        toast.success(response.message || 'Short URL deleted successfully.');
        
        // Remove code from local storage
        const stored = localStorage.getItem('quicklink_codes');
        const codes = stored ? JSON.parse(stored) : [];
        const updated = codes.filter(c => c !== shortCode);
        localStorage.setItem('quicklink_codes', JSON.stringify(updated));

        setUrls((prev) => prev.filter((u) => u.shortCode !== shortCode));
        return true;
      }
      throw new Error(response.message || 'Failed to delete URL');
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Failed to delete URL';
      toast.error(msg);
      return false;
    }
  };

  return {
    urls,
    isLoading,
    error,
    fetchUrls,
    shorten,
    remove,
  };
};
