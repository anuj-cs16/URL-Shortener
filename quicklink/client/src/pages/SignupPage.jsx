/**
 * @file       SignupPage.jsx
 * @description User registration sign up view. Matches credentials parameters
 *              and dispatches requests to auth endpoints.
 * @module     pages/SignupPage
 * @requires   react
 * @requires   hooks/useAuth
 * @requires   react-router-dom
 * @requires   react-icons/fi
 * @requires   components/common/LoadingSpinner
 * @requires   react-hot-toast
 * @created    2026-08-12
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiUser, FiMail, FiLock, FiUserPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const SignupPage = () => {
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) return;

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // errors handled by the useAuth hook globally
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="glass-card auth-container-card">
        <div className="auth-header">
          <span className="auth-logo-emoji">🔗</span>
          <h2>Create Account</h2>
          <p>Sign up to start shortening links and tracking metrics.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label className="input-label-tag">Full Name</label>
            <div className="auth-input-group">
              <FiUser className="auth-input-icon" />
              <input
                type="text"
                className="form-input auth-field-input"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

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
            <label className="input-label-tag">Choose Password</label>
            <div className="auth-input-group">
              <FiLock className="auth-input-icon" />
              <input
                type="password"
                className="form-input auth-field-input"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="input-label-tag">Confirm Password</label>
            <div className="auth-input-group">
              <FiLock className="auth-input-icon" />
              <input
                type="password"
                className="form-input auth-field-input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn" disabled={isLoading}>
            {isLoading ? <LoadingSpinner size="sm" color="white" /> : <><FiUserPlus /> Sign Up</>}
          </button>
        </form>

        <div className="auth-footer-links">
          <p>
            Already have an account? <Link to="/login">Login</Link>
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

export default SignupPage;
