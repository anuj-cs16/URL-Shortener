/**
 * @file       DashboardPage.jsx
 * @description Guest workspace dashboard page. Serves main shortening forms,
 *              URL tables, and client-side aggregated metrics.
 * @module     pages/DashboardPage
 * @requires   react
 * @requires   hooks/useUrls
 * @requires   framer-motion
 * @created    2026-08-12
 */

import React, { useState } from 'react';
import { useUrls } from '../hooks/useUrls';
import UrlForm from '../components/url/UrlForm';
import UrlResult from '../components/url/UrlResult';
import UrlTable from '../components/url/UrlTable';
import { FiLink, FiActivity, FiZap } from 'react-icons/fi';

const DashboardPage = () => {
  const { urls, isLoading, shorten, remove } = useUrls();
  const [shortenedData, setShortenedData] = useState(null);

  const handleShortenSubmit = async (longUrl, customCode) => {
    try {
      const data = await shorten(longUrl, customCode);
      setShortenedData(data);
    } catch (err) {
      setShortenedData(null);
    }
  };

  // Client-side statistics aggregations
  const totalUrls = urls.length;
  const totalClicks = urls.reduce((acc, curr) => acc + (curr.clicks || 0), 0);
  const activeUrls = urls.filter((url) => !url.isExpired).length;

  return (
    <div className="page-wrapper dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">My Links Dashboard</h1>
        <p className="dashboard-subtitle">Manage, track, and analyze all your shortened guest URLs in one place.</p>
      </header>

      {/* Stats Cards Row */}
      <section className="stats-grid">
        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ color: 'var(--primary)', background: 'rgba(108, 99, 255, 0.1)' }}>
            <FiLink />
          </div>
          <div className="stat-details">
            <span className="stat-label">Total Shortened Links</span>
            <span className="stat-value">{totalUrls}</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ color: 'var(--secondary)', background: 'rgba(255, 0, 127, 0.1)' }}>
            <FiActivity />
          </div>
          <div className="stat-details">
            <span className="stat-label">Accumulated Clicks</span>
            <span className="stat-value">{totalClicks}</span>
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-icon-wrapper" style={{ color: '#4CAF50', background: 'rgba(76, 175, 80, 0.1)' }}>
            <FiZap />
          </div>
          <div className="stat-details">
            <span className="stat-label">Active Redirects</span>
            <span className="stat-value">{activeUrls}</span>
          </div>
        </div>
      </section>

      {/* Shortener Form Section */}
      <section className="shortener-box">
        <UrlForm onSubmit={handleShortenSubmit} isLoading={isLoading} />
        {shortenedData && <UrlResult urlData={shortenedData} />}
      </section>

      {/* URLs History Table Section */}
      <section className="table-box" style={{ marginTop: '40px' }}>
        <UrlTable urls={urls} isLoading={isLoading} onDelete={remove} />
      </section>

      <style>{`
        .dashboard-container {
          max-width: 960px;
          margin: 0 auto;
          padding: 40px 20px;
          display: flex;
          flex-direction: column;
          gap: 30px;
          width: 100%;
        }
        .dashboard-header {
          text-align: left;
        }
        .dashboard-title {
          font-size: 2.2rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #ffffff 0%, var(--text-secondary) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }
        .dashboard-subtitle {
          color: var(--text-muted);
          font-size: 0.95rem;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        .stat-card {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          border-radius: var(--radius-lg);
          transition: var(--transition);
        }
        .stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .stat-icon-wrapper {
          width: 54px;
          height: 54px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .stat-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stat-label {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.8px;
          font-weight: 600;
        }
        .stat-value {
          font-size: 1.8rem;
          font-weight: 800;
          color: white;
        }
        .shortener-box {
          width: 100%;
        }

        @media (min-width: 576px) {
          .stats-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;
