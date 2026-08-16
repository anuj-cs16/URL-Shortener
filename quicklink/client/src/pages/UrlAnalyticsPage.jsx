/**
 * @file       UrlAnalyticsPage.jsx
 * @description In-depth performance dashboard for a specific shortened link.
 *              Retrieves click counts, referrer paths, devices splits, and recent clicks logs.
 * @module     pages/UrlAnalyticsPage
 * @requires   react
 * @requires   react-router-dom
 * @requires   api/analyticsApi
 * @requires   components/analytics/StatsCard
 * @requires   components/analytics/ClicksLineChart
 * @requires   components/analytics/DeviceDoughnutChart
 * @requires   components/analytics/BrowserBarChart
 * @requires   components/analytics/CountryBarChart
 * @requires   components/analytics/RecentClicksTable
 * @created    2026-08-12
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as analyticsApi from '../api/analyticsApi';
import ClicksLineChart from '../components/analytics/ClicksLineChart';
import DeviceDoughnutChart from '../components/analytics/DeviceDoughnutChart';
import BrowserBarChart from '../components/analytics/BrowserBarChart';
import CountryBarChart from '../components/analytics/CountryBarChart';
import RecentClicksTable from '../components/analytics/RecentClicksTable';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FiArrowLeft, FiLink, FiActivity, FiExternalLink, FiCalendar } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const UrlAnalyticsPage = () => {
  const { shortCode } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [urlInfo, setUrlInfo] = useState(null);
  const [clicksData, setClicksData] = useState([]);
  const [deviceData, setDeviceData] = useState({});
  const [browserData, setBrowserData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const [recentClicks, setRecentClicks] = useState([]);
  // eslint-disable-next-line no-unused-vars
  const [dateRange, setDateRange] = useState(7); // default 7 days

  const fetchUrlAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await analyticsApi.getUrlAnalytics(shortCode);
      if (response.success && response.data) {
        const payload = response.data;
        setUrlInfo(payload.url || null);
        setClicksData(payload.clicksOverTime || []);
        setDeviceData(payload.devices || {});
        setBrowserData(payload.browsers || []);
        setCountryData(payload.countries || []);
        setRecentClicks(payload.recentClicks || []);
      } else {
        toast.error('Failed to load link analytics');
        navigate('/analytics');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unauthorized or link not found.');
      navigate('/analytics');
    } finally {
      setIsLoading(false);
    }
  }, [shortCode, navigate]);

  useEffect(() => {
    fetchUrlAnalytics();
  }, [fetchUrlAnalytics, dateRange]);

  if (isLoading && !urlInfo) {
    return <LoadingSpinner fullPage size="lg" />;
  }

  const appUrl = window.location.origin;
  const shortUrl = `${appUrl}/${shortCode}`;
  const totalClicks = urlInfo ? urlInfo.clicks : 0;
  const createdDateStr = urlInfo
    ? new Date(urlInfo.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div className="page-wrapper analytics-layout">
      {/* Back button and title */}
      <header className="url-analytics-header">
        <Link to="/analytics" className="btn btn-outline back-btn-link">
          <FiArrowLeft /> Back to Overview
        </Link>
        <h1 className="url-analytics-title">
          Link Analytics: <span className="code-highlight">{shortCode}</span>
        </h1>
      </header>

      {/* URL Meta details card */}
      {urlInfo && (
        <section className="glass-card url-details-hero-card">
          <div className="details-main-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <FiLink style={{ color: 'var(--primary)', fontSize: '1.25rem' }} />
              <h2 className="details-short-url-txt">{shortUrl}</h2>
              <a href={shortUrl} target="_blank" rel="noopener noreferrer" className="external-redirect-anchor">
                <FiExternalLink />
              </a>
            </div>
            <p className="details-long-url-txt" title={urlInfo.longUrl}>
              Destination: <a href={urlInfo.longUrl} target="_blank" rel="noopener noreferrer">{urlInfo.longUrl}</a>
            </p>
            <div className="details-meta-row">
              <div className="meta-badge-box">
                <FiCalendar className="badge-icon" />
                <span>Created {createdDateStr}</span>
              </div>
              <div className="meta-badge-box">
                <FiActivity className="badge-icon" style={{ color: 'var(--secondary)' }} />
                <span>Status: <strong style={{ color: urlInfo.isActive ? 'var(--success)' : 'var(--error)' }}>{urlInfo.isActive ? 'Active' : 'Expired'}</strong></span>
              </div>
            </div>
          </div>
          <div className="details-clicks-counter">
            <span className="clicks-big-num">{totalClicks}</span>
            <span className="clicks-counter-lbl">Total Clicks</span>
          </div>
        </section>
      )}

      {/* Charts Grid Layout */}
      <section className="chart-fullwidth-section">
        <ClicksLineChart data={clicksData} isLoading={isLoading} />
      </section>

      <section className="charts-double-row">
        <DeviceDoughnutChart data={deviceData} isLoading={isLoading} />
        <BrowserBarChart data={browserData} isLoading={isLoading} />
      </section>

      <section className="charts-double-row">
        <CountryBarChart data={countryData} isLoading={isLoading} />
        <RecentClicksTable clicks={recentClicks} isLoading={isLoading} />
      </section>

      <style>{`
        .url-analytics-header {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 8px;
        }
        .back-btn-link {
          height: 36px;
          font-size: 0.85rem;
          padding: 0 14px;
          align-self: flex-start;
          border-color: var(--border);
        }
        .url-analytics-title {
          font-size: 1.6rem;
          font-weight: 800;
        }
        .code-highlight {
          color: var(--secondary);
        }
        .url-details-hero-card {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding: 24px;
          justify-content: space-between;
        }
        .details-main-content {
          flex: 1;
        }
        .details-short-url-txt {
          font-size: 1.35rem;
          font-weight: 800;
          color: white;
        }
        .external-redirect-anchor {
          color: var(--text-muted);
          font-size: 1.1rem;
          display: inline-flex;
          align-items: center;
          transition: var(--transition);
        }
        .external-redirect-anchor:hover {
          color: white;
        }
        .details-long-url-txt {
          font-size: 0.88rem;
          color: var(--text-secondary);
          word-break: break-all;
          margin-bottom: 14px;
        }
        .details-long-url-txt a {
          color: var(--text-muted);
        }
        .details-meta-row {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .meta-badge-box {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 0.82rem;
          color: var(--text-secondary);
          background-color: rgba(255, 255, 255, 0.03);
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid var(--border);
        }
        .badge-icon {
          color: var(--text-muted);
        }
        .details-clicks-counter {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border-top: 1px solid var(--border);
          padding-top: 16px;
        }
        .clicks-big-num {
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--secondary);
          line-height: 1.1;
        }
        .clicks-counter-lbl {
          font-size: 0.72rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        .charts-double-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        @media (min-width: 768px) {
          .url-details-hero-card {
            flex-direction: row;
            align-items: center;
          }
          .details-clicks-counter {
            border-top: none;
            border-left: 1px solid var(--border);
            padding-top: 0;
            padding-left: 30px;
            width: 140px;
            align-self: stretch;
          }
          .charts-double-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default UrlAnalyticsPage;
