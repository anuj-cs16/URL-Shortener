/**
 * @file       GuestRoute.jsx
 * @description Guard component to block authenticated users from viewing guest auth
 *              pages (login/register) and redirects to dashboard.
 * @module     components/common/GuestRoute
 * @requires   hooks/useAuth
 * @requires   react-router-dom
 * @created    2026-08-12
 */

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

const GuestRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner fullPage size="lg" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default GuestRoute;
