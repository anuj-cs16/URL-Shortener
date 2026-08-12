/**
 * @file       LoadingSpinner.jsx
 * @description Standardized loading spinner component with size and full-page layout toggles.
 * @module     components/common/LoadingSpinner
 * @created    2026-08-12
 */

import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'var(--primary)', fullPage = false }) => {
  // Map size classes to width/height dimensions
  const dimensions = {
    sm: '20px',
    md: '40px',
    lg: '60px',
  };

  const selectedSize = dimensions[size] || dimensions.md;

  const spinnerStyle = {
    width: selectedSize,
    height: selectedSize,
    border: `3px solid rgba(255, 255, 255, 0.1)`,
    borderTop: `3px solid ${color}`,
    borderRadius: '50%',
    animation: 'rotate 0.8s linear infinite',
  };

  if (fullPage) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'var(--bg-primary)',
          display: 'flex',
          alignItems: 'center',
          justifycontent: 'center',
          zIndex: 999,
        }}
        aria-busy="true"
        aria-label="Loading page content"
      >
        <div style={spinnerStyle} />
      </div>
    );
  }

  return (
    <div
      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
      role="progressbar"
      aria-label="Loading"
    >
      <div style={spinnerStyle} />
    </div>
  );
};

export default LoadingSpinner;
