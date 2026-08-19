/**
 * @file       UrlForm.jsx
 * @description URL shortening input form. Toggles custom code input slide-downs,
 *              executes validations, and binds paste clipboard shortcuts.
 * @module     components/url/UrlForm
 * @requires   react
 * @requires   react-icons/fi
 * @requires   framer-motion
 * @created    2026-08-12
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLink, FiClipboard, FiZap, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import LoadingSpinner from '../common/LoadingSpinner';
import UpgradePrompt from '../subscription/UpgradePrompt';

const UrlForm = ({ onSubmit, isLoading, planId = 'free', urlsCreated = 0, urlsLimit = 10 }) => {
  const [longUrl, setLongUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [error, setError] = useState('');

  const isFree = planId === 'free';

  // Checks URL format protocol
  const validateInputUrl = (url) => {
    if (!url) return 'URL cannot be empty';
    try {
      new URL(url);
      return '';
    } catch (_) {
      return 'Please enter a valid URL (include http:// or https://)';
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlValidation = validateInputUrl(longUrl);
    if (urlValidation) {
      setError(urlValidation);
      return;
    }
    setError('');
    onSubmit(longUrl, showCustom && !isFree ? customCode : '');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setLongUrl(text);
        setError('');
      }
    } catch (e) {
      console.warn('Clipboard read permission denied.');
    }
  };

  return (
    <form className="url-form-card glass-card" onSubmit={handleSubmit}>
      <div className="url-input-group">
        <div className="input-prefix-icon">
          <FiLink />
        </div>
        <input
          type="text"
          className={`form-input url-field-input ${error ? 'input-error-border' : ''}`}
          placeholder="Paste a link to shorten (e.g., https://example.com/long-path)..."
          value={longUrl}
          onChange={(e) => {
            setLongUrl(e.target.value);
            if (error) setError('');
          }}
          disabled={isLoading}
        />
        <button
          type="button"
          className="paste-icon-btn"
          onClick={handlePaste}
          title="Paste from clipboard"
          disabled={isLoading}
        >
          <FiClipboard />
        </button>
      </div>

      <AnimatePresence>
        {error && (
          <motion.p
            className="input-error-msg"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Custom Short Code Toggle Link */}
      <div style={{ marginTop: '16px' }}>
        <button
          type="button"
          className="toggle-custom-btn"
          onClick={() => setShowCustom(!showCustom)}
          disabled={isLoading}
        >
          {showCustom ? <FiChevronUp /> : <FiChevronDown />}
          <span>Configure Custom Short Code Alias {isFree && '🔒'}</span>
        </button>
      </div>

      <AnimatePresence>
        {showCustom && (
          <motion.div
            className="custom-code-container"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div style={{ paddingTop: '12px' }}>
              {isFree ? (
                <div style={{ padding: '8px 0' }}>
                  <UpgradePrompt
                    feature="Custom Short Codes"
                    requiredPlan="Pro"
                    message="Custom short code aliases are a premium feature. Upgrade to a paid plan to use them."
                  />
                </div>
              ) : (
                <>
                  <label className="input-label-tag">Custom Alias (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., my-campaign-link"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ''))}
                    disabled={isLoading}
                  />
                  <span className="input-hint-info">Letters, numbers, hyphens, and underscores only.</span>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {urlsLimit !== -1 && (
        <div className="url-form-usage-hint" style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
          💡 {urlsCreated} of {urlsLimit} URLs used this month
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <button
          type="submit"
          className="btn btn-primary shorten-action-btn"
          disabled={isLoading || !longUrl}
          style={{ width: '100%' }}
        >
          {isLoading ? (
            <LoadingSpinner size="sm" color="white" />
          ) : (
            <>
              <FiZap /> Shorten URL
            </>
          )}
        </button>
      </div>

      <style>{`
        .url-form-card {
          margin-bottom: 24px;
        }
        .url-input-group {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-prefix-icon {
          position: absolute;
          left: 16px;
          color: var(--text-muted);
          font-size: 1.15rem;
          display: flex;
          align-items: center;
        }
        .url-field-input {
          padding-left: 46px;
          padding-right: 46px;
          height: 52px;
        }
        .input-error-border {
          border-color: var(--error);
        }
        .input-error-border:focus {
          box-shadow: 0 0 0 3px var(--error-bg);
          border-color: var(--error);
        }
        .paste-icon-btn {
          position: absolute;
          right: 14px;
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.15rem;
          display: flex;
          align-items: center;
          transition: var(--transition);
        }
        .paste-icon-btn:hover {
          color: white;
        }
        .input-error-msg {
          color: var(--error);
          font-size: 0.82rem;
          margin-top: 6px;
          padding-left: 4px;
        }
        .toggle-custom-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.88rem;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 0;
          transition: var(--transition);
        }
        .toggle-custom-btn:hover {
          color: white;
        }
        .custom-code-container {
          overflow: hidden;
        }
        .input-label-tag {
          display: block;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        .input-hint-info {
          display: block;
          font-size: 0.78rem;
          color: var(--text-muted);
          margin-top: 4px;
        }
        .shorten-action-btn {
          height: 50px;
        }
      `}</style>
    </form>
  );
};

export default UrlForm;
