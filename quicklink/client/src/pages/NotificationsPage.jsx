/**
 * @file       NotificationsPage.jsx
 * @description In-app notifications history center. Supports category filtering tabs,
 *              mark-all-read triggers, individual delete triggers, and redirections.
 * @module     pages/NotificationsPage
 * @requires   react
 * @requires   hooks/useNotifications
 * @requires   date-fns
 * @requires   react-icons/fi
 * @requires   components/common/EmptyState
 * @requires   components/common/LoadingSpinner
 * @created    2026-08-12
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { FiCheckSquare, FiTrash2 } from 'react-icons/fi';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';

const NotificationsPage = () => {
  const { notifications, unreadCount, markRead, markAllRead, removeNotification, isLoading } = useNotifications();
  const [activeTab, setActiveTab] = useState('all'); // all, unread, urls, security, reports
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

  const filterNotifications = () => {
    switch (activeTab) {
      case 'unread':
        return notifications.filter((n) => !n.isRead);
      case 'urls':
        return notifications.filter((n) => ['url_created', 'click_milestone', 'url_expiring', 'url_expired'].includes(n.type));
      case 'security':
        return notifications.filter((n) => ['password_changed', 'login_alert'].includes(n.type));
      case 'reports':
        return notifications.filter((n) => n.type === 'weekly_report');
      default:
        return notifications;
    }
  };

  const handleItemClick = async (n) => {
    if (!n.isRead) {
      await markRead(n._id);
    }
    // Smart redirect mapping
    if (n.type === 'click_milestone' && n.metadata?.shortCode) {
      navigate(`/analytics/${n.metadata.shortCode}`);
    } else if (n.type === 'url_created' && n.metadata?.shortCode) {
      navigate(`/analytics/${n.metadata.shortCode}`);
    } else if (n.type === 'weekly_report') {
      navigate('/analytics');
    } else if (n.type === 'url_expiring' && n.metadata?.shortCode) {
      navigate(`/analytics/${n.metadata.shortCode}`);
    }
  };

  const filteredItems = filterNotifications();

  return (
    <div className="page-wrapper notifications-page-layout">
      {/* Header section */}
      <header className="page-header-row">
        <div>
          <h1 className="page-title-hdr">Notifications 🔔</h1>
          <p className="page-subtitle-txt">
            Manage your in-app logs and transactional triggers history.
          </p>
        </div>
        
        {unreadCount > 0 && (
          <button className="btn btn-outline read-all-action-btn" onClick={markAllRead}>
            <FiCheckSquare /> Mark All Read
          </button>
        )}
      </header>

      {/* Navigation Filter Tabs */}
      <nav className="filter-tabs-bar">
        {['all', 'unread', 'urls', 'security', 'reports'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn-item ${activeTab === tab ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'unread' && unreadCount > 0 && (
              <span className="tab-badge-pill">{unreadCount}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Main List */}
      <main className="notifications-main-list">
        {isLoading && filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon="🔔"
            title={`No ${activeTab !== 'all' ? activeTab : ''} notifications found`}
            message="You are completely caught up! We will alert you on link performance milestones and security events."
            actionText={activeTab !== 'all' ? 'View All Notifications' : 'Configure Settings'}
            onAction={() => activeTab !== 'all' ? setActiveTab('all') : navigate('/settings/notifications')}
          />
        ) : (
          <div className="items-list-container">
            {filteredItems.map((n) => {
              let relativeTime = 'Just now';
              try {
                relativeTime = formatDistanceToNow(new Date(n.createdAt), { addSuffix: true });
              } catch (e) {}

              return (
                <div
                  key={n._id}
                  className={`notification-item-card glass-card ${!n.isRead ? 'item-unread-accent' : 'item-read-accent'}`}
                >
                  <div className="item-click-zone" onClick={() => handleItemClick(n)}>
                    <span className="item-emoji-display">{getNotificationIcon(n.type)}</span>
                    <div className="item-detail-content">
                      <h3 className="item-title-txt">{n.title}</h3>
                      <p className="item-message-txt">{n.message}</p>
                      <span className="item-time-lbl">{relativeTime}</span>
                    </div>
                  </div>
                  <button
                    className="item-delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(n._id);
                    }}
                    title="Clear notification"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <style>{`
        .notifications-page-layout {
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
        .read-all-action-btn {
          height: 38px;
          font-size: 0.85rem;
          padding: 0 16px;
          align-self: flex-start;
          border-color: var(--border);
        }
        .filter-tabs-bar {
          display: flex;
          gap: 6px;
          border-bottom: 1px solid var(--border);
          overflow-x: auto;
          padding-bottom: 2px;
        }
        .tab-btn-item {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          padding: 10px 14px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          border-bottom: 2px solid transparent;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .tab-btn-item:hover {
          color: white;
        }
        .tab-active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }
        .tab-badge-pill {
          background-color: var(--error);
          color: white;
          font-size: 0.68rem;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 10px;
        }
        .items-list-container {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .notification-item-card {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          position: relative;
          cursor: pointer;
        }
        .item-unread-accent {
          border-left: 3px solid var(--primary);
          background-color: rgba(108, 99, 255, 0.02);
        }
        .item-read-accent {
          border-left: 3px solid transparent;
          opacity: 0.85;
        }
        .item-click-zone {
          display: flex;
          gap: 16px;
          flex: 1;
        }
        .item-emoji-display {
          font-size: 1.5rem;
          flex-shrink: 0;
          padding-top: 4px;
        }
        .item-detail-content {
          flex: 1;
        }
        .item-title-txt {
          font-size: 1rem;
          font-weight: 700;
          color: white;
          margin-bottom: 4px;
        }
        .item-unread-accent .item-title-txt {
          color: white;
        }
        .item-message-txt {
          font-size: 0.88rem;
          color: var(--text-secondary);
          line-height: 1.45;
          margin-bottom: 6px;
        }
        .item-time-lbl {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .item-delete-btn {
          background: transparent;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          font-size: 1.15rem;
          display: flex;
          align-items: center;
          padding: 8px;
          border-radius: 6px;
          transition: var(--transition);
        }
        .item-delete-btn:hover {
          color: var(--error);
          background-color: var(--error-bg);
        }

        @media (min-width: 768px) {
          .page-header-row {
            flex-direction: row;
            align-items: center;
          }
          .read-all-action-btn {
            align-self: center;
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationsPage;
