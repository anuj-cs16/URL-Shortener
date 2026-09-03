/**
 * @file AuthContext.js
 * @description Authentication context provider. Manages user state, login/register/logout,
 *              and automatic session restoration on app launch.
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as authApi from '../api/authApi';
import { saveToken, getToken, saveUser, getUser, clearAuth } from '../utils/storage';
import { showSuccess, showError } from '../utils/helpers';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Check existing auth session on app launch.
   */
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedToken = await getToken();

      if (storedToken) {
        // Try to validate token by fetching current user
        const response = await authApi.getMe();
        if (response.success && response.data) {
          const userData = response.data.user || response.data;
          setUser(userData);
          setToken(storedToken);
          setIsAuthenticated(true);
          await saveUser(userData);
        } else {
          // Token invalid — clear everything
          await clearAuth();
          setUser(null);
          setToken(null);
          setIsAuthenticated(false);
        }
      } else {
        // No stored token — try loading cached user for offline mode
        const cachedUser = await getUser();
        if (cachedUser) {
          setUser(cachedUser);
          // Don't set isAuthenticated since we can't verify
        }
      }
    } catch (error) {
      // Network error — try cached user for offline viewing
      const cachedUser = await getUser();
      if (cachedUser) {
        setUser(cachedUser);
      }
      // Don't clear auth on network error — could be offline
      if (!error.isOffline) {
        await clearAuth();
        setUser(null);
        setToken(null);
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /**
   * Login with email and password.
   */
  const login = async (email, password) => {
    try {
      const response = await authApi.login(email, password);

      if (response.success && response.data) {
        const { user: userData, token: authToken } = response.data;
        await saveToken(authToken);
        await saveUser(userData);
        setUser(userData);
        setToken(authToken);
        setIsAuthenticated(true);
        showSuccess('Welcome back!', `Hello, ${userData.name} 👋`);
        return { success: true };
      }

      return { success: false, message: response.message || 'Login failed' };
    } catch (error) {
      const message =
        error.response?.data?.message || error.userMessage || 'Login failed. Please try again.';
      showError('Login Failed', message);
      return { success: false, message };
    }
  };

  /**
   * Register a new account.
   */
  const register = async (name, email, password) => {
    try {
      const response = await authApi.register(name, email, password);

      if (response.success && response.data) {
        const { user: userData, token: authToken } = response.data;
        await saveToken(authToken);
        await saveUser(userData);
        setUser(userData);
        setToken(authToken);
        setIsAuthenticated(true);
        showSuccess('Welcome to QuickLink! 🎉', `Account created for ${userData.name}`);
        return { success: true };
      }

      return { success: false, message: response.message || 'Registration failed' };
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.userMessage ||
        'Registration failed. Please try again.';
      showError('Registration Failed', message);
      return { success: false, message };
    }
  };

  /**
   * Logout current user.
   */
  const logout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      // Ignore API errors on logout — clear local state regardless
    } finally {
      await clearAuth();
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Refresh user data from server.
   */
  const refreshUser = async () => {
    try {
      const response = await authApi.getMe();
      if (response.success && response.data) {
        const userData = response.data.user || response.data;
        setUser(userData);
        await saveUser(userData);
      }
    } catch (error) {
      // Silently fail — user data will be stale but functional
    }
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
