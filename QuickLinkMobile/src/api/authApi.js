/**
 * @file authApi.js
 * @description Authentication API calls — login, register, logout, profile, password.
 */

import apiClient from './client';
import { API_ENDPOINTS } from '../config/constants';

export const login = async (email, password) => {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
    email,
    password,
  });
  return response.data;
};

export const register = async (name, email, password) => {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.REGISTER, {
    name,
    email,
    password,
  });
  return response.data;
};

export const logout = async () => {
  const response = await apiClient.post(API_ENDPOINTS.AUTH.LOGOUT);
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get(API_ENDPOINTS.AUTH.ME);
  return response.data;
};

export const updateProfile = async (name, email) => {
  const response = await apiClient.put(API_ENDPOINTS.AUTH.PROFILE, {
    name,
    email,
  });
  return response.data;
};

export const changePassword = async (currentPassword, newPassword) => {
  const response = await apiClient.put(API_ENDPOINTS.AUTH.PASSWORD, {
    currentPassword,
    newPassword,
  });
  return response.data;
};
