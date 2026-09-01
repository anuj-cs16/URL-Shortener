/**
 * @file       UpgradeForDomainPrompt.jsx
 * @description Upgrade prompt shown to Free and Pro users for custom domain feature.
 * @module     components/domain/UpgradeForDomainPrompt
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FiLock } from 'react-icons/fi';

const UpgradeForDomainPrompt = ({ currentPlan = 'free' }) => {
  return (
    <div className="domain-upgrade-prompt">
      <div className="upgrade-icon-circle">
        <FiLock />
      </div>

      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '16px', marginBottom: '8px' }}>
        Custom Domains
      </h2>
      <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '480px', lineHeight: '1.6' }}>
        Use your own branded short domain instead of the default URL. Available exclusively on the Business plan.
      </p>

      <div className="domain-feature-grid">
        <div className="domain-feature-item">
          <span className="feature-icon">🌐</span>
          <div>
            <strong>Branded Short Links</strong>
            <p>Use yourbrand.link instead of quicklink.run.app</p>
          </div>
        </div>
        <div className="domain-feature-item">
          <span className="feature-icon">📈</span>
          <div>
            <strong>Higher Click-Through Rates</strong>
            <p>Branded links get up to 39% more clicks</p>
          </div>
        </div>
        <div className="domain-feature-item">
          <span className="feature-icon">🔒</span>
          <div>
            <strong>Full SSL Security</strong>
            <p>Auto-provisioned HTTPS certificates</p>
          </div>
        </div>
        <div className="domain-feature-item">
          <span className="feature-icon">💼</span>
          <div>
            <strong>Professional Appearance</strong>
            <p>Build trust with your audience</p>
          </div>
        </div>
      </div>

      <Link to="/pricing" className="btn btn-primary" style={{ marginTop: '24px', height: '48px', padding: '0 32px', fontSize: '1rem' }}>
        🚀 Upgrade to Business — $29/mo
      </Link>

      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '12px' }}>
        Currently on: <strong style={{ textTransform: 'uppercase' }}>{currentPlan}</strong> plan
      </p>

      <style>{`
        .domain-upgrade-prompt {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px 20px;
        }
        .upgrade-icon-circle {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, rgba(62, 207, 207, 0.2), rgba(108, 99, 255, 0.2));
          border: 2px solid rgba(62, 207, 207, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          color: #3ecfcf;
        }
        .domain-feature-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
          width: 100%;
          max-width: 500px;
          text-align: left;
        }
        @media (min-width: 500px) {
          .domain-feature-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .domain-feature-item {
          display: flex;
          gap: 12px;
          padding: 14px;
          background: rgba(15, 15, 26, 0.5);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-md);
        }
        .domain-feature-item strong {
          font-size: 0.85rem;
          color: white;
          display: block;
          margin-bottom: 2px;
        }
        .domain-feature-item p {
          font-size: 0.78rem;
          color: var(--text-muted);
          margin: 0;
          line-height: 1.4;
        }
        .feature-icon {
          font-size: 1.3rem;
          flex-shrink: 0;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
};

export default UpgradeForDomainPrompt;
