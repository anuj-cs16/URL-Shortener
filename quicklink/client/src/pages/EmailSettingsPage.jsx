/**
 * @file       EmailSettingsPage.jsx
 * @description User email notification preference configuration workspace.
 *              Includes subscription toggles, custom milestone checklist, and SMTP test buttons.
 * @module     pages/EmailSettingsPage
 * @requires   react
 * @requires   hooks/useNotifications
 * @requires   hooks/useAuth
 * @requires   components/common/LoadingSpinner
 * @created    2026-08-12
 */

import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { useAuth } from '../hooks/useAuth';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiSave, FiSend, FiMail, FiCheck } from 'react-icons/fi';

const EmailSettingsPage = () => {
  const { user } = useAuth();
  const { emailSettings, saveEmailSettings, sendTestEmail, isLoading } = useNotifications();

  // Settings form states
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [urlCreated, setUrlCreated] = useState(false);
  const [clickMilestone, setClickMilestone] = useState(true);
  const [urlExpiring, setUrlExpiring] = useState(true);
  const [urlExpired, setUrlExpired] = useState(false);
  const [loginAlert, setLoginAlert] = useState(true);
  const [milestones, setMilestones] = useState([10, 50, 100, 500, 1000]);

  // Load database settings values when retrieved
  useEffect(() => {
    if (emailSettings) {
      setWeeklyReport(!!emailSettings.weeklyReport);
      setUrlCreated(!!emailSettings.urlCreated);
      setClickMilestone(!!emailSettings.clickMilestone);
      setUrlExpiring(!!emailSettings.urlExpiring);
      setUrlExpired(!!emailSettings.urlExpired);
      setLoginAlert(!!emailSettings.loginAlert);
      setMilestones(emailSettings.milestoneValues || [10, 50, 100, 500, 1000]);
    }
  }, [emailSettings]);

  const handleSave = async () => {
    const payload = {
      weeklyReport,
      urlCreated,
      clickMilestone,
      urlExpiring,
      urlExpired,
      loginAlert,
      milestoneValues: milestones,
    };
    await saveEmailSettings(payload);
  };

  const handleToggleMilestone = (val) => {
    setMilestones((prev) => {
      if (prev.includes(val)) {
        return prev.filter((m) => m !== val);
      } else {
        return [...prev, val].sort((a, b) => a - b);
      }
    });
  };

  const allMilestoneOptions = [10, 50, 100, 500, 1000, 5000];

  return (
    <div className="page-wrapper email-settings-layout">
      {/* Header toolbar */}
      <header className="page-header-row">
        <div>
          <h1 className="page-title-hdr">Email Notifications ⚙️</h1>
          <p className="page-subtitle-txt">
            Configure how and when you receive emails from QuickLink.
          </p>
        </div>
        <button className="btn btn-primary save-settings-btn" onClick={handleSave} disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" color="white" /> : <><FiSave /> Save Preferences</>}
        </button>
      </header>

      {/* Main card panels */}
      <main className="settings-panels-grid">
        {/* Section 1: Email Address info */}
        <section className="glass-card settings-card-panel">
          <h3 className="panel-title-txt">Email Address</h3>
          <div className="email-info-box">
            <FiMail className="email-icon-svg" />
            <div>
              <p className="email-address-txt">{user?.email}</p>
              <p className="email-hint-txt">To change your primary email, update details inside your dashboard profile.</p>
            </div>
          </div>
        </section>

        {/* Section 2: Preferences toggle list */}
        <section className="glass-card settings-card-panel">
          <h3 className="panel-title-txt">Preferences</h3>
          <div className="preferences-list-container">
            {/* Toggle Item: Weekly Report */}
            <div className="preference-item-row">
              <div className="preference-details">
                <p className="preference-title">Weekly Summary Reports</p>
                <p className="preference-desc">Receive a summary report containing click trends and geographics performance stats every Monday morning.</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={weeklyReport} onChange={(e) => setWeeklyReport(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Toggle Item: URL Created */}
            <div className="preference-item-row">
              <div className="preference-details">
                <p className="preference-title">URL Created Alert</p>
                <p className="preference-desc">Receive an email confirmation with short URL details and QR code download actions whenever you create a new link.</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={urlCreated} onChange={(e) => setUrlCreated(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Toggle Item: Click Milestones */}
            <div className="preference-item-row">
              <div className="preference-details">
                <p className="preference-title">Clicks Milestone Celebration</p>
                <p className="preference-desc">Receive congratulatory notices when a shortened URL reaches click thresholds (e.g. 10, 50, 100 clicks).</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={clickMilestone} onChange={(e) => setClickMilestone(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Toggle Item: URL Expiring */}
            <div className="preference-item-row">
              <div className="preference-details">
                <p className="preference-title">URL Expiring Warning</p>
                <p className="preference-desc">Receive warning emails 24 hours before a shortened URL is set to expire.</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={urlExpiring} onChange={(e) => setUrlExpiring(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Toggle Item: URL Expired */}
            <div className="preference-item-row">
              <div className="preference-details">
                <p className="preference-title">URL Expired Alert</p>
                <p className="preference-desc">Receive confirmation notifications when a shortened URL reaches its 7-day lifetime limit and becomes inactive.</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={urlExpired} onChange={(e) => setUrlExpired(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>

            {/* Toggle Item: Login Alert */}
            <div className="preference-item-row">
              <div className="preference-details">
                <p className="preference-title">Login Security Alerts</p>
                <p className="preference-desc">Receive email alerts whenever a new login activity is registered on your account profile.</p>
              </div>
              <label className="toggle-switch">
                <input type="checkbox" checked={loginAlert} onChange={(e) => setLoginAlert(e.target.checked)} />
                <span className="toggle-slider" />
              </label>
            </div>
          </div>
        </section>

        {/* Section 3: Click Milestone values selection */}
        {clickMilestone && (
          <section className="glass-card settings-card-panel">
            <h3 className="panel-title-txt">Milestone Value Settings</h3>
            <p className="email-hint-txt" style={{ marginTop: '0', marginBottom: '16px' }}>
              Choose click milestones that trigger email notifications:
            </p>
            <div className="milestones-checkbox-grid">
              {allMilestoneOptions.map((opt) => (
                <label key={opt} className="milestone-checkbox-item">
                  <input
                    type="checkbox"
                    checked={milestones.includes(opt)}
                    onChange={() => handleToggleMilestone(opt)}
                  />
                  <div className="custom-checkbox">
                    <FiCheck className="checkmark-icon" />
                  </div>
                  <span>{opt.toLocaleString()} Clicks</span>
                </label>
              ))}
            </div>
          </section>
        )}

        {/* Section 4: Email testing section */}
        <section className="glass-card settings-card-panel">
          <h3 className="panel-title-txt">Test SMTP Dispatch Connection</h3>
          <p className="email-hint-txt" style={{ marginTop: '0', marginBottom: '16px' }}>
            Dispatch a test email to your registered inbox to verify that settings and mail systems are linked correctly.
          </p>
          <button className="btn btn-outline test-email-btn" onClick={sendTestEmail}>
            <FiSend /> Dispatch Test Email
          </button>
        </section>
      </main>

      <style>{`
        .email-settings-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .page-header-row {
          display: flex;
          flex-direction: column;
          gap: 16px;
          justify-content: space-between;
        }
        .page-title-hdr {
          font-size: 1.8rem;
          font-weight: 800;
          color: white;
          margin-bottom: 4px;
        }
        .page-subtitle-txt {
          font-size: 0.95rem;
          color: var(--text-secondary);
        }
        .save-settings-btn {
          height: 40px;
          font-size: 0.88rem;
          padding: 0 20px;
          align-self: flex-start;
          box-shadow: 0 4px 12px rgba(108, 99, 255, 0.2);
        }
        .settings-panels-grid {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .settings-card-panel {
          padding: 24px;
        }
        .panel-title-txt {
          font-size: 1.1rem;
          font-weight: 700;
          margin-bottom: 12px;
          color: white;
        }
        .email-info-box {
          display: flex;
          align-items: center;
          gap: 16px;
          background: rgba(15, 15, 26, 0.5);
          border: 1px solid var(--border);
          padding: 16px;
          border-radius: var(--radius-md);
        }
        .email-icon-svg {
          font-size: 1.75rem;
          color: var(--primary);
          flex-shrink: 0;
        }
        .email-address-txt {
          font-weight: 700;
          font-size: 1rem;
          color: white;
        }
        .email-hint-txt {
          font-size: 0.8rem;
          color: var(--text-muted);
          margin-top: 2px;
          line-height: 1.4;
        }
        .preferences-list-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .preference-item-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 20px;
          border-bottom: 1px solid rgba(42, 42, 62, 0.3);
          padding-bottom: 16px;
        }
        .preference-item-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .preference-details {
          flex: 1;
        }
        .preference-title {
          font-weight: 600;
          font-size: 0.95rem;
          color: white;
        }
        .preference-desc {
          font-size: 0.82rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin-top: 2px;
        }
        
        /* Custom slide toggle switch */
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 48px;
          height: 24px;
          flex-shrink: 0;
          margin-top: 4px;
        }
        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--border);
          transition: .3s;
          border-radius: 24px;
        }
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }
        input:checked + .toggle-slider {
          background-color: var(--primary);
        }
        input:focus + .toggle-slider {
          box-shadow: 0 0 1px var(--primary);
        }
        input:checked + .toggle-slider:before {
          transform: translateX(24px);
        }
        
        /* Custom Checkbox Grid */
        .milestones-checkbox-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .milestone-checkbox-item {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          font-size: 0.88rem;
          color: var(--text-secondary);
          padding: 8px 0;
        }
        .milestone-checkbox-item input {
          display: none;
        }
        .custom-checkbox {
          width: 20px;
          height: 20px;
          border: 1px solid var(--border);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(15, 15, 26, 0.5);
          transition: var(--transition);
        }
        .checkmark-icon {
          color: white;
          font-size: 0.8rem;
          display: none;
        }
        input:checked + .custom-checkbox {
          background-color: var(--primary);
          border-color: var(--primary);
        }
        input:checked + .custom-checkbox .checkmark-icon {
          display: block;
        }
        .test-email-btn {
          height: 38px;
          font-size: 0.85rem;
          padding: 0 16px;
          border-color: var(--border);
        }

        @media (min-width: 768px) {
          .page-header-row {
            flex-direction: row;
            align-items: center;
          }
          .save-settings-btn {
            align-self: center;
          }
          .milestones-checkbox-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default EmailSettingsPage;
