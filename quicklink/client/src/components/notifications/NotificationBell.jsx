/**
 * @file       NotificationBell.jsx
 * @description Navbar bell widget. Displays notifications counts and drops down
 *              quick alerts lists with type specific icons and read actions.
 * @module     components/notifications/NotificationBell
 * @requires   react
 * @requires   react-router-dom
 * @requires   react-icons/fi
 * @requires   hooks/useNotifications
 * @requires   framer-motion
 * @created    2026-08-12
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiCheckSquare } from 'react-icons/fi';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell = () => {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'welcome': return '👋';
      case 'url_created': return '🔗';
      case 'click_milestone': return '🎉';
      case 'weekly_report': return '📊';
      case 'url_expiring': return '⚠️';
      case 'url_expired': return '🕐';
      case 'password_changed': return '🔐';
      case 'login_alert': return '🔔';
      default: return '✉️';
    }
  };

  const handleNotificationClick = async (n) => {
    setIsOpen(false);
    if (!n.isRead) {
      await markRead(n._id);
    }
    
    // Smart redirect based on type
    if (n.type === 'click_milestone' && n.metadata?.shortCode) {
      navigate(`/analytics/${n.metadata.shortCode}`);
    } else if (n.type === 'url_created' && n.metadata?.shortCode) {
      navigate(`/analytics/${n.metadata.shortCode}`);
    } else if (n.type === 'weekly_report') {
      navigate('/analytics');
    } else if (n.type === 'url_expiring' && n.metadata?.shortCode) {
      navigate(`/analytics/${n.metadata.shortCode}`);
    } else {
      navigate('/notifications');
    }
  };

  // Dropdown shows last 5 notifications
  const dropdownItems = notifications.slice(0, 5);

  return (
    <div className="bell-container-wrapper">
      <button
        className="bell-trigger-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications dropdown"
      >
        <FiBell />
        {unreadCount > 0 && (
          <motion.span
            className="bell-badge-count"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2, repeatDelay: 1 }}
          >
            {unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="bell-dropdown-overlay" onClick={() => setIsOpen(false)} />
            <motion.div
              className="bell-dropdown-menu glass-card"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.18 }}
            >
              <div className="bell-dropdown-header">
                <h4>Notifications</h4>
                {unreadCount > 0 && (
                  <button className="mark-all-read-btn" onClick={markAllRead}>
                    <FiCheckSquare /> Read All
                  </button>
                )}
              </div>

              <div className="bell-dropdown-list">
                {dropdownItems.length === 0 ? (
                  <div className="bell-empty-box">
                    <span>🎉</span>
                    <p>All caught up!</p>
                  </div>
                ) : (
                  dropdownItems.map((n) => {
                    let relativeTime = 'Just now';
                    try {
                      relativeTime = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true });
                    } catch (e) {}

                    return (
                      <div
                        key={n._id}
                        className={`bell-item-row ${!n.isRead ? 'bell-item-unread' : ''}`}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <span className="bell-item-emoji">{getNotificationIcon(n.type)}</span>
                        <div className="bell-item-content">
                          <p className="bell-item-title">{n.title}</p>
                          <p className="bell-item-msg">{n.message}</p>
                          <span className="bell-item-time">{relativeTime}</span>
                        </div>
                        {!n.isRead && <span className="unread-blue-dot" />}
                      </div>
                    );
                  })
                )}
              </div>

              <div className="bell-dropdown-footer">
                <Link to="/notifications" onClick={() => setIsOpen(false)}>
                  View All Notifications
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style>{`
        .bell-container-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .bell-trigger-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 1.35rem;
          cursor: pointer;
          position: relative;
          display: flex;
          align-items: center;
          transition: var(--transition);
        }
        .bell-trigger-btn:hover {
          color: white;
        }
        .bell-badge-count {
          position: absolute;
          top: -6px;
          right: -6px;
          background-color: var(--error);
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1.5px solid var(--bg-primary);
        }
        .bell-dropdown-overlay {
          position: fixed;
          inset: 0;
          z-index: 190;
        }
        .bell-dropdown-menu {
          position: absolute;
          top: 36px;
          right: -80px;
          width: 320px;
          padding: 0;
          background-color: #16213E;
          border: 1px solid var(--border);
          box-shadow: var(--shadow);
          z-index: 195;
          overflow: hidden;
        }
        .bell-dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
        }
        .bell-dropdown-header h4 {
          font-size: 0.95rem;
          font-weight: 700;
        }
        .mark-all-read-btn {
          background: transparent;
          border: none;
          color: var(--primary);
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          transition: var(--transition);
        }
        .mark-all-read-btn:hover {
          color: var(--primary-light);
        }
        .bell-dropdown-list {
          max-height: 300px;
          overflow-y: auto;
        }
        .bell-empty-box {
          padding: 30px;
          text-align: center;
          color: var(--text-muted);
        }
        .bell-empty-box span {
          font-size: 2rem;
          display: block;
          margin-bottom: 8px;
        }
        .bell-empty-box p {
          font-size: 0.82rem;
        }
        .bell-item-row {
          display: flex;
          gap: 12px;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(42, 42, 62, 0.4);
          cursor: pointer;
          transition: var(--transition);
          position: relative;
          align-items: flex-start;
        }
        .bell-item-row:hover {
          background-color: rgba(255, 255, 255, 0.02);
        }
        .bell-item-unread {
          background-color: rgba(108, 99, 255, 0.03);
        }
        .bell-item-emoji {
          font-size: 1.25rem;
          flex-shrink: 0;
          padding-top: 2px;
        }
        .bell-item-content {
          flex: 1;
        }
        .bell-item-title {
          font-weight: 600;
          font-size: 0.85rem;
          color: white;
          margin-bottom: 2px;
        }
        .bell-item-unread .bell-item-title {
          font-weight: 700;
        }
        .bell-item-msg {
          font-size: 0.8rem;
          color: var(--text-secondary);
          line-height: 1.4;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        .bell-item-time {
          font-size: 0.72rem;
          color: var(--text-muted);
        }
        .unread-blue-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--primary);
          position: absolute;
          right: 16px;
          top: 18px;
        }
        .bell-dropdown-footer {
          text-align: center;
          padding: 10px;
          border-top: 1px solid var(--border);
          background-color: rgba(15, 15, 26, 0.3);
        }
        .bell-dropdown-footer a {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--primary);
        }
        .bell-dropdown-footer a:hover {
          color: var(--primary-light);
        }

        @media (min-width: 768px) {
          .bell-dropdown-menu {
            right: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationBell;
