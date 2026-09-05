/**
 * @file       App.js
 * @description Main Application component. Wireframe routing logic,
 *              mount context providers, toast configurations, and layouts structure.
 * @module     App
 * @requires   react
 * @requires   react-router-dom
 * @requires   context/AuthContext
 * @requires   react-hot-toast
 * @requires   components/layout/Navbar
 * @requires   components/layout/Footer
 * @created    2026-08-12
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';

// Layout components
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { AiCopilotDrawer } from './components/ai/AiCopilotDrawer';

// Page components
import HomePage from './pages/HomePage';

import DashboardPage from './pages/DashboardPage';
import AnalyticsPage from './pages/AnalyticsPage';
import UrlAnalyticsPage from './pages/UrlAnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import EmailSettingsPage from './pages/EmailSettingsPage';
import VerifyTwoFactorPage from './pages/VerifyTwoFactorPage';
import SecurityPage from './pages/SecurityPage';
import PricingPage from './pages/PricingPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import BillingPage from './pages/BillingPage';
import DomainSetupPage from './pages/DomainSetupPage';

import { TeamProvider } from './context/TeamContext';

// Team pages
import CreateTeamPage from './pages/CreateTeamPage';
import TeamDashboardPage from './pages/TeamDashboardPage';
import TeamMembersPage from './pages/TeamMembersPage';
import TeamSettingsPage from './pages/TeamSettingsPage';
import TeamAnalyticsPage from './pages/TeamAnalyticsPage';
import AcceptInvitePage from './pages/AcceptInvitePage';

// Route guards & utilities

import ErrorBoundary from './components/common/ErrorBoundary';

// Global Stylesheet
import './styles/globals.css';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <TeamProvider>
          <BrowserRouter>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Routes>
                  {/* Guest & Public routes */}
                  <Route path="/" element={<HomePage />} />
                  <Route path="/pricing" element={<PricingPage />} />

                  {/* Protected member pages */}
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/analytics/:shortCode" element={<UrlAnalyticsPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/settings/notifications" element={<EmailSettingsPage />} />
                  <Route path="/settings/security" element={<SecurityPage />} />
                  <Route path="/payment/success" element={<PaymentSuccessPage />} />
                  <Route path="/billing" element={<BillingPage />} />
                  <Route path="/settings/domain" element={<DomainSetupPage />} />
                  <Route path="/verify-2fa" element={<VerifyTwoFactorPage />} />

                  {/* Team Workspace Routes */}
                  <Route path="/teams/create" element={<CreateTeamPage />} />
                  <Route path="/teams/:teamId" element={<TeamDashboardPage />} />
                  <Route path="/teams/:teamId/members" element={<TeamMembersPage />} />
                  <Route path="/teams/:teamId/settings" element={<TeamSettingsPage />} />
                  <Route path="/teams/:teamId/analytics" element={<TeamAnalyticsPage />} />
                  <Route path="/teams/invite/:code" element={<AcceptInvitePage />} />

                  {/* Fallback routing */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </div>
              <Footer />
              <AiCopilotDrawer />
            </div>

            {/* Toast Notification Container styling */}
            <Toaster
              position="bottom-right"
              toastOptions={{
                duration: 3500,
                style: {
                  background: '#16213E',
                  color: '#FFFFFF',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font)',
                  fontSize: '0.88rem',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow)',
                },
                success: {
                  iconTheme: {
                    primary: 'var(--success)',
                    secondary: 'white',
                  },
                },
                error: {
                  iconTheme: {
                    primary: 'var(--error)',
                    secondary: 'white',
                  },
                },
              }}
            />
          </BrowserRouter>
        </TeamProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
