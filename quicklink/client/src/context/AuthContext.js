/**
 * @file       AuthContext.js
 * @description Authentication context provider. Manages active user details,
 *              session retrieval on boot, and login/register state changes.
 * @module     context/AuthContext
 * @requires   react
 * @requires   api/authApi
 * @created    2026-08-12
 */

import React, { createContext, useState, useEffect, useContext } from 'react';
import * as authApi from '../api/authApi';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on application boot
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const response = await authApi.getMe();
        if (response.success && response.data?.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        // Safe rejection if cookie not set or invalid
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    restoreSession();
  }, []);

  const loginUser = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(email, password);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        return response;
      }
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (name, email, password) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(name, email, password);
      if (response.success && response.data?.user) {
        setUser(response.data.user);
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
        }
        return response;
      }
      throw new Error(response.message || 'Registration failed');
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutUser = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (e) {
      // Clean up local session regardless of server state
    } finally {
      setUser(null);
      localStorage.removeItem('token');
      document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      setIsLoading(false);
    }
  };

  const updateUser = (userData) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      return { ...prevUser, ...userData };
    });
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginUser,
    registerUser,
    logoutUser,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
