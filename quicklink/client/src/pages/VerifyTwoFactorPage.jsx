/**
 * @file       VerifyTwoFactorPage.jsx
 * @description Page view for verifying 2FA (TOTP or Backup Code) during login redirects.
 * @module     pages/VerifyTwoFactorPage
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import * as securityApi from '../api/securityApi';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiLock, FiShield, FiKey, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const VerifyTwoFactorPage = () => {
  const { updateUser, logout } = useAuth();
  const [token, setToken] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;

    setIsLoading(true);
    try {
      const res = await securityApi.verify2FA(token);
      if (res.success) {
        toast.success(res.message || 'Two factor verification successful!');
        if (res.warning) {
          toast.error(res.warning, { duration: 6000 });
        }
        
        // Update user state in auth context
        updateUser(res.data.user);
        if (res.data.token) {
          localStorage.setItem('token', res.data.token);
        }
        
        // Redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || err.message || 'Invalid verification code';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="auth-page-wrapper">
      <div className="glass-card auth-container-card">
        <div className="auth-header">
          <span className="auth-logo-emoji">🛡️</span>
          <h2>Two-Factor Security</h2>
          <p>
            {useBackup
              ? 'Enter one of your 8-character backup codes (XXXX-XXXX).'
              : 'Enter the 6-digit verification code from your authenticator app.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="input-label-tag">
              {useBackup ? 'Backup Code' : 'Verification Code'}
            </label>
            <div className="auth-input-group">
              {useBackup ? <FiKey className="auth-input-icon" /> : <FiLock className="auth-input-icon" />}
              <input
                type="text"
                className="form-input auth-field-input"
                placeholder={useBackup ? 'XXXX-XXXX' : '123456'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                maxLength={useBackup ? 9 : 6}
                required
                disabled={isLoading}
                autoFocus
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" color="white" /> : <><FiShield /> Verify Code</>}
          </button>
        </form>

        <div className="auth-footer-links" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
          <button
            onClick={() => {
              setToken('');
              setUseBackup(!useBackup);
            }}
            className="text-link-btn"
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '0.88rem' }}
            disabled={isLoading}
          >
            {useBackup ? 'Use Authenticator Code instead' : 'Use a Backup Code instead'}
          </button>

          <button
            onClick={handleCancel}
            className="text-link-btn"
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
            disabled={isLoading}
          >
            <FiArrowLeft size={14} /> Back to Login
          </button>
        </div>
      </div>

      <style>{`
        .text-link-btn:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default VerifyTwoFactorPage;
