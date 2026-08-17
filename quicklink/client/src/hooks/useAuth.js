/**
 * @file       useAuth.js
 * @description Custom hook wrapping the AuthContext to inject user details
 *              and trigger user feedback notifications (toasts).
 * @module     hooks/useAuth
 * @requires   context/AuthContext
 * @requires   react-hot-toast
 * @created    2026-08-12
 */

import { useAuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';

export const useAuth = () => {
  const {
    user,
    isLoading,
    isAuthenticated,
    loginUser,
    registerUser,
    logoutUser,
    updateUser,
  } = useAuthContext();

  const login = async (email, password) => {
    try {
      const result = await loginUser(email, password);
      toast.success(result.message || 'Logged in successfully! Welcome back.');
      return result;
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Login failed. Please check credentials.';
      toast.error(errMsg);
      throw error;
    }
  };

  const register = async (name, email, password) => {
    try {
      const result = await registerUser(name, email, password);
      toast.success(result.message || 'Account registered successfully! Welcome.');
      return result;
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Registration failed.';
      toast.error(errMsg);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      toast.success('Logged out successfully.');
    } catch (error) {
      toast.error('Logout failed.');
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
  };
};
