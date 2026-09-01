/**
 * @file       DomainHealthCard.jsx
 * @description Traffic-light style health indicators for custom domain status.
 * @module     components/domain/DomainHealthCard
 */

import React from 'react';

const HealthIndicator = ({ label, status, detail }) => {
  const colorMap = { ok: '#4CAF50', warning: '#FF9800', error: '#F44336', expired: '#F44336', unknown: '#9E9E9E' };
  const iconMap = { ok: '✅', warning: '⚠️', error: '❌', expired: '❌', unknown: '❓' };
  const color = colorMap[status] || colorMap.unknown;
  const icon = iconMap[status] || iconMap.unknown;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 0',
      borderBottom: '1px solid var(--card-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{ fontSize: '1.1rem' }}>{icon}</span>
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: '0.82rem', color, fontWeight: 600, textTransform: 'capitalize' }}>
          {status === 'ok' ? 'Healthy' : status}
        </span>
        {detail && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{detail}</p>
        )}
      </div>
    </div>
  );
};

const DomainHealthCard = ({ health, lastCheckedAt, onRecheck, isLoading }) => {
  if (!health) return null;

  const overallColor = {
    healthy: '#4CAF50',
    degraded: '#FF9800',
    unhealthy: '#F44336',
    error: '#F44336',
    unknown: '#9E9E9E',
  };

  const overallIcon = {
    healthy: '🟢',
    degraded: '🟡',
    unhealthy: '🔴',
    error: '🔴',
    unknown: '⚪',
  };

  const formattedLastCheck = lastCheckedAt
    ? new Date(lastCheckedAt).toLocaleString('en-US', {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
      })
    : 'Never';

  return (
    <div className="glass-card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          {overallIcon[health.overall] || '⚪'} Health Status
        </h3>
        <span style={{
          fontSize: '0.82rem',
          fontWeight: 700,
          color: overallColor[health.overall] || '#9E9E9E',
          textTransform: 'capitalize',
        }}>
          {health.overall === 'healthy' ? 'All Systems Operational' : health.overall}
        </span>
      </div>

      <HealthIndicator
        label="DNS Resolution"
        status={health.dns?.status || 'unknown'}
        detail={health.dns?.message}
      />
      <HealthIndicator
        label="SSL Certificate"
        status={health.ssl?.status || 'unknown'}
        detail={health.ssl?.daysLeft ? `${health.ssl.daysLeft} days remaining` : health.ssl?.message}
      />
      <HealthIndicator
        label="Redirect Test"
        status={health.redirect?.status || 'unknown'}
        detail={health.redirect?.responseTime ? `${health.redirect.responseTime}ms` : null}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Last checked: {formattedLastCheck}
        </span>
        {onRecheck && (
          <button
            className="btn btn-outline"
            onClick={onRecheck}
            disabled={isLoading}
            style={{ height: '32px', fontSize: '0.78rem', padding: '0 12px' }}
          >
            {isLoading ? '⏳ Checking...' : '🔄 Recheck'}
          </button>
        )}
      </div>
    </div>
  );
};

export default DomainHealthCard;
