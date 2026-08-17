/**
 * @file       LoginPage.jsx
 * @description User authentication login view. Incorporates form handling,
 *              shake validations, and automatic redirects using the useAuth hook.
 * @module     pages/LoginPage
 * @requires   react
 * @requires   hooks/useAuth
 * @requires   react-router-dom
 * @requires   react-icons/fi
 * @requires   components/common/LoadingSpinner
 * @created    2026-08-12
 */

import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiMail, FiLock, FiLogIn } from 'react-icons/fi';

const LoginPage = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect back to the originally requested page, or default to dashboard
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    try {
      const res = await login(email, password);
      if (res && res.requiresTwoFactor) {
        navigate('/verify-2fa');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      // toast is automatically triggered by the useAuth hook
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="glass-card auth-container-card">
        <div className="auth-header">
          <span className="auth-logo-emoji">🔗</span>
          <h2>Welcome Back</h2>
          <p>Login to optimize links and review performance analytics.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="input-label-tag">Email Address</label>
            <div className="auth-input-group">
              <FiMail className="auth-input-icon" />
              <input
                type="email"
                className="form-input auth-field-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="input-label-tag">Account Password</label>
            <div className="auth-input-group">
              <FiLock className="auth-input-icon" />
              <input
                type="password"
                className="form-input auth-field-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" color="white" /> : <><FiLogIn /> Login</>}
          </button>
        </form>

        <div className="auth-footer-links">
          <p>
            Don't have an account yet? <Link to="/signup">Sign up</Link>
          </p>
        </div>
      </div>

      <style>{`
        .auth-page-wrapper {
          min-height: calc(100vh - 160px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .auth-container-card {
          max-width: 420px;
          width: 100%;
          padding: 40px 30px;
        }
        .auth-header {
          text-align: center;
          margin-bottom: 28px;
        }
        .auth-logo-emoji {
          font-size: 2.5rem;
          display: block;
          margin-bottom: 12px;
        }
        .auth-header h2 {
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 6px;
        }
        .auth-header p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.45;
        }
        .auth-input-group {
          position: relative;
          display: flex;
          align-items: center;
        }
        .auth-input-icon {
          position: absolute;
          left: 14px;
          color: var(--text-muted);
          font-size: 1.1rem;
        }
        .auth-field-input {
          padding-left: 42px;
        }
        .auth-submit-btn {
          margin-top: 10px;
          height: 48px;
        }
        .auth-footer-links {
          text-align: center;
          margin-top: 24px;
          font-size: 0.88rem;
          color: var(--text-secondary);
        }
        .auth-footer-links a {
          font-weight: 600;
          color: var(--primary);
        }
        .auth-footer-links a:hover {
          color: var(--primary-light);
        }
        .input-label-tag {
          display: block;
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
