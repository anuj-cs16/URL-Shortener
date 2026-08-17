/**
 * @file       UrlTableRow.jsx
 * @description List entry showing link metadata (clicks count, creation timestamp)
 *              and action anchors. Binds copy buttons and deletion modals.
 * @module     components/url/UrlTableRow
 * @requires   react
 * @requires   react-icons/fi
 * @requires   react-router-dom
 * @requires   react-copy-to-clipboard
 * @requires   framer-motion
 * @created    2026-08-12
 */

import React, { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { Link } from 'react-router-dom';
import { FiCopy, FiCheck, FiTrash2, FiBarChart2, FiClock } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';

const UrlTableRow = ({ url, onDelete, isMobile = false }) => {
  const { shortCode, longUrl, clicks, expiresAt, shortUrl } = url;
  const [copied, setCopied] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  const handleDelete = () => {
    onDelete(shortCode);
    setShowConfirm(false);
  };

  const formattedExpiry = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const truncatedLongUrl = longUrl.length > 40 ? `${longUrl.substring(0, 37)}...` : longUrl;

  if (isMobile) {
    return (
      <div className="url-mobile-card glass-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div>
            <p className="card-lbl">Original URL</p>
            <p className="card-val-long" title={longUrl}>
              <a href={longUrl} target="_blank" rel="noopener noreferrer">{truncatedLongUrl}</a>
            </p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p className="card-lbl">Shortened URL</p>
              <p className="card-val-short">{shortUrl}</p>
            </div>
            <CopyToClipboard text={shortUrl} onCopy={() => setCopied(true)}>
              <button className={`mobile-action-copy-btn ${copied ? 'copy-success' : ''}`}>
                {copied ? <FiCheck /> : <FiCopy />}
              </button>
            </CopyToClipboard>
          </div>
          <div className="card-meta-row">
            <div>
              <span className="meta-lbl">Clicks:</span>
              <span className="clicks-badge">{clicks}</span>
            </div>
            <div>
              <span className="meta-lbl">Expires:</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{formattedExpiry}</span>
            </div>
          </div>

          <div className="card-actions-row">
            <Link to={`/analytics/${shortCode}`} className="btn btn-outline card-action-btn">
              <FiBarChart2 /> Analytics
            </Link>
            <button className="btn btn-outline card-action-btn btn-delete-danger" onClick={() => setShowConfirm(true)}>
              <FiTrash2 /> Delete
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        <AnimatePresence>
          {showConfirm && (
            <div className="modal-overlay">
              <motion.div
                className="modal-box"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this shortened URL? This action cannot be undone.</p>
                <div className="modal-actions">
                  <button className="btn btn-outline" style={{ height: '34px' }} onClick={() => setShowConfirm(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ height: '34px', background: 'var(--error)' }} onClick={handleDelete}>Delete</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <style>{`
          .url-mobile-card {
            padding: 16px;
            border-radius: var(--radius-md);
            position: relative;
          }
          .card-lbl {
            font-size: 0.72rem;
            color: var(--text-muted);
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 2px;
          }
          .card-val-long {
            font-size: 0.88rem;
            font-weight: 500;
            word-break: break-all;
          }
          .card-val-long a {
            color: var(--text-secondary);
          }
          .card-val-short {
            font-size: 0.92rem;
            font-weight: 700;
            color: var(--secondary);
          }
          .mobile-action-copy-btn {
            background: var(--border);
            border: none;
            color: var(--text-secondary);
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: var(--transition);
          }
          .mobile-action-copy-btn:hover {
            color: white;
            background: var(--primary);
          }
          .copy-success {
            background-color: var(--success) !important;
            color: white !important;
          }
          .card-meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid var(--border);
            border-bottom: 1px solid var(--border);
            padding: 10px 0;
            margin: 6px 0;
          }
          .meta-lbl {
            font-size: 0.8rem;
            color: var(--text-muted);
            margin-right: 6px;
          }
          .clicks-badge {
            background: var(--primary-light);
            color: var(--primary);
            padding: 2px 8px;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 700;
          }
          .card-actions-row {
            display: flex;
            gap: 10px;
            margin-top: 6px;
          }
          .card-action-btn {
            flex: 1;
            height: 36px;
            font-size: 0.8rem;
          }
          .btn-delete-danger:hover {
            background-color: var(--error-bg);
            color: var(--error);
            border-color: var(--error);
          }
          
          /* Modal styling */
          .modal-overlay {
            position: fixed;
            inset: 0;
            background-color: rgba(0, 0, 0, 0.6);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 200;
          }
          .modal-box {
            background: #16213E;
            border: 1px solid var(--border);
            border-radius: var(--radius-md);
            padding: 20px;
            max-width: 400px;
            width: 100%;
            text-align: center;
          }
          .modal-box h4 {
            font-size: 1.1rem;
            margin-bottom: 10px;
          }
          .modal-box p {
            font-size: 0.85rem;
            color: var(--text-secondary);
            margin-bottom: 20px;
          }
          .modal-actions {
            display: flex;
            justify-content: center;
            gap: 12px;
          }
        `}</style>
      </div>
    );
  }

  return (
    <tr className="url-tr-row">
      {/* Original link */}
      <td style={{ padding: '14px 16px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        <a href={longUrl} target="_blank" rel="noopener noreferrer" className="original-url-lnk" title={longUrl}>
          {truncatedLongUrl}
        </a>
      </td>

      {/* Short Link */}
      <td style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="short-url-txt">{shortUrl}</span>
          <CopyToClipboard text={shortUrl} onCopy={() => setCopied(true)}>
            <button className={`copy-table-btn ${copied ? 'copy-success' : ''}`} title="Copy short link">
              {copied ? <FiCheck /> : <FiCopy />}
            </button>
          </CopyToClipboard>
        </div>
      </td>

      {/* Click Badge */}
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        <span className="clicks-badge">{clicks}</span>
      </td>

      {/* Expiry Date */}
      <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FiClock style={{ color: 'var(--text-muted)' }} />
          {formattedExpiry}
        </div>
      </td>

      {/* Actions */}
      <td style={{ padding: '14px 16px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
          <Link to={`/analytics/${shortCode}`} className="action-btn-table" title="View analytics">
            <FiBarChart2 />
          </Link>
          <button className="action-btn-table action-btn-delete" title="Delete URL" onClick={() => setShowConfirm(true)}>
            <FiTrash2 />
          </button>
        </div>

        {/* Delete Confirmation Modal Overlay */}
        <AnimatePresence>
          {showConfirm && (
            <div className="modal-overlay">
              <motion.div
                className="modal-box"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
              >
                <h4>Confirm Deletion</h4>
                <p>Are you sure you want to delete this shortened URL? This action cannot be undone.</p>
                <div className="modal-actions">
                  <button className="btn btn-outline" style={{ height: '34px' }} onClick={() => setShowConfirm(false)}>Cancel</button>
                  <button className="btn btn-primary" style={{ height: '34px', background: 'var(--error)' }} onClick={handleDelete}>Delete</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </td>

      <style>{`
        .url-tr-row:hover {
          background-color: rgba(255, 255, 255, 0.01);
        }
        .original-url-lnk {
          color: var(--text-secondary);
          transition: var(--transition);
        }
        .original-url-lnk:hover {
          color: white;
        }
        .short-url-txt {
          font-weight: 700;
          color: var(--secondary);
          font-size: 0.92rem;
        }
        .copy-table-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 0.85rem;
          transition: var(--transition);
          display: flex;
          align-items: center;
        }
        .copy-table-btn:hover {
          color: white;
        }
        .action-btn-table {
          background: var(--border);
          border: none;
          color: var(--text-secondary);
          width: 32px;
          height: 32px;
          border-radius: var(--radius-sm);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }
        .action-btn-table:hover {
          background-color: var(--primary-light);
          color: white;
        }
        .action-btn-delete:hover {
          background-color: var(--error-bg);
          color: var(--error);
        }
      `}</style>
    </tr>
  );
};

export default UrlTableRow;
