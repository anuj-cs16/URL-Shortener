/**
 * @file       useSecurity.js
 * @description Hook managing user-level multi-factor profiles, audit logs, and active session sweeps.
 * @module     hooks/useSecurity
 */

import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import * as securityApi from '../api/securityApi';

export const useSecurity = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [activities, setActivities] = useState([]);
  const [totalActivities, setTotalActivities] = useState(0);
  const [activityPages, setActivityPages] = useState(1);
  const [suspiciousCount, setSuspiciousCount] = useState(0);
  const [sessions, setSessions] = useState([]);

  // Fetch security overview details
  const fetchOverview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityApi.getSecurityOverview();
      if (res.success) {
        setOverview(res.data);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to load security overview';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch paginated login activities
  const fetchActivities = useCallback(async (page = 1, limit = 10, type = 'all') => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityApi.getLoginActivity(page, limit, type);
      if (res.success) {
        setActivities(res.data.activities);
        setTotalActivities(res.data.total);
        setActivityPages(res.data.pages);
        setSuspiciousCount(res.data.suspicious);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to load security logs';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch active sessions list
  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityApi.getActiveSessions();
      if (res.success) {
        setSessions(res.data);
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to load active sessions';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Setup 2FA configuration
  const setup2FA = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityApi.setup2FA();
      if (res.success) {
        return res.data;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to setup 2FA';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Enable 2FA with verified TOTP token
  const enable2FA = async (token, secret) => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityApi.enable2FA(token, secret);
      if (res.success) {
        toast.success(res.message || '2FA enabled successfully!');
        fetchOverview();
        return res.data;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to enable 2FA';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Disable 2FA
  const disable2FA = async (password, token) => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityApi.disable2FA(password, token);
      if (res.success) {
        toast.success(res.message || '2FA disabled successfully.');
        fetchOverview();
        return res;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to disable 2FA';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Regenerate backup codes
  const regenerateBackupCodes = async (token) => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityApi.regenerateBackupCodes(token);
      if (res.success) {
        toast.success(res.message || 'Backup codes regenerated.');
        return res.data;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to regenerate backup codes';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Report activity as suspicious
  const reportSuspicious = async (activityId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityApi.reportSuspiciousActivity(activityId);
      if (res.success) {
        toast.success(res.message || 'Activity reported as suspicious.');
        fetchActivities();
        fetchOverview();
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to report activity';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Terminate all sessions
  const terminateSessions = async (password) => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityApi.terminateAllSessions(password);
      if (res.success) {
        toast.success(res.message || 'All other sessions terminated.');
        fetchSessions();
        return res;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to terminate sessions';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Admin: block IP address
  const blockIp = async (ip, reason, duration) => {
    setLoading(true);
    setError(null);
    try {
      const res = await securityApi.blockIpAddress(ip, reason, duration);
      if (res.success) {
        toast.success(res.message || `IP ${ip} blocked.`);
        return res;
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to block IP';
      setError(errMsg);
      toast.error(errMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    overview,
    activities,
    totalActivities,
    activityPages,
    suspiciousCount,
    sessions,
    fetchOverview,
    fetchActivities,
    fetchSessions,
    setup2FA,
    enable2FA,
    disable2FA,
    regenerateBackupCodes,
    reportSuspicious,
    terminateSessions,
    blockIp,
  };
};
