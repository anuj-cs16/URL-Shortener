/**
 * @file       DashboardPage.jsx
 * @description User workspace dashboard page. Serves main shortening forms,
 *              URL tables, profile metrics, and password-change modals.
 * @module     pages/DashboardPage
 * @requires   react
 * @requires   hooks/useAuth
 * @requires   hooks/useUrls
 * @requires   api/authApi
 * @requires   framer-motion
 * @created    2026-08-12
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useUrls } from '../hooks/useUrls';
import { useSubscription } from '../hooks/useSubscription';
import * as authApi from '../api/authApi';
import UrlForm from '../components/url/UrlForm';
import UrlResult from '../components/url/UrlResult';
import UrlTable from '../components/url/UrlTable';
import PlanBadge from '../components/subscription/PlanBadge';
import UsageBar from '../components/subscription/UsageBar';
import UpgradePrompt from '../components/subscription/UpgradePrompt';
import axiosInstance from '../api/axiosConfig';
import { FiMail, FiCalendar, FiLink, FiActivity, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import SEOHead from '../components/seo/SEOHead';

const DashboardPage = () => {
  const { user, updateUser } = useAuth();
  const { urls, isLoading, shorten, remove } = useUrls();
  const { subscription, usage, fetchCurrentSubscription } = useSubscription();
  const [shortenedData, setShortenedData] = useState(null);

  // Bulk States
  const [bulkText, setBulkText] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState(null);

  useEffect(() => {
    fetchCurrentSubscription();
  }, [fetchCurrentSubscription]);

  const handleBulkShorten = async () => {
    const urlsArray = bulkText
      .split('\n')
      .map((url) => url.trim())
      .filter((url) => url.length > 0);

    if (urlsArray.length === 0) {
      toast.error('Please enter at least one URL');
      return;
    }

    setBulkLoading(true);
    try {
      const response = await axiosInstance.post('/api/bulk-shorten', { urls: urlsArray });
      if (response.data?.success) {
        setBulkResults(response.data.data);
        setBulkText('');
        toast.success('Bulk shortening completed successfully!');
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Bulk shortening failed');
    } finally {
      setBulkLoading(false);
    }
  };

  // Modal display states
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);

  // Form states
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const handleShortenSubmit = async (longUrl, customCode) => {
    try {
      const data = await shorten(longUrl, customCode);
      setShortenedData(data);
    } catch (err) {
      setShortenedData(null);
    }
  };

  const handleUpdateProfileSubmit = async (e) => {
    e.preventDefault();
    if (!editName || !editEmail) {
      toast.error('Name and Email are required.');
      return;
    }
    setFormLoading(true);
    try {
      const response = await authApi.updateProfile(editName, editEmail);
      if (response.success && response.data?.user) {
        updateUser(response.data.user);
        toast.success('Profile updated successfully!');
        setEditOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profile update failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }
    setFormLoading(true);
    try {
      const response = await authApi.changePassword(currentPassword, newPassword);
      if (response.success) {
        toast.success('Password changed successfully!');
        setPasswordOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Password update failed.');
    } finally {
      setFormLoading(false);
    }
  };

  const formattedDate = new Date(user?.createdAt).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const totalClicks = urls.reduce((acc, curr) => acc + (curr.clicks || 0), 0);

  return (
    <>
      <SEOHead pageKey="dashboard" />
      <div className="page-wrapper dashboard-layout">
        {/* Left Column: Shortener and URL Grid */}
      <main className="dashboard-main-content">
        <h1 className="dashboard-title">My Links Dashboard</h1>
        <UrlForm 
          onSubmit={handleShortenSubmit} 
          isLoading={isLoading} 
          planId={subscription?.planId}
          urlsCreated={usage?.urlsCreated?.used || 0}
          urlsLimit={usage?.urlsCreated?.limit || 10}
        />
        {shortenedData && <UrlResult urlData={shortenedData} />}
        
        {/* Bulk URL shortening section (restricted to Pro+) */}
        {(subscription?.planId === 'pro' || subscription?.planId === 'business') ? (
          <div className="glass-card bulk-shortener-card" style={{ marginTop: '30px', padding: '24px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ⚡ Bulk URL Shortener
            </h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Enter up to 50 URLs (one per line) to shorten them all at once.
            </p>
            <textarea
              className="form-input"
              rows={6}
              style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.85rem', resize: 'vertical', padding: '12px', marginBottom: '16px' }}
              placeholder="https://example.com/one&#10;https://example.com/two&#10;https://example.com/three"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              disabled={bulkLoading}
            />
            <button 
              className="btn btn-primary"
              onClick={handleBulkShorten}
              disabled={bulkLoading || !bulkText.trim()}
              style={{ width: '100%' }}
            >
              {bulkLoading ? 'Processing Bulk Order...' : '⚡ Shorten All URLs'}
            </button>

            {bulkResults && (
              <div style={{ marginTop: '20px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '8px' }}>
                  Bulk Results ({bulkResults.successCount} succeeded, {bulkResults.failCount} failed)
                </h3>
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                    <thead style={{ background: 'var(--card-border)', position: 'sticky', top: 0 }}>
                      <tr>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Original URL</th>
                        <th style={{ padding: '8px', textAlign: 'left', borderBottom: '1px solid var(--border)' }}>Short URL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkResults.results.map((res, index) => (
                        <tr key={index} style={{ borderBottom: '1px solid var(--card-border)' }}>
                          <td style={{ padding: '8px', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{res.longUrl}</td>
                          <td style={{ padding: '8px', wordBreak: 'break-all' }}>
                            {res.success ? (
                              <a href={res.shortUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--secondary)' }}>
                                {res.shortUrl}
                              </a>
                            ) : (
                              <span style={{ color: 'var(--error)' }}>✕ {res.error}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="glass-card bulk-shortener-card" style={{ marginTop: '30px', padding: '24px', opacity: 0.8 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              🔒 Bulk URL Shortener
            </h2>
            <UpgradePrompt 
              feature="Bulk URL Shortening" 
              requiredPlan="Pro" 
              message="Shorten up to 50 links in a single command. Upgrade to Pro or Business to unlock." 
            />
          </div>
        )}

        <div style={{ marginTop: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>My Shortened Links</h2>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {(subscription?.planId === 'pro' || subscription?.planId === 'business') ? (
                <>
                  <a href="/api/export/urls/csv" className="btn btn-outline" style={{ height: '36px', fontSize: '0.8rem', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                    📥 Export URLs (CSV)
                  </a>
                  <a href="/api/export/analytics/csv" className="btn btn-outline" style={{ height: '36px', fontSize: '0.8rem', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                    📈 Export Clicks (CSV)
                  </a>
                </>
              ) : (
                <button 
                  className="btn btn-outline" 
                  style={{ height: '36px', fontSize: '0.8rem', padding: '0 12px', display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.6 }}
                  onClick={() => toast.error('Exporting data requires a Pro or Business subscription.')}
                >
                  🔒 Export Data (Pro)
                </button>
              )}
            </div>
          </div>
          <UrlTable urls={urls} isLoading={isLoading} onDelete={remove} />
        </div>
      </main>

      {/* Right Column: Profile details */}
      <aside className="dashboard-sidebar">
        <div className="glass-card profile-sidebar-card">
          <div className="profile-avatar-circle">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h2 className="profile-name-txt">{user?.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', marginTop: '8px' }}>
            <p className="profile-role-txt" style={{ margin: 0 }}>{user?.role === 'admin' ? 'Administrator' : 'Creator'}</p>
            <PlanBadge planId={user?.planId} size="md" />
          </div>
          
          <div className="divider" style={{ margin: '16px 0' }} />

          {/* Usage bars */}
          {usage && (
            <div style={{ padding: '0 8px', display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '16px' }}>
              <UsageBar 
                label="URLs Created" 
                used={usage.urlsCreated.used} 
                limit={usage.urlsCreated.limit} 
                icon="🔗" 
              />
              <UsageBar 
                label="Clicks Tracked" 
                used={usage.clicksReceived.used} 
                limit={usage.clicksReceived.limit} 
                icon="📊" 
              />
              {subscription?.planId === 'free' && (
                <Link to="/pricing" style={{ fontSize: '0.82rem', color: 'var(--primary)', textAlign: 'center', textDecoration: 'none', fontWeight: 600 }}>
                  ⚡ Upgrade to Pro for more limits
                </Link>
              )}
              <div className="divider" style={{ margin: '16px 0' }} />
            </div>
          )}

          <div className="profile-meta-list">
            <div className="profile-meta-item">
              <FiMail className="meta-icon" />
              <div>
                <p className="meta-lbl">Email Address</p>
                <p className="meta-val">{user?.email}</p>
              </div>
            </div>
            <div className="profile-meta-item">
              <FiCalendar className="meta-icon" />
              <div>
                <p className="meta-lbl">Member Since</p>
                <p className="meta-val">{formattedDate}</p>
              </div>
            </div>
            <div className="profile-meta-item">
              <FiLink className="meta-icon" style={{ color: 'var(--primary)' }} />
              <div>
                <p className="meta-lbl">Shortened Links</p>
                <p className="meta-val highlight">{urls.length}</p>
              </div>
            </div>
            <div className="profile-meta-item">
              <FiActivity className="meta-icon" style={{ color: 'var(--secondary)' }} />
              <div>
                <p className="meta-lbl">Accumulated Clicks</p>
                <p className="meta-val" style={{ color: 'var(--secondary)', fontWeight: 700 }}>{totalClicks}</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button className="btn btn-outline" style={{ width: '100%', height: '40px', fontSize: '0.88rem' }} onClick={() => setEditOpen(true)}>
              Edit Profile Settings
            </button>
            <button className="btn btn-outline" style={{ width: '100%', height: '40px', fontSize: '0.88rem' }} onClick={() => setPasswordOpen(true)}>
              Change Account Password
            </button>
          </div>
        </div>
      </aside>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {editOpen && (
          <div className="modal-overlay-bg">
            <motion.div
              className="modal-container-card glass-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
            >
              <div className="modal-header-row">
                <h3>Edit Profile Details</h3>
                <button className="close-modal-btn" onClick={() => setEditOpen(false)}>
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleUpdateProfileSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                <div>
                  <label className="input-label-tag">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="input-label-tag">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1, height: '40px' }} onClick={() => setEditOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '40px' }} disabled={formLoading}>
                    {formLoading ? 'Saving...' : 'Save Settings'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Change Password Modal */}
      <AnimatePresence>
        {passwordOpen && (
          <div className="modal-overlay-bg">
            <motion.div
              className="modal-container-card glass-card"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
            >
              <div className="modal-header-row">
                <h3>Change Account Password</h3>
                <button className="close-modal-btn" onClick={() => setPasswordOpen(false)}>
                  <FiX />
                </button>
              </div>
              <form onSubmit={handleChangePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                <div>
                  <label className="input-label-tag">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="input-label-tag">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="input-label-tag">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1, height: '40px' }} onClick={() => setPasswordOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, height: '40px' }} disabled={formLoading}>
                    {formLoading ? 'Saving...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        .dashboard-layout {
          display: flex;
          flex-direction: column;
          gap: 30px;
        }
        .dashboard-main-content {
          flex: 1;
        }
        .dashboard-title {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 24px;
        }
        .dashboard-sidebar {
          width: 100%;
        }
        .profile-sidebar-card {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .profile-avatar-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          color: white;
          font-size: 2.2rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(108, 99, 255, 0.4);
          margin-bottom: 16px;
        }
        .profile-name-txt {
          font-size: 1.25rem;
          font-weight: 700;
          color: white;
          text-align: center;
        }
        .profile-role-txt {
          font-size: 0.82rem;
          color: var(--text-muted);
          margin-top: 2px;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .profile-meta-list {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .profile-meta-item {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .meta-icon {
          font-size: 1.25rem;
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .meta-lbl {
          font-size: 0.72rem;
          color: var(--text-muted);
          font-weight: 600;
          text-transform: uppercase;
        }
        .meta-val {
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-weight: 500;
          word-break: break-all;
        }
        
        /* Modal Backdrop */
        .modal-overlay-bg {
          position: fixed;
          inset: 0;
          background-color: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          z-index: 200;
        }
        .modal-container-card {
          max-width: 440px;
          width: 100%;
          padding: 24px;
        }
        .modal-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header-row h3 {
          font-size: 1.15rem;
          font-weight: 700;
        }
        .close-modal-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          font-size: 1.25rem;
          display: flex;
          align-items: center;
        }
        .close-modal-btn:hover {
          color: white;
        }

        @media (min-width: 768px) {
          .dashboard-layout {
            flex-direction: row;
          }
          .dashboard-sidebar {
            width: 280px;
            flex-shrink: 0;
          }
        }
      `}</style>
    </div>
    </>
  );
};

export default DashboardPage;
