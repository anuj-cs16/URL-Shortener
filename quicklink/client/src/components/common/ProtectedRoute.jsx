/**
 * @file       ProtectedRoute.jsx
 * @description Authentication guard component. Blocks non-authenticated users
 *              from viewing private dashboard/analytics layouts and redirects to login.
 * @module     components/common/ProtectedRoute
 * @requires   hooks/useAuth
 * @requires   react-router-dom
 * @created    2026-08-12
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner fullPage size="lg" />;
  }

  if (!isAuthenticated) {
    // Save previous path to restore user after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
