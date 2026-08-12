/**
 * @file       useNotifications.js
 * @description Hook managing user in-app notification alerts, subscription
 *              settings switches, and automatic polling refreshes.
 * @module     hooks/useNotifications
 * @requires   api/notificationApi
 * @requires   react
 * @requires   react-hot-toast
 * @created    2026-08-12
 */

import { useState, useEffect, useCallback } from 'react';
import * as notificationApi from '../api/notificationApi';
import { toast } from 'react-hot-toast';
import { useAuthContext } from '../context/AuthContext';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [emailSettings, setEmailSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuthContext();

  const fetchNotifications = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const response = await notificationApi.getNotifications();
      if (response.success && response.data) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to load notifications history:', error);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  const fetchEmailSettings = useCallback(async () => {
    try {
      const response = await notificationApi.getEmailSettings();
      if (response.success && response.data) {
        setEmailSettings(response.data);
      }
    } catch (error) {
      console.error('Failed to load email preferences:', error);
    }
  }, []);

  // Poll for notifications every 60 seconds if logged in
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchEmailSettings();

      const interval = setInterval(() => {
        fetchNotifications(true); // silent update
      }, 60000);

      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setEmailSettings(null);
    }
  }, [isAuthenticated, fetchNotifications, fetchEmailSettings]);

  const markRead = async (id) => {
    try {
      const response = await notificationApi.markAsRead(id);
      if (response.success) {
        setNotifications((prev) =>
          prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        return true;
      }
      throw new Error(response.message || 'Failed to mark read');
    } catch (error) {
      toast.error('Failed to update notification status.');
      return false;
    }
  };

  const markAllRead = async () => {
    try {
      const response = await notificationApi.markAllAsRead();
      if (response.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
        toast.success('All notifications marked as read.');
        return true;
      }
      throw new Error(response.message || 'Failed to mark all read');
    } catch (error) {
      toast.error('Failed to mark all as read.');
      return false;
    }
  };

  const removeNotification = async (id) => {
    try {
      const response = await notificationApi.deleteNotification(id);
      if (response.success) {
        const target = notifications.find((n) => n._id === id);
        if (target && !target.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        toast.success('Notification cleared.');
        return true;
      }
      throw new Error(response.message || 'Failed to delete notification');
    } catch (error) {
      toast.error('Failed to clear notification.');
      return false;
    }
  };

  const saveEmailSettings = async (settings) => {
    setIsLoading(true);
    try {
      const response = await notificationApi.updateEmailSettings(settings);
      if (response.success && response.data) {
        setEmailSettings(response.data);
        toast.success(response.message || 'Email settings saved successfully.');
        return true;
      }
      throw new Error(response.message || 'Failed to save email settings');
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to save settings.';
      toast.error(errMsg);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestEmail = async () => {
    try {
      const response = await notificationApi.sendTestEmail();
      if (response.success) {
        toast.success(response.message || 'Test welcome email dispatched!');
        return true;
      }
      throw new Error(response.message || 'Failed to send test email');
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Test mail connection failed.';
      toast.error(errMsg);
      return false;
    }
  };

  return {
    notifications,
    unreadCount,
    emailSettings,
    isLoading,
    fetchNotifications,
    markRead,
    markAllRead,
    removeNotification,
    fetchEmailSettings,
    saveEmailSettings,
    sendTestEmail,
  };
};
