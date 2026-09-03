/**
 * @file useNotifications.js
 * @description Hook for notifications — fetch, mark read, unread count.
 */

import { useState, useCallback } from 'react';
import * as notificationApi from '../api/notificationApi';
import { showSuccess } from '../utils/helpers';

const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await notificationApi.getNotifications();
      if (response.success) {
        const notifs = response.data?.notifications || response.data || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      setError(err.userMessage || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      showSuccess('All notifications marked as read');
    } catch (err) {
      // Silently fail
    }
  }, []);

  const markOneRead = useCallback(async (notificationId) => {
    try {
      await notificationApi.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      // Silently fail
    }
  }, []);

  const removeNotification = useCallback(async (notificationId) => {
    try {
      await notificationApi.deleteNotification(notificationId);
      setNotifications((prev) => {
        const updated = prev.filter((n) => n._id !== notificationId);
        setUnreadCount(updated.filter((n) => !n.isRead).length);
        return updated;
      });
    } catch (err) {
      // Silently fail
    }
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    fetchNotifications,
    markAllRead,
    markOneRead,
    removeNotification,
  };
};

export default useNotifications;
