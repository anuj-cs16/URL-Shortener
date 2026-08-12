/**
 * @file       TopUrlsTable.jsx
 * @description Performance grid displaying the user's most popular shortened links
 *              with rank badges and action triggers.
 * @module     components/analytics/TopUrlsTable
 * @requires   react
 * @requires   react-router-dom
 * @requires   react-icons/fi
 * @requires   components/common/SkeletonCard
 * @created    2026-08-12
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { FiBarChart2, FiExternalLink } from 'react-icons/fi';
import SkeletonCard from '../common/SkeletonCard';

const TopUrlsTable = ({ urls = [], isLoading = false }) => {
  if (isLoading) {
    return <SkeletonCard height="240px" />;
  }

  const getRankBadge = (index) => {
    if (index === 0) return <span style={{ fontSize: '1.25rem' }}>🥇</span>;
    if (index === 1) return <span style={{ fontSize: '1.25rem' }}>🥈</span>;
    if (index === 2) return <span style={{ fontSize: '1.25rem' }}>🥉</span>;
    return <span className="rank-number-badge">{index + 1}</span>;
  };

  const appUrl = process.env.BASE_URL || window.location.origin;

  return (
    <div className="glass-card top-urls-card">
      <h3 className="card-title-lbl">Top Performing Links</h3>
      <div className="table-responsive-container">
        {urls.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
            No link analytics recorded yet.
          </p>
        ) : (
          <table className="top-urls-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
                <th>Short Link</th>
                <th>Original Destination</th>
                <th style={{ textAlign: 'center' }}>Clicks</th>
                <th style={{ textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {urls.map((url, index) => {
                const shortUrl = `${appUrl}/${url.shortCode}`;
                const truncatedLongUrl = url.longUrl.length > 50 ? `${url.longUrl.substring(0, 47)}...` : url.longUrl;
                
                return (
                  <tr key={url.shortCode}>
                    <td style={{ textAlign: 'center', padding: '12px 6px' }}>{getRankBadge(index)}</td>
                    <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--secondary)' }}>
                      <a href={shortUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {url.shortCode} <FiExternalLink style={{ fontSize: '0.8rem', opacity: 0.6 }} />
                      </a>
                    </td>
                    <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }} title={url.longUrl}>
                      {truncatedLongUrl}
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <span className="clicks-badge-pill">{url.clicks}</span>
                    </td>
                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                      <Link to={`/analytics/${url.shortCode}`} className="btn btn-outline analytics-btn-action" title="View details">
                        <FiBarChart2 />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <style>{`
        .top-urls-card {
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
          overflow-x: auto;
        }
        .top-urls-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 0.9rem;
        }
        .top-urls-table th {
          padding: 10px;
          color: var(--text-secondary);
          font-weight: 600;
          border-bottom: 1px solid var(--border);
        }
        .top-urls-table td {
          border-bottom: 1px solid rgba(42, 42, 62, 0.3);
        }
        .rank-number-badge {
          background-color: var(--border);
          color: var(--text-secondary);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 600;
        }
        .clicks-badge-pill {
          background-color: var(--primary-light);
          color: var(--primary);
          padding: 2px 10px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 0.82rem;
        }
        .analytics-btn-action {
          width: 32px;
          height: 32px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-color: var(--border);
        }
        .analytics-btn-action:hover {
          background-color: var(--primary-light);
          color: white;
          border-color: var(--primary);
        }
      `}</style>
    </div>
  );
};

export default TopUrlsTable;
