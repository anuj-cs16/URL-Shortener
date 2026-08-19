/**
 * @file       PricingPage.jsx
 * @description Ingests plans metadata, lists toggles, features grids, trust marks, and Stripe subscription handlers.
 * @module     pages/PricingPage
 */

import React, { useState, useEffect } from 'react';
import SEOHead from '../components/seo/SEOHead';
import PlanCard from '../components/subscription/PlanCard';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const PricingPage = () => {
  const [billingInterval, setBillingInterval] = useState('monthly');
  const { plans, subscription, upgradeToPlan, fetchPlans, fetchCurrentSubscription } = useSubscription();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated) {
      fetchCurrentSubscription();
    }
  }, [fetchPlans, fetchCurrentSubscription, isAuthenticated]);

  const handlePlanSelect = (planId) => {
    if (!isAuthenticated) {
      navigate(`/signup?redirect=pricing&plan=${planId}`);
      return;
    }
    if (planId === 'free') {
      navigate('/dashboard');
      return;
    }
    upgradeToPlan(planId);
  };

  const currentPlanId = subscription?.planId || 'free';

  return (
    <div className="pricing-page">
      <SEOHead 
        title="Pricing - QuickLink URL Shortener"
        description="Simple transparent pricing for QuickLink. Start free, upgrade anytime. Pro plan from $9/month."
      />

      <div className="pricing-page__header">
        <h1 className="pricing-page__title">Simple, Transparent Pricing</h1>
        <p className="pricing-page__subtitle">Start free, upgrade when you need advanced capabilities</p>
        
        <div className="pricing-page__toggle-container">
          <button 
            className={`pricing-page__toggle-btn ${billingInterval === 'monthly' ? 'pricing-page__toggle-btn--active' : ''}`}
            onClick={() => setBillingInterval('monthly')}
          >
            Monthly
          </button>
          <button 
            className={`pricing-page__toggle-btn ${billingInterval === 'yearly' ? 'pricing-page__toggle-btn--active' : ''}`}
            onClick={() => setBillingInterval('yearly')}
          >
            Yearly <span className="pricing-page__save-badge">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="pricing-page__cards-grid">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={currentPlanId === plan.id}
            billingInterval={billingInterval}
            onSelect={handlePlanSelect}
          />
        ))}
      </div>

      {/* Feature Comparison Table */}
      <div className="pricing-page__comparison-section">
        <h2 className="pricing-page__comparison-title">Compare Features</h2>
        <div className="pricing-page__table-wrapper">
          <table className="pricing-page__table">
            <thead>
              <tr>
                <th>Feature</th>
                <th>Free</th>
                <th>Pro</th>
                <th>Business</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>URLs / month</td>
                <td>10</td>
                <td>500</td>
                <td>Unlimited</td>
              </tr>
              <tr>
                <td>Clicks / month</td>
                <td>1,000</td>
                <td>50,000</td>
                <td>Unlimited</td>
              </tr>
              <tr>
                <td>Custom Short Codes</td>
                <td>✕</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Analytics History</td>
                <td>7 days</td>
                <td>90 days</td>
                <td>1 year</td>
              </tr>
              <tr>
                <td>QR Codes</td>
                <td>✓</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>API Access</td>
                <td>✕</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Custom Domain</td>
                <td>✕</td>
                <td>✕</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Bulk URL Shortening</td>
                <td>✕</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Team Members</td>
                <td>1</td>
                <td>1</td>
                <td>Up to 10</td>
              </tr>
              <tr>
                <td>Data Export (CSV/JSON)</td>
                <td>✕</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Password Protected URLs</td>
                <td>✕</td>
                <td>✓</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>Priority Support</td>
                <td>✕</td>
                <td>✕</td>
                <td>✓</td>
              </tr>
              <tr>
                <td>White Labeling</td>
                <td>✕</td>
                <td>✕</td>
                <td>✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="pricing-page__faq-section">
        <h2 className="pricing-page__faq-title">Frequently Asked Questions</h2>
        <div className="pricing-page__faq-grid">
          <details className="pricing-page__faq-item">
            <summary className="pricing-page__faq-question">Can I cancel anytime?</summary>
            <p className="pricing-page__faq-answer">
              Yes, absolutely. You can cancel your subscription with a single click in your Billing dashboard. 
              You will continue to have access to your premium features until the end of your current billing period.
            </p>
          </details>

          <details className="pricing-page__faq-item">
            <summary className="pricing-page__faq-question">Is there a free trial?</summary>
            <p className="pricing-page__faq-answer">
              Yes! We offer a 14-day free trial on our Pro and Business plans so you can test all the premium 
              features risk-free. No credit card is required to set up your account.
            </p>
          </details>

          <details className="pricing-page__faq-item">
            <summary className="pricing-page__faq-question">What happens when I hit my usage limits?</summary>
            <p className="pricing-page__faq-answer">
              We will send you an email alert once you reach 80% and 100% of your plan's limits. Once you hit 
              100% of your URL creations, you will need to wait for your monthly cycle reset or upgrade to 
              a higher tier plan to continue.
            </p>
          </details>

          <details className="pricing-page__faq-item">
            <summary className="pricing-page__faq-question">Can I change plans later?</summary>
            <p className="pricing-page__faq-answer">
              Yes, you can upgrade or downgrade between tiers instantly. If you upgrade, the charge will 
              be prorated based on the remaining time in your current cycle.
            </p>
          </details>

          <details className="pricing-page__faq-item">
            <summary className="pricing-page__faq-question">Do you offer refunds?</summary>
            <p className="pricing-page__faq-answer">
              Yes, we offer a 30-day money-back guarantee on your initial purchase. If you are not fully satisfied, 
              simply contact support within 30 days for a full refund.
            </p>
          </details>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="pricing-page__trust-badges">
        <div className="pricing-page__badge">
          <span className="pricing-page__badge-icon">🔒</span>
          <h4>Secured by Stripe</h4>
          <p>PCI-compliant end-to-end encryption</p>
        </div>
        <div className="pricing-page__badge">
          <span className="pricing-page__badge-icon">🔄</span>
          <h4>30-Day Guarantee</h4>
          <p>Risk-free trial and refund policy</p>
        </div>
        <div className="pricing-page__badge">
          <span className="pricing-page__badge-icon">⚡</span>
          <h4>Cancel Anytime</h4>
          <p>Control subscription via billing portal</p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
