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

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { useUrls } from '../hooks/useUrls';
import * as authApi from '../api/authApi';
import UrlForm from '../components/url/UrlForm';
import UrlResult from '../components/url/UrlResult';
import UrlTable from '../components/url/UrlTable';
import { FiUser, FiMail, FiCalendar, FiLink, FiActivity, FiX, FiCheck, FiLock } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
  const { user, updateUser } = useAuth();
  const { urls, isLoading, shorten, remove } = useUrls();
  const [shortenedData, setShortenedData] = useState(null);

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
    <div className="page-wrapper dashboard-layout">
      {/* Left Column: Shortener and URL Grid */}
      <main className="dashboard-main-content">
        <h1 className="dashboard-title">My Links Dashboard</h1>
        <UrlForm onSubmit={handleShortenSubmit} isLoading={isLoading} />
        {shortenedData && <UrlResult urlData={shortenedData} />}
        
        <div style={{ marginTop: '30px' }}>
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
          <p className="profile-role-txt">{user?.role === 'admin' ? 'Administrator' : 'Premium Creator'}</p>
          
          <div className="divider" style={{ margin: '16px 0' }} />

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
  );
};

export default DashboardPage;
