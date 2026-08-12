/**
 * @file       EmptyState.jsx
 * @description Card template for presenting clean warnings when collection lookups return empty.
 * @module     components/common/EmptyState
 * @created    2026-08-12
 */

import React from 'react';

const EmptyState = ({ icon = '📂', title = 'No Data Available', message = 'Check back later or take action below.', actionText = '', onAction = null }) => {
  return (
    <div
      className="glass-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '50px 30px',
        textAlign: 'center',
      }}
    >
      <span style={{ fontSize: '3rem', marginBottom: '16px', display: 'block' }} role="img" aria-label={title}>
        {icon}
      </span>
      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
        {title}
      </h3>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '400px', marginBottom: actionText ? '24px' : '0' }}>
        {message}
      </p>
      {actionText && onAction && (
        <button className="btn btn-primary" onClick={onAction} style={{ height: '42px', padding: '0 24px' }}>
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
