/**
 * @file       Navbar.jsx
 * @description Header navigation component. Integrates responsive drawers,
 *              dropdown menus, and the NotificationBell widget.
 * @module     components/layout/Navbar
 * @requires   react
 * @requires   react-router-dom
 * @requires   hooks/useAuth
 * @requires   framer-motion
 * @requires   components/notifications/NotificationBell
 * @created    2026-08-12
 */

import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMenu, FiX, FiSettings, FiLogOut, FiLayout, FiActivity } from 'react-icons/fi';
import NotificationBell from '../notifications/NotificationBell';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'nav-link-active' : ''}`;

  return (
    <nav className="navbar-container">
      <div className="navbar-content">
        {/* Left Side: Branding */}
        <Link to="/" className="navbar-logo" onClick={() => setIsOpen(false)}>
          <span style={{ color: 'var(--primary)', fontSize: '1.4rem' }}>🔗</span>
          <span className="logo-text-bold">QuickLink</span>
        </Link>

        {/* Center Section: Navigation Links (Desktop) */}
        <div className="navbar-links-desktop">
          <NavLink to="/" className={navLinkClass}>Home</NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard" className={navLinkClass}>Dashboard</NavLink>
              <NavLink to="/analytics" className={navLinkClass}>Analytics</NavLink>
            </>
          )}
        </div>

        {/* Right Section: Auth & Settings (Desktop) */}
        <div className="navbar-actions-desktop">
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
              <NotificationBell />
              
              {/* User Avatar Circle */}
              <button
                className="user-avatar-btn"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="User profile options"
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {dropdownOpen && (
                  <>
                    <div className="dropdown-overlay" onClick={() => setDropdownOpen(false)} />
                    <motion.div
                      className="user-dropdown-menu"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="dropdown-user-info">
                        <p className="dropdown-user-name">{user?.name}</p>
                        <p className="dropdown-user-email">{user?.email}</p>
                      </div>
                      <div className="divider" style={{ margin: '8px 0' }} />
                      <Link
                        to="/dashboard"
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiLayout /> Dashboard
                      </Link>
                      <Link
                        to="/notifications"
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiActivity /> Notifications
                      </Link>
                      <Link
                        to="/settings/notifications"
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiSettings /> Notification Settings
                      </Link>
                      <Link
                        to="/settings/security"
                        className="dropdown-item"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiSettings /> Security Settings
                      </Link>
                      <div className="divider" style={{ margin: '8px 0' }} />
                      <button className="dropdown-item dropdown-item-logout" onClick={handleLogout}>
                        <FiLogOut /> Logout
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '12px' }}>
              <Link to="/login" className="btn btn-outline" style={{ height: '38px', fontSize: '0.85rem' }}>
                Login
              </Link>
              <Link to="/signup" className="btn btn-primary" style={{ height: '38px', fontSize: '0.85rem', padding: '0 16px' }}>
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navbar Hamburger Controls */}
        <div className="navbar-mobile-controls">
          {isAuthenticated && <NotificationBell />}
          <button
            className="hamburger-toggle-btn"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu drawer"
          >
            {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Slide Down */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="navbar-mobile-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mobile-drawer-links">
              <NavLink to="/" className={navLinkClass} onClick={() => setIsOpen(false)}>Home</NavLink>
              {isAuthenticated ? (
                <>
                  <NavLink to="/dashboard" className={navLinkClass} onClick={() => setIsOpen(false)}>Dashboard</NavLink>
                  <NavLink to="/analytics" className={navLinkClass} onClick={() => setIsOpen(false)}>Analytics</NavLink>
                  <NavLink to="/notifications" className={navLinkClass} onClick={() => setIsOpen(false)}>Notifications</NavLink>
                  <NavLink to="/settings/notifications" className={navLinkClass} onClick={() => setIsOpen(false)}>Notification Settings</NavLink>
                  <NavLink to="/settings/security" className={navLinkClass} onClick={() => setIsOpen(false)}>Security Settings</NavLink>
                  <div className="divider" style={{ margin: '16px 0' }} />
                  <button className="btn btn-outline" style={{ width: '100%', height: '40px' }} onClick={handleLogout}>
                    <FiLogOut /> Logout
                  </button>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <Link to="/login" className="btn btn-outline" style={{ width: '100%', height: '40px' }} onClick={() => setIsOpen(false)}>
                    Login
                  </Link>
                  <Link to="/signup" className="btn btn-primary" style={{ width: '100%', height: '40px' }} onClick={() => setIsOpen(false)}>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .navbar-container {
          position: sticky;
          top: 0;
          z-index: 100;
          background: rgba(15, 15, 26, 0.7);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--card-border);
          width: 100%;
        }
        .navbar-content {
          max-width: 960px;
          margin: 0 auto;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          color: white;
          font-weight: 800;
          font-size: 1.25rem;
        }
        .logo-text-bold {
          background: linear-gradient(135deg, white 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .navbar-links-desktop {
          display: none;
          gap: 24px;
        }
        .nav-link {
          color: var(--text-secondary);
          font-size: 0.95rem;
          font-weight: 500;
          transition: var(--transition);
          position: relative;
          padding: 6px 0;
        }
        .nav-link:hover {
          color: white;
        }
        .nav-link-active {
          color: var(--primary);
        }
        .nav-link-active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--primary);
          border-radius: 2px;
        }
        .navbar-actions-desktop {
          display: none;
        }
        .user-avatar-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          color: white;
          border: none;
          font-weight: 700;
          cursor: pointer;
          transition: var(--transition);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(108, 99, 255, 0.3);
        }
        .user-avatar-btn:hover {
          transform: scale(1.05);
        }
        .dropdown-overlay {
          position: fixed;
          inset: 0;
          z-index: 9;
        }
        .user-dropdown-menu {
          position: absolute;
          top: 48px;
          right: 0;
          width: 220px;
          background: #16213E;
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          box-shadow: var(--shadow);
          padding: 12px;
          z-index: 10;
        }
        .dropdown-user-info {
          padding: 4px 8px;
        }
        .dropdown-user-name {
          font-weight: 600;
          font-size: 0.95rem;
          color: white;
        }
        .dropdown-user-email {
          font-size: 0.8rem;
          color: var(--text-muted);
          word-break: break-all;
        }
        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 8px;
          font-size: 0.88rem;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          text-align: left;
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: var(--transition);
        }
        .dropdown-item:hover {
          background-color: var(--primary-light);
          color: white;
        }
        .dropdown-item-logout:hover {
          background-color: var(--error-bg);
          color: var(--error);
        }
        .navbar-mobile-controls {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .hamburger-toggle-btn {
          background: transparent;
          border: none;
          color: white;
          cursor: pointer;
        }
        .navbar-mobile-drawer {
          position: absolute;
          top: 64px;
          left: 0;
          width: 100%;
          background: #0f0f1a;
          border-bottom: 1px solid var(--border);
          padding: 16px 20px;
          box-shadow: var(--shadow);
          z-index: 99;
        }
        .mobile-drawer-links {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        @media (min-width: 768px) {
          .navbar-links-desktop {
            display: flex;
          }
          .navbar-actions-desktop {
            display: flex;
          }
          .navbar-mobile-controls {
            display: none;
          }
          .navbar-mobile-drawer {
            display: none;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
