/**
 * @file       useDomains.js
 * @description Custom hook for domain management with state, CRUD operations, and auto-polling.
 * @module     hooks/useDomains
 * @requires   react
 * @requires   api/domainApi
 * @requires   react-hot-toast
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import * as domainApi from '../api/domainApi';
import { toast } from 'react-hot-toast';

export const useDomains = (autoFetch = false) => {
  const [domains, setDomains] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [setupGuide, setSetupGuide] = useState(null);
  const pollRef = useRef(null);

  const fetchDomains = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await domainApi.getDomains();
      if (response.success && response.data) {
        setDomains(response.data.domains || []);
      }
    } catch (error) {
      // Silently fail for 403 (non-business users)
      if (error.response?.status !== 403) {
        console.error('Failed to fetch domains:', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addNewDomain = async (domain) => {
    setIsLoading(true);
    try {
      const response = await domainApi.addDomain(domain);
      if (response.success) {
        toast.success(response.message || 'Domain added! Please verify DNS.');
        await fetchDomains();
        return response.data;
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to add domain';
      toast.error(errMsg);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyExistingDomain = async (domain) => {
    setIsVerifying(true);
    try {
      const response = await domainApi.verifyDomain(domain);
      if (response.success) {
        toast.success(response.data?.message || 'DNS verified!');
        await fetchDomains();
        return response.data;
      } else {
        // Verification not yet successful — show info
        toast(response.data?.message || 'DNS not verified yet. Please wait.', {
          icon: '⏳',
        });
        return response.data;
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Verification failed';
      toast.error(errMsg);
      throw error;
    } finally {
      setIsVerifying(false);
    }
  };

  const checkDomainStatus = async (domain) => {
    try {
      const response = await domainApi.getDomainStatus(domain);
      if (response.success) {
        return response.data;
      }
    } catch (error) {
      console.error('Failed to check domain status:', error.message);
    }
    return null;
  };

  const setAsDefault = async (domain) => {
    setIsLoading(true);
    try {
      const response = await domainApi.setDefaultDomain(domain);
      if (response.success) {
        toast.success(response.message || 'Default domain updated');
        await fetchDomains();
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to set default domain';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDomain = async (domain) => {
    setIsLoading(true);
    try {
      const response = await domainApi.removeDomain(domain);
      if (response.success) {
        toast.success(response.message || 'Domain removed');
        await fetchDomains();
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to remove domain';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const recheckDomain = async (domain) => {
    setIsLoading(true);
    try {
      const response = await domainApi.recheckDns(domain);
      if (response.success) {
        toast.success(response.data?.message || 'DNS recheck complete');
        await fetchDomains();
        return response.data;
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'DNS recheck failed';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSetupGuide = async () => {
    try {
      const response = await domainApi.getSetupGuide();
      if (response.success) {
        setSetupGuide(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch setup guide:', error.message);
    }
  };

  // Auto-poll verification status every 30 seconds when domain is pending
  const startVerificationPolling = useCallback((domain) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status = await domainApi.getDomainStatus(domain);
        if (status.success && status.data) {
          if (status.data.status !== 'pending_verification' && status.data.status !== 'ssl_provisioning') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            await fetchDomains();
            if (status.data.status === 'active') {
              toast.success('Your domain is now active! 🎉');
            }
          }
        }
      } catch {
        // Silently continue polling
      }
    }, 30000);
  }, [fetchDomains]);

  const stopVerificationPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Auto-fetch on mount if requested
  useEffect(() => {
    if (autoFetch) {
      fetchDomains();
    }
  }, [autoFetch, fetchDomains]);

  // Get the active/default domain for URL creation
  const activeDomain = domains.find((d) => d.status === 'active');
  const defaultDomain = domains.find((d) => d.isDefault && d.status === 'active');

  return {
    domains,
    isLoading,
    isVerifying,
    setupGuide,
    activeDomain,
    defaultDomain,
    fetchDomains,
    addNewDomain,
    verifyExistingDomain,
    checkDomainStatus,
    setAsDefault,
    deleteDomain,
    recheckDomain,
    fetchSetupGuide,
    startVerificationPolling,
    stopVerificationPolling,
  };
};
