/**
 * @file       SecurityPage.jsx
 * @description Account security page managing multi-factor settings, session terminations, and security logs.
 * @module     pages/SecurityPage
 */

import React, { useState, useEffect } from 'react';
import { useSecurity } from '../hooks/useSecurity';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  FiShield,
  FiMonitor,
  FiClock,
  FiAlertTriangle,
  FiActivity,
  FiGlobe,
  FiCheckCircle,
  FiCopy,
  FiDownload,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const SecurityPage = () => {
  const {
    loading,
    overview,
    activities,
    totalActivities,
    activityPages,
    sessions,
    fetchOverview,
    fetchActivities,
    fetchSessions,
    setup2FA,
    enable2FA,
    disable2FA,
    regenerateBackupCodes,
    reportSuspicious,
    terminateSessions
  } = useSecurity();

  // Component states
  const [currentPage, setCurrentPage] = useState(1);
  const [activityFilter, setActivityFilter] = useState('all');
  
  // 2FA Setup Flow State
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [setupStep, setSetupStep] = useState(1); // 1 = QR & Secret, 2 = Backup Codes
  const [setupSecret, setSetupSecret] = useState('');
  const [setupQrCode, setSetupQrCode] = useState('');
  const [totpToken, setTotpToken] = useState('');
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState([]);

  // 2FA Management Modal State
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [showSessionsModal, setShowSessionsModal] = useState(false);
  const [showBackupViewModal, setShowBackupViewModal] = useState(false);

  // Verification prompts inputs
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmToken, setConfirmToken] = useState('');
  const [viewedBackupStats, setViewedBackupStats] = useState(null);

  // Load initial data
  useEffect(() => {
    fetchOverview();
    fetchSessions();
    fetchActivities(currentPage, 10, activityFilter);
  }, [fetchOverview, fetchSessions, fetchActivities, currentPage, activityFilter]);

  // Handle 2FA initiation
  const handleStartSetup = async () => {
    try {
      const data = await setup2FA();
      setSetupSecret(data.secret);
      setSetupQrCode(data.qrCode);
      setSetupStep(1);
      setShowSetupModal(true);
    } catch (e) {
      // toast shown by hook
    }
  };

  // Handle 2FA verification submission
  const handleVerifySetup = async (e) => {
    e.preventDefault();
    if (!totpToken) return;
    try {
      const data = await enable2FA(totpToken, setupSecret);
      setGeneratedBackupCodes(data.backupCodes);
      setSetupStep(2);
    } catch (e) {}
  };

  // Handle 2FA disable submission
  const handleDisable2FA = async (e) => {
    e.preventDefault();
    try {
      await disable2FA(confirmPassword, confirmToken);
      setShowDisableModal(false);
      setConfirmPassword('');
      setConfirmToken('');
    } catch (e) {}
  };

  // Handle backup codes regeneration submission
  const handleRegenerateBackup = async (e) => {
    e.preventDefault();
    try {
      const data = await regenerateBackupCodes(confirmToken);
      setGeneratedBackupCodes(data.backupCodes);
      setShowRegenModal(false);
      setConfirmToken('');
      setSetupStep(2);
      setShowSetupModal(true); // Reuse modal step 2 to show new codes
    } catch (e) {}
  };

  // Handle backup codes stats query
  const handleViewBackupStats = async (e) => {
    e.preventDefault();
    try {
      const securityApi = require('../api/securityApi');
      const res = await securityApi.getBackupCodes(confirmPassword);
      if (res.success) {
        setViewedBackupStats(res.data);
        setShowBackupViewModal(true);
        setShowDisableModal(false);
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Verification failed');
    }
  };

  // Handle session terminations
  const handleTerminateSessions = async (e) => {
    e.preventDefault();
    try {
      await terminateSessions(confirmPassword);
      setShowSessionsModal(false);
      setConfirmPassword('');
    } catch (e) {}
  };

  // Copy helper
  const handleCopyCodes = () => {
    const text = generatedBackupCodes.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Backup codes copied to clipboard!');
  };

  // Download helper
  const handleDownloadCodes = () => {
    const text = `QUICKLINK BACKUP CODES\nSaved: ${new Date().toLocaleString()}\n\n` + generatedBackupCodes.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quicklink-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup codes downloaded!');
  };

  const getScoreColorClass = (score) => {
    if (score >= 80) return 'text-success';
    if (score >= 50) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="security-container page-container">
      <div className="security-header-section">
        <h1>Account Security</h1>
        <p>Monitor profiles status, secure access channels, and audit device activity logs.</p>
      </div>

      {loading && !overview ? (
        <div className="loading-centered">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <div className="security-grid-layout">
          {/* COLUMN 1: Score & Status Overview */}
          <div className="security-col-left">
            {/* Score Card */}
            {overview && (
              <div className="glass-card security-score-card">
                <h3>Security Profile Score</h3>
                <div className="score-circle-wrapper">
                  <svg className="progress-ring" width="120" height="120">
                    <circle className="progress-ring-bg" stroke="#1f293d" strokeWidth="8" fill="transparent" r="50" cx="60" cy="60" />
                    <circle
                      className="progress-ring-fill"
                      stroke={overview.securityScore >= 80 ? 'var(--success)' : overview.securityScore >= 50 ? 'var(--warning)' : 'var(--error)'}
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 50}
                      strokeDashoffset={2 * Math.PI * 50 * (1 - overview.securityScore / 100)}
                      strokeLinecap="round"
                      fill="transparent"
                      r="50"
                      cx="60"
                      cy="60"
                    />
                  </svg>
                  <div className="score-number-label">
                    <span className={`score-value ${getScoreColorClass(overview.securityScore)}`}>
                      {overview.securityScore}
                    </span>
                    <span className="score-max">/100</span>
                  </div>
                </div>
                <p className="score-status-text">
                  Your profile security level is{' '}
                  <strong>
                    {overview.securityScore >= 80 ? 'Excellent' : overview.securityScore >= 50 ? 'Moderate' : 'Critical'}
                  </strong>
                  .
                </p>
              </div>
            )}

            {/* Recommendations Card */}
            {overview && (
              <div className="glass-card recommendations-card">
                <h3>Recommendations</h3>
                <div className="rec-list">
                  {overview.recommendations.map((rec) => (
                    <div key={rec.id} className={`rec-item ${rec.completed ? 'completed' : 'pending'}`}>
                      <div className="rec-icon-wrapper">
                        {rec.completed ? <FiCheckCircle className="text-success" /> : <FiAlertTriangle className="text-warning" />}
                      </div>
                      <div className="rec-details">
                        <h4>{rec.action}</h4>
                        <p>{rec.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 2: 2FA & Session controls */}
          <div className="security-col-right">
            {/* 2FA Card */}
            {overview && (
              <div className="glass-card settings-card">
                <div className="card-header-icon-title">
                  <FiShield className="card-icon" />
                  <div>
                    <h3>Two-Factor Authentication (2FA)</h3>
                    <p>Protect account access by verifying secondary authenticator OTP tokens.</p>
                  </div>
                </div>

                <div className="mfa-status-banner">
                  {overview.twoFactorEnabled ? (
                    <div className="status-badge enabled">
                      <span className="dot"></span> 2FA is Enabled
                    </div>
                  ) : (
                    <div className="status-badge disabled">
                      <span className="dot"></span> 2FA is Disabled
                    </div>
                  )}
                </div>

                <div className="action-buttons-group">
                  {!overview.twoFactorEnabled ? (
                    <button onClick={handleStartSetup} className="btn btn-primary">
                      Setup Authenticator
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <button onClick={() => setShowDisableModal(true)} className="btn btn-danger-outline">
                        Disable 2FA
                      </button>
                      <button onClick={() => setShowRegenModal(true)} className="btn btn-secondary-outline">
                        Regenerate Backup Codes
                      </button>
                      <button onClick={() => setShowDisableModal(true)} className="btn btn-secondary">
                        View Backup Stats
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Sessions Card */}
            <div className="glass-card settings-card">
              <div className="card-header-icon-title">
                <FiMonitor className="card-icon" />
                <div>
                  <h3>Active Device Sessions</h3>
                  <p>Audit unique login browsers and close secondary tokens.</p>
                </div>
              </div>

              <div className="sessions-list-wrapper">
                {sessions.map((sess, idx) => (
                  <div key={idx} className="session-item-row">
                    <div className="session-icon">
                      <FiMonitor size={20} />
                    </div>
                    <div className="session-desc">
                      <h4>
                        {sess.browser} on {sess.operatingSystem || 'Unknown'} {sess.isCurrent && <span className="current-badge">Current</span>}
                      </h4>
                      <p>
                        <FiGlobe size={12} /> {sess.ipAddress} • {sess.city}, {sess.country}
                      </p>
                      <p className="session-time">
                        <FiClock size={12} /> Last active: {new Date(sess.lastActive).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {sessions.length > 1 && (
                <button onClick={() => setShowSessionsModal(true)} className="btn btn-danger-outline btn-full-width">
                  Terminate All Other Sessions
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: Activity Logs Table */}
      <div className="glass-card logs-table-card">
        <div className="table-header-row">
          <div className="table-header-title">
            <FiActivity className="header-icon" />
            <div>
              <h3>Security & Auditing Logs</h3>
              <p>Review account profile state modifications and authentication events.</p>
            </div>
          </div>
          <div className="filter-select-group">
            <label>Logs filter:</label>
            <select
              value={activityFilter}
              onChange={(e) => {
                setActivityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="form-input"
            >
              <option value="all">All Events</option>
              <option value="login_success">Successful Logins</option>
              <option value="login_failed">Failed Logins</option>
              <option value="suspicious">Suspicious Flags</option>
            </select>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="logs-table">
            <thead>
              <tr>
                <th>Event Type</th>
                <th>Date & Time</th>
                <th>IP Address</th>
                <th>Location</th>
                <th>Browser & OS</th>
                <th>Risk Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {activities.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-cell">No security events found.</td>
                </tr>
              ) : (
                activities.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <span className={`event-badge ${log.activityType}`}>
                        {log.activityType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>{log.ipAddress}</td>
                    <td>{log.city || 'Unknown'}, {log.country || 'Unknown'}</td>
                    <td>{log.browser} • {log.operatingSystem}</td>
                    <td>
                      {log.isSuspicious ? (
                        <span className="risk-badge suspicious" title={log.suspiciousReason}>Suspicious ⚠️</span>
                      ) : (
                        <span className="risk-badge safe">Standard 🟢</span>
                      )}
                    </td>
                    <td>
                      {!log.isSuspicious && log.activityType === 'login_success' && (
                        <button
                          onClick={() => reportSuspicious(log._id)}
                          className="report-suspicious-btn"
                          title="Report this login event as unauthorized"
                        >
                          Report Suspicious
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {activityPages > 1 && (
          <div className="table-pagination">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <FiChevronLeft /> Prev
            </button>
            <span className="pagination-text">
              Page {currentPage} of {activityPages} ({totalActivities} logs)
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(activityPages, p + 1))}
              disabled={currentPage === activityPages}
              className="pagination-btn"
            >
              Next <FiChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* MODALS RENDER SECTION */}

      {/* 2FA SETUP MODAL */}
      {showSetupModal && (
        <div className="modal-backdrop-overlay">
          <div className="glass-card modal-container-card">
            {setupStep === 1 ? (
              <div>
                <h2>Setup Authenticator</h2>
                <p className="modal-lead">Scan this QR code using Google Authenticator, Duo, or similar app.</p>

                <div className="qr-container">
                  {setupQrCode ? (
                    <img src={setupQrCode} alt="TOTP QR Code" className="qr-code-img" />
                  ) : (
                    <LoadingSpinner />
                  )}
                </div>

                <div className="secret-raw-entry">
                  <label>Manual Entry Code:</label>
                  <div className="raw-code-box">
                    <code>{setupSecret}</code>
                  </div>
                </div>

                <form onSubmit={handleVerifySetup} className="mfa-verify-form">
                  <label>Enter 6-Digit Code:</label>
                  <input
                    type="text"
                    maxLength="6"
                    className="form-input code-verify-field"
                    placeholder="123456"
                    value={totpToken}
                    onChange={(e) => setTotpToken(e.target.value)}
                    required
                  />
                  <div className="modal-actions">
                    <button type="button" onClick={() => setShowSetupModal(false)} className="btn btn-secondary">
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Verify & Enable
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div>
                <h2 className="text-success">2FA Setup Complete! 🎉</h2>
                <p className="modal-lead">
                  Write down these backup codes. You will need them if you lose access to your authenticator app.
                  <strong> They are shown only once!</strong>
                </p>

                <div className="backup-codes-grid">
                  {generatedBackupCodes.map((code, idx) => (
                    <div key={idx} className="backup-code-item">
                      <code>{code}</code>
                    </div>
                  ))}
                </div>

                <div className="backup-actions">
                  <button onClick={handleCopyCodes} className="btn btn-secondary-outline">
                    <FiCopy /> Copy Codes
                  </button>
                  <button onClick={handleDownloadCodes} className="btn btn-secondary-outline">
                    <FiDownload /> Download Text
                  </button>
                </div>

                <div className="modal-actions" style={{ marginTop: '24px' }}>
                  <button
                    onClick={() => {
                      setShowSetupModal(false);
                      setGeneratedBackupCodes([]);
                    }}
                    className="btn btn-primary btn-full-width"
                  >
                    I have saved my backup codes
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DISABLE 2FA / VIEW BACKUP STATS CONFIRMATION MODAL */}
      {showDisableModal && (
        <div className="modal-backdrop-overlay">
          <div className="glass-card modal-container-card">
            <h2>Verify Account Password</h2>
            <p className="modal-lead">Enter password to proceed.</p>

            <form onSubmit={confirmToken ? handleDisable2FA : handleViewBackupStats} className="mfa-verify-form">
              <div className="form-group-item">
                <label>Account Password:</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              {confirmToken !== undefined && (
                <div className="form-group-item" style={{ marginTop: '12px' }}>
                  <label>Authenticator Code (needed to Disable):</label>
                  <input
                    type="text"
                    maxLength="6"
                    className="form-input"
                    placeholder="123456"
                    value={confirmToken}
                    onChange={(e) => setConfirmToken(e.target.value)}
                  />
                </div>
              )}

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDisableModal(false);
                    setConfirmPassword('');
                    setConfirmToken('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Proceed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REGENERATE BACKUP CODES CONFIRMATION MODAL */}
      {showRegenModal && (
        <div className="modal-backdrop-overlay">
          <div className="glass-card modal-container-card">
            <h2>Regenerate Backup Codes</h2>
            <p className="modal-lead">
              Enter your authenticator token to invalidate old backup codes and create new ones.
            </p>

            <form onSubmit={handleRegenerateBackup} className="mfa-verify-form">
              <div className="form-group-item">
                <label>6-Digit Authenticator Token:</label>
                <input
                  type="text"
                  maxLength="6"
                  className="form-input"
                  placeholder="123456"
                  value={confirmToken}
                  onChange={(e) => setConfirmToken(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegenModal(false);
                    setConfirmToken('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Regenerate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW BACKUP STATS VIEW MODAL */}
      {showBackupViewModal && viewedBackupStats && (
        <div className="modal-backdrop-overlay">
          <div className="glass-card modal-container-card">
            <h2>Backup Codes Metadata</h2>
            <p className="modal-lead">Status parameters of backup recovery codes.</p>

            <div className="stats-list-box" style={{ margin: '16px 0', padding: '16px', borderRadius: '8px', background: 'rgba(255,255,255,0.03)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div><strong>Remaining Codes:</strong> {viewedBackupStats.remainingCodes}</div>
              <div><strong>Used Codes:</strong> {viewedBackupStats.usedCodes}</div>
              <div><strong>Total Issued:</strong> {viewedBackupStats.remainingCodes + viewedBackupStats.usedCodes}</div>
            </div>

            <div className="modal-actions">
              <button onClick={() => { setShowBackupViewModal(false); setViewedBackupStats(null); }} className="btn btn-primary btn-full-width">
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TERMINATE SESSIONS PASSWORD PROMPT */}
      {showSessionsModal && (
        <div className="modal-backdrop-overlay">
          <div className="glass-card modal-container-card">
            <h2>Terminate All Other Sessions</h2>
            <p className="modal-lead">Enter account password to invalidate secondary session keys.</p>

            <form onSubmit={handleTerminateSessions} className="mfa-verify-form">
              <div className="form-group-item">
                <label>Account Password:</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div className="modal-actions" style={{ marginTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowSessionsModal(false);
                    setConfirmPassword('');
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-danger">
                  Terminate All
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Local view styles */}
      <style>{`
        .security-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }
        .security-header-section {
          margin-bottom: 32px;
        }
        .security-header-section h1 {
          font-size: 2.2rem;
          font-weight: 700;
          color: #fff;
          margin-bottom: 8px;
        }
        .security-header-section p {
          color: var(--text-muted);
        }
        .security-grid-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 32px;
        }
        @media (max-width: 900px) {
          .security-grid-layout {
            grid-template-columns: 1fr;
          }
        }
        .security-col-left, .security-col-right {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .security-score-card {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 32px;
        }
        .score-circle-wrapper {
          position: relative;
          width: 120px;
          height: 120px;
          margin: 24px 0;
        }
        .progress-ring-fill {
          transform: rotate(-90deg);
          transform-origin: 50% 50%;
          transition: stroke-dashoffset 0.35s;
        }
        .score-number-label {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: baseline;
        }
        .score-value {
          font-size: 2.2rem;
          font-weight: 800;
        }
        .score-max {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-left: 2px;
        }
        .rec-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-top: 16px;
        }
        .rec-item {
          display: flex;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .rec-icon-wrapper {
          font-size: 1.2rem;
          margin-top: 2px;
        }
        .rec-details h4 {
          font-size: 0.95rem;
          color: #fff;
          margin-bottom: 4px;
        }
        .rec-details p {
          font-size: 0.82rem;
          color: var(--text-muted);
        }
        .card-header-icon-title {
          display: flex;
          gap: 16px;
          margin-bottom: 20px;
        }
        .card-icon {
          font-size: 2rem;
          color: var(--primary);
          margin-top: 4px;
        }
        .mfa-status-banner {
          margin-bottom: 24px;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 50px;
          font-size: 0.88rem;
          font-weight: 600;
        }
        .status-badge.enabled {
          background: rgba(46, 204, 113, 0.1);
          color: var(--success);
        }
        .status-badge.enabled .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--success);
        }
        .status-badge.disabled {
          background: rgba(231, 76, 60, 0.1);
          color: var(--error);
        }
        .status-badge.disabled .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--error);
        }
        .sessions-list-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin: 16px 0;
          max-height: 250px;
          overflow-y: auto;
        }
        .session-item-row {
          display: flex;
          gap: 16px;
          padding: 12px;
          border-radius: 8px;
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.05);
        }
        .session-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
        }
        .session-desc h4 {
          font-size: 0.95rem;
          color: #fff;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .current-badge {
          background: rgba(52, 152, 219, 0.15);
          color: var(--primary);
          font-size: 0.72rem;
          padding: 2px 6px;
          border-radius: 4px;
        }
        .session-desc p {
          font-size: 0.82rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 2px;
        }
        .session-time {
          font-size: 0.76rem !important;
          opacity: 0.8;
        }
        .table-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }
        .table-header-title {
          display: flex;
          gap: 16px;
        }
        .header-icon {
          font-size: 2.2rem;
          color: var(--primary);
          margin-top: 4px;
        }
        .filter-select-group {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .filter-select-group select {
          padding: 8px 12px;
          background: #121b2d;
          border: 1px solid var(--border);
          border-radius: 6px;
          color: #fff;
        }
        .logs-table {
          width: 100%;
          border-collapse: collapse;
        }
        .logs-table th, .logs-table td {
          padding: 12px 16px;
          text-align: left;
          font-size: 0.88rem;
          border-bottom: 1px solid var(--border);
        }
        .logs-table th {
          color: var(--text-muted);
          font-weight: 600;
        }
        .logs-table tr:hover {
          background: rgba(255,255,255,0.01);
        }
        .event-badge {
          font-size: 0.76rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: capitalize;
          display: inline-block;
        }
        .event-badge.login_success { background: rgba(46,204,113,0.15); color: var(--success); }
        .event-badge.login_failed { background: rgba(231,76,60,0.15); color: var(--error); }
        .event-badge.logout { background: rgba(255,255,255,0.08); color: var(--text-muted); }
        .event-badge.password_changed { background: rgba(155,89,182,0.15); color: #9b59b6; }
        .event-badge.two_factor_enabled { background: rgba(52,152,219,0.15); color: var(--primary); }
        .event-badge.two_factor_disabled { background: rgba(230,126,34,0.15); color: #e67e22; }
        .risk-badge {
          font-size: 0.78rem;
          font-weight: 600;
        }
        .risk-badge.suspicious {
          color: var(--warning);
        }
        .risk-badge.safe {
          color: var(--success);
        }
        .report-suspicious-btn {
          background: none;
          border: none;
          color: var(--error);
          font-size: 0.8rem;
          cursor: pointer;
        }
        .report-suspicious-btn:hover {
          text-decoration: underline;
        }
        .table-pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 20px;
        }
        .pagination-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 6px;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border);
          color: #fff;
          cursor: pointer;
          font-size: 0.82rem;
        }
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .pagination-text {
          font-size: 0.82rem;
          color: var(--text-muted);
        }
        /* Modals style */
        .modal-backdrop-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .modal-container-card {
          width: 100%;
          max-width: 480px;
          padding: 32px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
        }
        .modal-lead {
          color: var(--text-muted);
          font-size: 0.9rem;
          margin-bottom: 24px;
        }
        .qr-container {
          display: flex;
          justify-content: center;
          margin: 20px 0;
          padding: 16px;
          background: #fff;
          border-radius: 8px;
          max-width: 200px;
          margin-left: auto;
          margin-right: auto;
        }
        .qr-code-img {
          width: 100%;
          height: auto;
        }
        .secret-raw-entry {
          margin-bottom: 24px;
        }
        .secret-raw-entry label {
          font-size: 0.82rem;
          color: var(--text-muted);
        }
        .raw-code-box {
          padding: 10px 14px;
          background: rgba(0,0,0,0.2);
          border-radius: 6px;
          border: 1px solid var(--border);
          font-size: 1rem;
          text-align: center;
          margin-top: 4px;
        }
        .mfa-verify-form {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .code-verify-field {
          text-align: center;
          font-size: 1.5rem;
          letter-spacing: 0.5rem;
          font-weight: 700;
        }
        .modal-actions {
          display: flex;
          gap: 12px;
          margin-top: 16px;
        }
        .btn-full-width {
          width: 100%;
          justify-content: center;
        }
        .backup-codes-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin: 20px 0;
        }
        .backup-code-item {
          padding: 10px;
          background: rgba(255,255,255,0.03);
          border: 1px solid var(--border);
          border-radius: 6px;
          text-align: center;
          font-size: 1.05rem;
        }
        .backup-actions {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
};

export default SecurityPage;
