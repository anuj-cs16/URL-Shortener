/**
 * @file       BillingPage.jsx
 * @description Page displaying current plans, limits metrics charts, cancellations, and billing history tables.
 * @module     pages/BillingPage
 */

import React, { useEffect } from 'react';
import SEOHead from '../components/seo/SEOHead';
import PlanBadge from '../components/subscription/PlanBadge';
import UsageBar from '../components/subscription/UsageBar';
import { useSubscription } from '../hooks/useSubscription';
import { Link } from 'react-router-dom';

const BillingPage = () => {
  const {
    subscription,
    plan,
    usage,
    payments,
    isLoading,
    openBillingPortal,
    cancelPlan,
    reactivatePlan,
    fetchCurrentSubscription,
    fetchPayments,
  } = useSubscription();

  useEffect(() => {
    fetchCurrentSubscription();
    fetchPayments();
  }, [fetchCurrentSubscription, fetchPayments]);

  const handlePortalRedirect = () => {
    openBillingPortal();
  };

  const isFree = subscription?.planId === 'free';
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing';
  const isCanceledPending = subscription?.cancelAtPeriodEnd;
  const isPastDue = subscription?.status === 'past_due';

  const formattedRenewal = subscription?.currentPeriodEnd 
    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
    : '';

  const formattedTrial = subscription?.trialEnd 
    ? new Date(subscription.trialEnd).toLocaleDateString()
    : '';

  return (
    <div className="billing-page">
      <SEOHead 
        title="Billing & Plan - QuickLink"
        description="Manage your subscription plans, check monthly usage limits, and view invoice transaction history."
      />

      <h1 className="billing-page__title">Billing & Subscription</h1>
      <p className="billing-page__subtitle">Manage your account tier, track resource limits, and inspect invoices.</p>

      <div className="billing-page__grid">
        {/* Left Side: Plan Info & Usage */}
        <div className="billing-page__left">
          
          {/* Current Plan Card */}
          <div className="billing-section-card">
            <h2 className="billing-section-card__title">Current Plan</h2>
            <div className="current-plan-summary">
              <div className="current-plan-summary__header">
                <div>
                  <h3 className="current-plan-summary__name">{plan?.name || 'Free'}</h3>
                  <p className="current-plan-summary__desc">
                    {isFree ? 'Basic URL shortening services' : `$${plan?.price || 9}/month recurring`}
                  </p>
                </div>
                <PlanBadge planId={subscription?.planId} size="lg" />
              </div>

              <div className="current-plan-summary__status">
                {isFree && <span className="status-label status-label--gray">Free tier</span>}
                {subscription?.status === 'trialing' && (
                  <span className="status-label status-label--blue">Trial ends on {formattedTrial}</span>
                )}
                {subscription?.status === 'active' && !isCanceledPending && (
                  <span className="status-label status-label--green">Renews on {formattedRenewal}</span>
                )}
                {isCanceledPending && (
                  <span className="status-label status-label--orange">Expires on {formattedRenewal}</span>
                )}
                {isPastDue && (
                  <span className="status-label status-label--red">⚠️ Renewal failed. Action required.</span>
                )}
              </div>

              <div className="current-plan-summary__actions">
                {isFree ? (
                  <Link to="/pricing" className="btn btn--primary">⚡ Upgrade to Pro</Link>
                ) : (
                  <>
                    <button 
                      className="btn btn--secondary"
                      onClick={handlePortalRedirect}
                      disabled={isLoading}
                    >
                      💳 Manage Billing Portal
                    </button>
                    
                    {isActive && !isCanceledPending && (
                      <button 
                        className="btn btn--danger"
                        onClick={cancelPlan}
                        disabled={isLoading}
                      >
                        Cancel Plan
                      </button>
                    )}

                    {isCanceledPending && (
                      <button 
                        className="btn btn--success"
                        onClick={reactivatePlan}
                        disabled={isLoading}
                      >
                        Reactivate Plan
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Usage This Month */}
          <div className="billing-section-card">
            <h2 className="billing-section-card__title">Usage This Month</h2>
            <div className="usage-summary">
              {usage && (
                <>
                  <UsageBar
                    label="URLs Created"
                    used={usage.urlsCreated}
                    limit={usage.urlsLimit}
                    icon="🔗"
                    resetDate={usage.resetDate}
                  />
                  <UsageBar
                    label="Clicks Tracked"
                    used={usage.clicksReceived}
                    limit={usage.clicksLimit}
                    icon="📊"
                  />
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Payment History & Plan Features */}
        <div className="billing-page__right">
          
          {/* Payment History */}
          <div className="billing-section-card">
            <h2 className="billing-section-card__title">Payment History</h2>
            <div className="payment-history-table-wrapper">
              {payments.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-state__icon">📄</span>
                  <p className="empty-state__text">No invoice records found.</p>
                </div>
              ) : (
                <table className="payment-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p._id}>
                        <td>{new Date(p.paidAt).toLocaleDateString()}</td>
                        <td><PlanBadge planId={p.planId} size="sm" /></td>
                        <td>${(p.amount / 100).toFixed(2)}</td>
                        <td>
                          <span className={`status-pill status-pill--${p.status}`}>
                            {p.status}
                          </span>
                        </td>
                        <td>
                          {p.receiptUrl ? (
                            <a href={p.receiptUrl} target="_blank" rel="noopener noreferrer" className="receipt-link">
                              Download ↗
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Plan Features Gating */}
          <div className="billing-section-card">
            <h2 className="billing-section-card__title">Plan Features</h2>
            <div className="features-checklist">
              {plan?.features.map((feature, idx) => (
                <div key={idx} className="feature-checklist-item">
                  <span className="feature-checklist-item__icon">✓</span>
                  <span>{feature}</span>
                </div>
              ))}
              
              {isFree && (
                <div className="feature-checklist-cta">
                  <p>Upgrade to Pro to unlock custom links, QR codes configurations, bulk shortenings, and detailed analytics history!</p>
                  <Link to="/pricing" className="feature-checklist-cta__link">
                    View Upgrade Tiers ⚡
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
