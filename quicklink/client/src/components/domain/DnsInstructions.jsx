/**
 * @file       DnsInstructions.jsx
 * @description Tabbed DNS setup instructions with provider-specific steps and copy buttons.
 * @module     components/domain/DnsInstructions
 */

import React, { useState } from 'react';
import { FiCopy, FiCheck } from 'react-icons/fi';

const PROVIDERS = ['Cloudflare', 'GoDaddy', 'Namecheap', 'Other'];

const PROVIDER_STEPS = {
  Cloudflare: [
    'Log into your Cloudflare dashboard at dash.cloudflare.com',
    'Select the domain you want to use',
    'Go to DNS → Records',
    'Click "Add record"',
    'Fill in the record values shown above',
    'Set TTL to "Auto"',
    'Click Save',
    'Wait 2-5 minutes for propagation',
  ],
  GoDaddy: [
    'Log into your GoDaddy account at dcc.godaddy.com',
    'Go to My Products → DNS',
    'Select your domain',
    'Click "Add" under Records',
    'Fill in the record values shown above',
    'Set TTL to 600 (10 minutes)',
    'Click Save',
    'DNS changes may take up to 48 hours',
  ],
  Namecheap: [
    'Log into your Namecheap account',
    'Go to Domain List → Manage',
    'Click the "Advanced DNS" tab',
    'Click "Add New Record"',
    'Fill in the record values shown above',
    'Set TTL to Automatic',
    'Click the green checkmark to save',
    'Wait 10-30 minutes for propagation',
  ],
  Other: [
    'Log into your DNS provider\'s dashboard',
    'Navigate to DNS records management',
    'Add a new record with the values shown above',
    'Set TTL to 300 or the lowest available',
    'Save the record',
    'Wait 5-10 minutes for DNS propagation',
    'Click Verify below once propagation is complete',
  ],
};

const DnsInstructions = ({ domain, token, recordType = 'TXT' }) => {
  const [activeTab, setActiveTab] = useState('Cloudflare');
  const [copiedField, setCopiedField] = useState('');

  const hostValue = recordType === 'TXT' ? `_quicklink-verify.${domain}` : domain;
  const recordValue = recordType === 'TXT' ? `quicklink-verify=${token}` : token;

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(''), 2000);
    });
  };

  return (
    <div className="dns-instructions-container">
      {/* DNS Record Card */}
      <div className="dns-record-card">
        <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-secondary)' }}>
          Add this {recordType} record to your DNS:
        </h4>

        <div className="dns-record-row">
          <span className="dns-label">Type</span>
          <span className="dns-value">{recordType}</span>
        </div>
        <div className="dns-record-row">
          <span className="dns-label">Host / Name</span>
          <div className="dns-value-copy">
            <span className="dns-value">{recordType === 'TXT' ? '_quicklink-verify' : domain}</span>
            <button className="copy-btn-sm" onClick={() => handleCopy(recordType === 'TXT' ? '_quicklink-verify' : domain, 'host')}>
              {copiedField === 'host' ? <FiCheck /> : <FiCopy />}
            </button>
          </div>
        </div>
        <div className="dns-record-row">
          <span className="dns-label">Value / Content</span>
          <div className="dns-value-copy">
            <span className="dns-value" style={{ wordBreak: 'break-all' }}>{recordValue}</span>
            <button className="copy-btn-sm" onClick={() => handleCopy(recordValue, 'value')}>
              {copiedField === 'value' ? <FiCheck /> : <FiCopy />}
            </button>
          </div>
        </div>
        <div className="dns-record-row" style={{ borderBottom: 'none' }}>
          <span className="dns-label">TTL</span>
          <span className="dns-value">300 (or Auto)</span>
        </div>
      </div>

      {/* Provider Tabs */}
      <div className="provider-tabs">
        {PROVIDERS.map((provider) => (
          <button
            key={provider}
            className={`provider-tab ${activeTab === provider ? 'provider-tab-active' : ''}`}
            onClick={() => setActiveTab(provider)}
          >
            {provider}
          </button>
        ))}
      </div>

      {/* Provider Steps */}
      <div className="provider-steps">
        <ol>
          {PROVIDER_STEPS[activeTab].map((step, idx) => (
            <li key={idx} style={{ marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Troubleshooting */}
      <div className="dns-troubleshooting">
        <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-muted)' }}>
          💡 Troubleshooting Tips
        </h4>
        <ul style={{ margin: 0, paddingLeft: '16px' }}>
          <li style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>DNS propagation can take up to 48 hours (most providers update in 5-10 min)</li>
          <li style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Clear your local DNS cache if verification keeps failing</li>
          <li style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Check for conflicting TXT records on the same host</li>
          <li style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>If using Cloudflare, ensure proxy status is set to "DNS only" (gray cloud)</li>
        </ul>
      </div>

      <style>{`
        .dns-instructions-container {
          margin-top: 16px;
        }
        .dns-record-card {
          background: rgba(15, 15, 26, 0.7);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 16px;
          margin-bottom: 16px;
          font-family: 'SFMono-Regular', Menlo, monospace;
        }
        .dns-record-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid var(--card-border);
          gap: 12px;
        }
        .dns-label {
          font-size: 0.78rem;
          color: var(--text-muted);
          font-weight: 600;
          min-width: 100px;
          flex-shrink: 0;
        }
        .dns-value {
          font-size: 0.85rem;
          color: #3ecfcf;
          font-weight: 500;
        }
        .dns-value-copy {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          justify-content: flex-end;
        }
        .copy-btn-sm {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          display: flex;
          align-items: center;
          transition: var(--transition);
          flex-shrink: 0;
        }
        .copy-btn-sm:hover {
          color: white;
          border-color: var(--text-secondary);
        }
        .provider-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 12px;
          flex-wrap: wrap;
        }
        .provider-tab {
          background: transparent;
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 6px 14px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 500;
          transition: var(--transition);
        }
        .provider-tab:hover {
          color: white;
          border-color: var(--text-secondary);
        }
        .provider-tab-active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .provider-steps {
          background: rgba(15, 15, 26, 0.4);
          border: 1px solid var(--card-border);
          border-radius: var(--radius-md);
          padding: 16px;
          margin-bottom: 16px;
        }
        .provider-steps ol {
          margin: 0;
          padding-left: 20px;
        }
        .dns-troubleshooting {
          padding: 12px;
          background: rgba(255, 152, 0, 0.05);
          border: 1px solid rgba(255, 152, 0, 0.15);
          border-radius: var(--radius-md);
        }
      `}</style>
    </div>
  );
};

export default DnsInstructions;
