/**
 * @file       DomainStatusBadge.jsx
 * @description Color-coded status badge for custom domain states.
 * @module     components/domain/DomainStatusBadge
 */

import React from 'react';

const STATUS_CONFIG = {
  pending_verification: { label: 'Pending Verification', color: '#FF9800', bg: 'rgba(255, 152, 0, 0.15)', icon: '⏳' },
  dns_verified: { label: 'DNS Verified', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.15)', icon: '🔍' },
  ssl_provisioning: { label: 'SSL Provisioning', color: '#2196F3', bg: 'rgba(33, 150, 243, 0.15)', icon: '🔄', pulse: true },
  ssl_active: { label: 'SSL Active', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.15)', icon: '🔒' },
  active: { label: 'Active', color: '#4CAF50', bg: 'rgba(76, 175, 80, 0.15)', icon: '✅' },
  ssl_expired: { label: 'SSL Expired', color: '#F44336', bg: 'rgba(244, 67, 54, 0.15)', icon: '❌' },
  dns_failed: { label: 'DNS Failed', color: '#F44336', bg: 'rgba(244, 67, 54, 0.15)', icon: '⚠️' },
  suspended: { label: 'Suspended', color: '#9E9E9E', bg: 'rgba(158, 158, 158, 0.15)', icon: '🚫' },
  removed: { label: 'Removed', color: '#9E9E9E', bg: 'rgba(158, 158, 158, 0.15)', icon: '🗑️' },
};

const DomainStatusBadge = ({ status, size = 'sm' }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending_verification;
  const fontSize = size === 'lg' ? '0.9rem' : size === 'md' ? '0.82rem' : '0.75rem';
  const padding = size === 'lg' ? '6px 14px' : size === 'md' ? '4px 10px' : '3px 8px';

  return (
    <>
      <span className={`domain-status-badge ${config.pulse ? 'badge-pulse' : ''}`} style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize,
        padding,
        borderRadius: '20px',
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.color}33`,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}>
        <span>{config.icon}</span>
        <span>{config.label}</span>
      </span>

      {config.pulse && (
        <style>{`
          @keyframes badgePulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.6; }
          }
          .badge-pulse {
            animation: badgePulse 2s ease-in-out infinite;
          }
        `}</style>
      )}
    </>
  );
};

export default DomainStatusBadge;
