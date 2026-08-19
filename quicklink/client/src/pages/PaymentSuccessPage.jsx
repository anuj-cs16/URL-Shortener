/**
 * @file       PaymentSuccessPage.jsx
 * @description Confetti confirmation page shown upon subscription success. Redirects user to dashboard.
 * @module     pages/PaymentSuccessPage
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import SEOHead from '../components/seo/SEOHead';

const PaymentSuccessPage = () => {
  const [countdown, setCountdown] = useState(10);
  const { subscription, fetchCurrentSubscription } = useSubscription();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCurrentSubscription();
  }, [fetchCurrentSubscription]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const planName = subscription?.planId === 'business' ? 'Business' : 'Pro';

  return (
    <div className="payment-success-page">
      <SEOHead 
        title="Payment Success - QuickLink"
        description="Your subscription checkout was successful! Welcome to QuickLink Premium."
      />

      <div className="payment-success-page__card">
        {/* Animated Checkmark Icon */}
        <div className="success-icon-wrapper">
          <div className="success-icon-checkmark">✓</div>
        </div>

        <h1 className="payment-success-page__title">Welcome to {planName}! 🎉</h1>
        <p className="payment-success-page__subtitle">Your account has been successfully upgraded.</p>

        <div className="payment-success-page__details">
          <h3>Subscription Active</h3>
          <p>You now have full access to custom short links, advanced analytics history, CSV/JSON data export, and bulk URL shortening features.</p>
        </div>

        <div className="payment-success-page__actions">
          <button 
            className="payment-success-page__btn payment-success-page__btn--primary"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
          <button 
            className="payment-success-page__btn payment-success-page__btn--secondary"
            onClick={() => navigate('/analytics')}
          >
            View Analytics
          </button>
        </div>

        <p className="payment-success-page__countdown">
          Redirecting to dashboard in <strong>{countdown}</strong> seconds...
        </p>
      </div>
    </div>
  );
};

export default PaymentSuccessPage;
