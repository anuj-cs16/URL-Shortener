/**
 * @file       UrlTable.jsx
 * @description URL list presentation grid. Includes responsive mobile card layout,
 *              skeleton rendering states, and empty placeholders.
 * @module     components/url/UrlTable
 * @requires   react
 * @requires   components/url/UrlTableRow
 * @requires   components/common/SkeletonCard
 * @requires   components/common/EmptyState
 * @created    2026-08-12
 */

import React from 'react';
import UrlTableRow from './UrlTableRow';
import SkeletonCard from '../common/SkeletonCard';
import EmptyState from '../common/EmptyState';

const UrlTable = ({ urls = [], isLoading = false, onDelete }) => {
  if (isLoading && urls.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <SkeletonCard height="64px" />
        <SkeletonCard height="64px" />
        <SkeletonCard height="64px" />
      </div>
    );
  }

  if (urls.length === 0) {
    return (
      <EmptyState
        icon="🔗"
        title="No shortened links yet"
        message="Shorten your first long link using the input form above."
      />
    );
  }

  return (
    <div className="url-table-wrapper">
      {/* Desktop Table Headers */}
      <table className="url-table-desktop">
        <thead>
          <tr>
            <th>Original Destination</th>
            <th>Short URL</th>
            <th style={{ textAlign: 'center' }}>Clicks</th>
            <th>Expires At</th>
            <th style={{ textAlign: 'center' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {urls.map((url) => (
            <UrlTableRow key={url.shortCode} url={url} onDelete={onDelete} />
          ))}
        </tbody>
      </table>

      {/* Mobile Card Container */}
      <div className="url-cards-mobile">
        {urls.map((url) => (
          <UrlTableRow key={url.shortCode} url={url} onDelete={onDelete} isMobile />
        ))}
      </div>

      <style>{`
        .url-table-wrapper {
          width: 100%;
          overflow-x: auto;
        }
        .url-table-desktop {
          display: none;
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .url-table-desktop th {
          padding: 12px 16px;
          color: var(--text-secondary);
          font-weight: 600;
          font-size: 0.85rem;
          border-bottom: 1px solid var(--border);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .url-table-desktop td {
          border-bottom: 1px solid rgba(42, 42, 62, 0.4);
        }
        .url-cards-mobile {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        @media (min-width: 768px) {
          .url-table-desktop {
            display: table;
          }
          .url-cards-mobile {
            display: none;
          }
        }
      `}</style>
    </div>
  );
};

export default UrlTable;
