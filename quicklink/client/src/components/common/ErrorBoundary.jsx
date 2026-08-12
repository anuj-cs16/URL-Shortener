/**
 * @file       ErrorBoundary.jsx
 * @description Class error boundary component. Captures layout rendering exceptions
 *              and presents user-friendly crash dialogs.
 * @module     components/common/ErrorBoundary
 * @created    2026-08-12
 */

import React, { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to trigger fallback UI on next render
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '500px',
              width: '100%',
              textAlign: 'center',
              padding: '40px 30px',
            }}
          >
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }} role="img" aria-label="Warning">
              ⚠️
            </span>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>
              Something went wrong.
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
              A layout rendering exception was caught. Try resetting the application dashboard or returning home.
            </p>
            <button className="btn btn-primary" onClick={this.handleReset} style={{ width: '100%' }}>
              🏠 Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
