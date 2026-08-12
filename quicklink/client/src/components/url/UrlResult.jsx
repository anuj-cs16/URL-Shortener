/**
 * @file       UrlResult.jsx
 * @description Result card displaying the newly generated short link,
 *              base64 QR Code download action, and copy shortcuts.
 * @module     components/url/UrlResult
 * @requires   react
 * @requires   react-copy-to-clipboard
 * @requires   react-icons/fi
 * @requires   framer-motion
 * @created    2026-08-12
 */

import React, { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { motion } from 'framer-motion';
import { FiCopy, FiCheck, FiDownload, FiExternalLink, FiBarChart2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const UrlResult = ({ urlData }) => {
  const { shortUrl, longUrl, shortCode, qrCode, expiresAt } = urlData;
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copied]);

  const handleDownloadQr = () => {
    if (!qrCode) return;
    const link = document.createElement('a');
    link.href = qrCode;
    link.download = `qrcode_${shortCode}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formattedExpiry = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      className="result-card-container glass-card"
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="result-layout">
        {/* Left Section: Details */}
        <div className="result-details">
          <div className="success-badge-title">🎉 Link shortened successfully!</div>
          
          <div className="result-short-url-row">
            <span className="result-short-url-txt">{shortUrl}</span>
            <CopyToClipboard text={shortUrl} onCopy={() => setCopied(true)}>
              <button
                className={`btn copy-badge-btn ${copied ? 'copied-active' : ''}`}
                title="Copy short link"
              >
                {copied ? (
                  <>
                    <FiCheck /> Copied!
                  </>
                ) : (
                  <>
                    <FiCopy /> Copy
                  </>
                )}
              </button>
            </CopyToClipboard>
          </div>

          <p className="original-link-preview">
            Original: <a href={longUrl} target="_blank" rel="noopener noreferrer">{longUrl}</a>
          </p>

          <p className="expiry-preview-txt">
            Expires on: <span className="highlight-date">{formattedExpiry}</span> (7 days TTL)
          </p>

          <div className="result-action-links">
            <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline result-action-btn">
              <FiExternalLink /> Visit Link
            </a>
            <Link to={`/analytics/${shortCode}`} className="btn btn-outline result-action-btn" style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}>
              <FiBarChart2 /> View Analytics
            </Link>
          </div>
        </div>

        {/* Right Section: QR Code Code */}
        {qrCode && (
          <div className="result-qr-code-section">
            <div className="qr-wrapper">
              <img src={qrCode} alt="QR Code Link" className="qr-image" />
            </div>
            <button className="btn btn-outline qr-download-btn" onClick={handleDownloadQr}>
              <FiDownload /> Download QR
            </button>
          </div>
        )}
      </div>

      <style>{`
        .result-card-container {
          border-left: 4px solid var(--success);
          background: rgba(76, 175, 80, 0.03);
          margin-top: 24px;
        }
        .result-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .success-badge-title {
          font-weight: 700;
          font-size: 1.15rem;
          color: var(--success);
          margin-bottom: 14px;
        }
        .result-short-url-row {
          display: flex;
          align-items: center;
          background-color: rgba(15, 15, 26, 0.7);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 8px 12px;
          margin-bottom: 12px;
          justify-content: space-between;
          gap: 12px;
        }
        .result-short-url-txt {
          font-size: 1.1rem;
          font-weight: 700;
          color: var(--secondary);
          word-break: break-all;
        }
        .copy-badge-btn {
          height: 36px;
          padding: 0 16px;
          font-size: 0.85rem;
          background-color: var(--primary);
          color: white;
          flex-shrink: 0;
        }
        .copy-badge-btn:hover {
          background-color: var(--primary-dark);
        }
        .copied-active {
          background-color: var(--success) !important;
        }
        .original-link-preview {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 8px;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          max-width: 100%;
        }
        .original-link-preview a {
          color: var(--text-muted);
        }
        .expiry-preview-txt {
          font-size: 0.82rem;
          color: var(--text-muted);
          margin-bottom: 20px;
        }
        .highlight-date {
          color: var(--text-secondary);
          font-weight: 500;
        }
        .result-action-links {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        .result-action-btn {
          height: 38px;
          font-size: 0.85rem;
          padding: 0 16px;
        }
        .result-qr-code-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .qr-wrapper {
          background: white;
          padding: 8px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: var(--shadow-card);
        }
        .qr-image {
          width: 120px;
          height: 120px;
          display: block;
        }
        .qr-download-btn {
          height: 34px;
          font-size: 0.8rem;
          padding: 0 14px;
          width: 100%;
        }

        @media (min-width: 768px) {
          .result-layout {
            flex-direction: row;
            justify-content: space-between;
          }
          .result-details {
            flex: 1;
          }
          .result-qr-code-section {
            width: 140px;
            flex-shrink: 0;
            border-left: 1px solid var(--border);
            padding-left: 24px;
          }
        }
      `}</style>
    </motion.div>
  );
};

export default UrlResult;
