/**
 * @file       RecentClicksTable.jsx
 * @description Raw clicks log displaying access timestamps, geographics,
 *              browser/devices details, and referrers.
 * @module     components/analytics/RecentClicksTable
 * @requires   react
 * @requires   date-fns
 * @requires   react-icons/fi
 * @requires   components/common/SkeletonCard
 * @created    2026-08-12
 */

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FiMonitor, FiSmartphone, FiTablet, FiHelpCircle, FiGlobe } from 'react-icons/fi';
import SkeletonCard from '../common/SkeletonCard';

const RecentClicksTable = ({ clicks = [], isLoading = false }) => {
  if (isLoading) {
    return <SkeletonCard height="240px" />;
  }

  const getDeviceIcon = (deviceType = '') => {
    const type = deviceType.toLowerCase();
    if (type === 'mobile' || type === 'phone') return <FiSmartphone title="Mobile" />;
    if (type === 'tablet') return <FiTablet title="Tablet" />;
    if (type === 'desktop') return <FiMonitor title="Desktop" />;
    return <FiHelpCircle title="Unknown" />;
  };

  return (
    <div className="glass-card recent-clicks-card">
      <h3 className="card-title-lbl">Recent Activity Logs</h3>
      <div className="table-responsive-container" style={{ maxHeight: '380px', overflowY: 'auto' }}>
        {clicks.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '24px 0' }}>
            No recent traffic activity logged yet.
          </p>
        ) : (
          <table className="recent-clicks-table">
            <thead>
              <tr>
                <th>Time Ago</th>
                <th>Country</th>
                <th style={{ textAlign: 'center' }}>Device</th>
                <th>Browser</th>
                <th>Referrer</th>
              </tr>
            </thead>
            <tbody>
              {clicks.map((click, index) => {
                let formattedTime = 'Just now';
                try {
                  formattedTime = formatDistanceToNow(new Date(click.clickedAt), { addSuffix: true });
                } catch (e) { /* fallback */ }

                return (
                  <tr key={click._id || index}>
                    <td style={{ padding: '12px 10px', color: 'white', fontWeight: 500 }}>{formattedTime}</td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <FiGlobe style={{ color: 'var(--secondary)', opacity: 0.8 }} />
                        {click.country || 'Unknown'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center', fontSize: '1.15rem', color: 'var(--text-muted)' }}>
                      {getDeviceIcon(click.deviceType)}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>
                      {click.browser || 'Unknown'}
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      {click.referrer || 'Direct'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .recent-clicks-card {
          padding: 20px;
          border-radius: var(--radius-md);
        }
        .card-title-lbl {
          font-size: 1.05rem;
          font-weight: 700;
          margin-bottom: 16px;
          color: white;
        }
        .table-responsive-container {
          width: 100%;
        }
        .recent-clicks-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.85rem;
        }
        .recent-clicks-table th {
          padding: 10px;
          color: var(--text-secondary);
          font-weight: 600;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: #16213E;
          z-index: 1;
        }
        .recent-clicks-table td {
          border-bottom: 1px solid rgba(42, 42, 62, 0.3);
        }
      `}</style>
    </div>
  );
};

export default RecentClicksTable;
