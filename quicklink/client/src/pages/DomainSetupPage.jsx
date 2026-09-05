/**
 * @file       DomainSetupPage.jsx
 * @description Full domain management page with 3-step setup wizard,
 *              active domain management, and upgrade prompts.
 * @module     pages/DomainSetupPage
 * @requires   react
 * @requires   hooks/useDomains
 * @requires   hooks/useSubscription
 * @requires   framer-motion
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useDomains } from '../hooks/useDomains';
import { useSubscription } from '../hooks/useSubscription';
import DomainStatusBadge from '../components/domain/DomainStatusBadge';
import DnsInstructions from '../components/domain/DnsInstructions';
import DomainHealthCard from '../components/domain/DomainHealthCard';
import UpgradeForDomainPrompt from '../components/domain/UpgradeForDomainPrompt';
import SEOHead from '../components/seo/SEOHead';
import { FiGlobe, FiCheck, FiTrash2, FiStar, FiRefreshCw, FiX } from 'react-icons/fi';

const DomainSetupPage = () => {
  const { user } = useAuth();
  const { subscription, fetchCurrentSubscription } = useSubscription();
  const {
    domains,
    isLoading,
    isVerifying,
    fetchDomains,
    addNewDomain,
    verifyExistingDomain,
    checkDomainStatus,
    setAsDefault,
    deleteDomain,
    recheckDomain,
    startVerificationPolling,
    stopVerificationPolling,
  } = useDomains();

  // Wizard states
  const [wizardStep, setWizardStep] = useState(1);
  const [domainInput, setDomainInput] = useState('');
  const [addedDomainData, setAddedDomainData] = useState(null);
  const [domainDetailStatus, setDomainDetailStatus] = useState(null);

  // Delete confirmation
  const [confirmDelete, setConfirmDelete] = useState(null);

  const planId = subscription?.planId || user?.planId || 'free';
  const isBusiness = planId === 'business';

  useEffect(() => {
    fetchCurrentSubscription();
  }, [fetchCurrentSubscription]);

  useEffect(() => {
    if (isBusiness) {
      fetchDomains();
    }
  }, [isBusiness, fetchDomains]);

  // Check if user already has a domain configured
  const existingDomain = domains.length > 0 ? domains[0] : null;
  const isActiveDomain = existingDomain?.status === 'active';
  const isPendingDomain = existingDomain?.status === 'pending_verification' || existingDomain?.status === 'dns_failed';

  // Fetch detailed status for active domains
  useEffect(() => {
    if (isActiveDomain && existingDomain) {
      checkDomainStatus(existingDomain.domain).then((data) => {
        if (data) setDomainDetailStatus(data);
      });
    }
  }, [isActiveDomain, existingDomain]); // eslint-disable-line

  // If non-business user, show upgrade prompt
  if (!isBusiness) {
    return (
      <>
        <SEOHead pageKey="settings" />
        <div className="page-wrapper">
          <h1 className="page-title-main">Custom Domain</h1>
          <div className="glass-card">
            <UpgradeForDomainPrompt currentPlan={planId} />
          </div>
        </div>
      </>
    );
  }

  // Step 1: Enter Domain
  const handleDomainSubmit = async (e) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    try {
      const result = await addNewDomain(domainInput.trim());
      if (result) {
        setAddedDomainData(result);
        setWizardStep(2);
        setDomainInput('');
      }
    } catch {
      // Error handled in hook
    }
  };

  // Step 2: Verify DNS
  const handleVerify = async () => {
    const domain = addedDomainData?.domain || existingDomain?.domain;
    if (!domain) return;

    try {
      const result = await verifyExistingDomain(domain);
      if (result?.status === 'ssl_provisioning') {
        setWizardStep(3);
        startVerificationPolling(domain);
      }
    } catch {
      // Error handled in hook
    }
  };

  // Handle domain deletion
  const handleDelete = async (domain) => {
    await deleteDomain(domain);
    setConfirmDelete(null);
    setAddedDomainData(null);
    setWizardStep(1);
  };

  return (
    <>
      <SEOHead pageKey="settings" />
      <div className="page-wrapper domain-page-wrapper">
        <div className="domain-page-header">
          <div>
            <h1 className="page-title-main" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <FiGlobe /> Custom Domain
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px' }}>
              Configure a branded short domain for your links
            </p>
          </div>
        </div>

        {/* Active Domain View */}
        {isActiveDomain && existingDomain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="domain-active-section"
          >
            {/* Domain Summary Card */}
            <div className="glass-card domain-summary-card">
              <div className="domain-summary-header">
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {existingDomain.domain}
                    <DomainStatusBadge status={existingDomain.status} size="md" />
                  </h2>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', margin: 0 }}>
                    Your branded short URL domain
                  </p>
                </div>
                <div className="domain-summary-actions">
                  {!existingDomain.isDefault && (
                    <button
                      className="btn btn-outline"
                      onClick={() => setAsDefault(existingDomain.domain)}
                      disabled={isLoading}
                      style={{ height: '36px', fontSize: '0.82rem', padding: '0 14px' }}
                    >
                      <FiStar /> Set Default
                    </button>
                  )}
                  {existingDomain.isDefault && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      fontSize: '0.82rem', color: '#4CAF50', fontWeight: 600,
                    }}>
                      ⭐ Default Domain
                    </span>
                  )}
                  <button
                    className="btn btn-outline"
                    onClick={() => recheckDomain(existingDomain.domain)}
                    disabled={isLoading}
                    style={{ height: '36px', fontSize: '0.82rem', padding: '0 14px' }}
                  >
                    <FiRefreshCw /> Recheck DNS
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => setConfirmDelete(existingDomain.domain)}
                    style={{ height: '36px', fontSize: '0.82rem', padding: '0 14px', borderColor: 'var(--error)', color: 'var(--error)' }}
                  >
                    <FiTrash2 /> Remove
                  </button>
                </div>
              </div>

              <div className="divider" style={{ margin: '16px 0' }} />

              {/* Stats Row */}
              <div className="domain-stats-row">
                <div className="domain-stat-item">
                  <span className="stat-number">{existingDomain.urlCount || 0}</span>
                  <span className="stat-label">URLs Created</span>
                </div>
                <div className="domain-stat-item">
                  <span className="stat-number">{domainDetailStatus?.stats?.totalClicks || 0}</span>
                  <span className="stat-label">Total Clicks</span>
                </div>
                <div className="domain-stat-item">
                  <span className="stat-number">
                    {domainDetailStatus?.ssl?.daysUntilExpiry || '—'}
                  </span>
                  <span className="stat-label">SSL Days Left</span>
                </div>
                <div className="domain-stat-item">
                  <span className="stat-number" style={{ fontSize: '0.85rem' }}>
                    {existingDomain.dnsVerifiedAt
                      ? new Date(existingDomain.dnsVerifiedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                      : '—'}
                  </span>
                  <span className="stat-label">DNS Verified</span>
                </div>
              </div>

              {/* Example URL */}
              <div className="domain-example-url">
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Example link:</span>
                <span style={{ fontSize: '0.95rem', color: '#3ecfcf', fontWeight: 700 }}>
                  https://{existingDomain.domain}/my-link
                </span>
              </div>
            </div>

            {/* Health Card */}
            {domainDetailStatus?.health && (
              <DomainHealthCard
                health={domainDetailStatus.health}
                lastCheckedAt={existingDomain.lastCheckedAt}
                onRecheck={() => recheckDomain(existingDomain.domain)}
                isLoading={isLoading}
              />
            )}
          </motion.div>
        )}

        {/* Pending Domain View */}
        {isPendingDomain && existingDomain && !isActiveDomain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {existingDomain.domain}
                  <DomainStatusBadge status={existingDomain.status} size="md" />
                </h2>
                <button
                  className="btn btn-outline"
                  onClick={() => setConfirmDelete(existingDomain.domain)}
                  style={{ height: '34px', fontSize: '0.8rem', padding: '0 12px', borderColor: 'var(--error)', color: 'var(--error)' }}
                >
                  <FiTrash2 /> Cancel
                </button>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '16px' }}>
                Complete the DNS verification steps below to activate your domain.
              </p>

              <DnsInstructions
                domain={existingDomain.domain}
                token={addedDomainData?.verification?.value?.split('=')[1] || 'your-verification-token'}
              />

              <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleVerify}
                  disabled={isVerifying}
                  style={{ height: '44px', padding: '0 24px', fontSize: '0.95rem' }}
                >
                  {isVerifying ? '⏳ Checking DNS...' : '🔍 Verify DNS Records'}
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => recheckDomain(existingDomain.domain)}
                  disabled={isLoading}
                  style={{ height: '44px', padding: '0 18px', fontSize: '0.9rem' }}
                >
                  <FiRefreshCw /> Recheck
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Setup Wizard (no existing domain) */}
        {!existingDomain && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Wizard Progress */}
            <div className="wizard-progress-bar">
              {[
                { num: 1, label: 'Enter Domain' },
                { num: 2, label: 'Verify DNS' },
                { num: 3, label: 'SSL & Activate' },
              ].map((step) => (
                <div
                  key={step.num}
                  className={`wizard-step-item ${wizardStep >= step.num ? 'wizard-step-active' : ''} ${wizardStep > step.num ? 'wizard-step-complete' : ''}`}
                >
                  <div className="wizard-step-circle">
                    {wizardStep > step.num ? <FiCheck /> : step.num}
                  </div>
                  <span className="wizard-step-label">{step.label}</span>
                  {step.num < 3 && <div className="wizard-step-connector" />}
                </div>
              ))}
            </div>

            {/* Step Content */}
            <AnimatePresence mode="wait">
              {/* Step 1: Enter Domain */}
              {wizardStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="glass-card wizard-step-card"
                >
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                    Enter Your Domain
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px' }}>
                    Enter the domain you own and want to use for branded short links.
                  </p>

                  <form onSubmit={handleDomainSubmit}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ position: 'relative' }}>
                          <FiGlobe style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                          <input
                            type="text"
                            className="form-input"
                            value={domainInput}
                            onChange={(e) => setDomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9.-]/g, ''))}
                            placeholder="e.g., mybrand.link"
                            style={{ paddingLeft: '40px', height: '48px' }}
                            disabled={isLoading}
                          />
                        </div>
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px', display: 'block' }}>
                          Supported TLDs: .com, .io, .co, .link, .xyz, .dev, .app, .sh, .me, and more
                        </span>
                      </div>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isLoading || !domainInput.trim()}
                        style={{ height: '48px', padding: '0 24px', flexShrink: 0 }}
                      >
                        {isLoading ? '⏳' : '→'} Add Domain
                      </button>
                    </div>
                  </form>
                </motion.div>
              )}

              {/* Step 2: Verify DNS */}
              {wizardStep === 2 && addedDomainData && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="glass-card wizard-step-card"
                >
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px' }}>
                    Verify DNS Ownership
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                    Add the following DNS record to <strong>{addedDomainData.domain}</strong> to prove ownership.
                  </p>

                  <DnsInstructions
                    domain={addedDomainData.domain}
                    token={addedDomainData.verification?.value?.split('=')[1] || ''}
                  />

                  <div style={{ marginTop: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button
                      className="btn btn-primary"
                      onClick={handleVerify}
                      disabled={isVerifying}
                      style={{ height: '48px', padding: '0 28px', fontSize: '0.95rem' }}
                    >
                      {isVerifying ? '⏳ Checking DNS...' : '✅ Verify DNS Records'}
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        setWizardStep(1);
                        setAddedDomainData(null);
                      }}
                      style={{ height: '48px', padding: '0 20px' }}
                    >
                      ← Back
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: SSL & Activation */}
              {wizardStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  className="glass-card wizard-step-card"
                  style={{ textAlign: 'center' }}
                >
                  <div className="ssl-provisioning-spinner">
                    <div className="spinner-ring" />
                  </div>

                  <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', marginTop: '20px' }}>
                    🔒 SSL Certificate Provisioning
                  </h2>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
                    Your domain is being configured with a free SSL certificate. This usually takes 2-5 minutes.
                  </p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                    This page will automatically update once your domain is active.
                  </p>

                  <div style={{ marginTop: '24px' }}>
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        fetchDomains();
                        stopVerificationPolling();
                      }}
                      style={{ height: '44px', padding: '0 24px' }}
                    >
                      🔄 Check Status Now
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {confirmDelete && (
            <div className="modal-overlay-bg">
              <motion.div
                className="modal-container-card glass-card"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
              >
                <div className="modal-header-row">
                  <h3>Remove Domain</h3>
                  <button className="close-modal-btn" onClick={() => setConfirmDelete(null)}>
                    <FiX />
                  </button>
                </div>
                <p style={{ marginTop: '12px', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  Are you sure you want to remove <strong>{confirmDelete}</strong>?
                  All URLs using this domain will be migrated to the default domain.
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                  <button className="btn btn-outline" style={{ flex: 1, height: '42px' }} onClick={() => setConfirmDelete(null)}>
                    Cancel
                  </button>
                  <button
                    className="btn"
                    style={{ flex: 1, height: '42px', background: 'var(--error)', color: 'white', border: 'none' }}
                    onClick={() => handleDelete(confirmDelete)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Removing...' : '🗑️ Remove Domain'}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <style>{`
          .domain-page-wrapper {
            max-width: 800px;
          }
          .domain-page-header {
            margin-bottom: 28px;
          }
          .page-title-main {
            font-size: 1.8rem;
            font-weight: 800;
          }

          /* Wizard Progress */
          .wizard-progress-bar {
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 28px;
            gap: 0;
          }
          .wizard-step-item {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .wizard-step-circle {
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.88rem;
            font-weight: 700;
            border: 2px solid var(--border);
            color: var(--text-muted);
            background: rgba(15, 15, 26, 0.5);
            transition: all 0.3s ease;
          }
          .wizard-step-active .wizard-step-circle {
            border-color: var(--primary);
            color: white;
            background: var(--primary);
          }
          .wizard-step-complete .wizard-step-circle {
            border-color: #4CAF50;
            color: white;
            background: #4CAF50;
          }
          .wizard-step-label {
            font-size: 0.82rem;
            font-weight: 600;
            color: var(--text-muted);
          }
          .wizard-step-active .wizard-step-label {
            color: white;
          }
          .wizard-step-complete .wizard-step-label {
            color: #4CAF50;
          }
          .wizard-step-connector {
            width: 40px;
            height: 2px;
            background: var(--border);
            margin: 0 8px;
          }
          .wizard-step-complete + .wizard-step-connector,
          .wizard-step-complete .wizard-step-connector {
            background: #4CAF50;
          }
          .wizard-step-card {
            padding: 28px;
          }

          /* Active Domain */
          .domain-active-section {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .domain-summary-card {
            padding: 24px;
          }
          .domain-summary-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 16px;
            flex-wrap: wrap;
          }
          .domain-summary-actions {
            display: flex;
            gap: 8px;
            flex-wrap: wrap;
          }
          .domain-stats-row {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 16px;
            margin-top: 16px;
          }
          .domain-stat-item {
            text-align: center;
            padding: 12px;
            background: rgba(15, 15, 26, 0.4);
            border-radius: var(--radius-md);
            border: 1px solid var(--card-border);
          }
          .stat-number {
            display: block;
            font-size: 1.4rem;
            font-weight: 800;
            color: white;
          }
          .stat-label {
            display: block;
            font-size: 0.72rem;
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            margin-top: 4px;
          }
          .domain-example-url {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-top: 16px;
            padding: 10px 14px;
            background: rgba(15, 15, 26, 0.5);
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
          }

          /* SSL Provisioning */
          .ssl-provisioning-spinner {
            display: flex;
            justify-content: center;
            margin-top: 8px;
          }
          .spinner-ring {
            width: 52px;
            height: 52px;
            border-radius: 50%;
            border: 3px solid var(--card-border);
            border-top-color: var(--primary);
            animation: spinRing 1s linear infinite;
          }
          @keyframes spinRing {
            to { transform: rotate(360deg); }
          }

          /* Responsive */
          @media (max-width: 640px) {
            .domain-stats-row {
              grid-template-columns: repeat(2, 1fr);
            }
            .domain-summary-header {
              flex-direction: column;
            }
            .wizard-step-label {
              display: none;
            }
            .wizard-step-connector {
              width: 24px;
            }
          }
        `}</style>
      </div>
    </>
  );
};

export default DomainSetupPage;
