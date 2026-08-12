/**
 * @file       AnalyticsPage.jsx
 * @description Centralized analytics reporting cockpit. Binds time series line graphs,
 *              geographic location bars, device doughnuts, and browser summaries.
 * @module     pages/AnalyticsPage
 * @requires   react
 * @requires   hooks/useAnalytics
 * @requires   components/analytics/StatsCard
 * @requires   components/analytics/ClicksLineChart
 * @requires   components/analytics/DeviceDoughnutChart
 * @requires   components/analytics/BrowserBarChart
 * @requires   components/analytics/CountryBarChart
 * @requires   components/analytics/ReferrerDoughnutChart
 * @requires   components/analytics/TopUrlsTable
 * @created    2026-08-12
 */

import React from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import StatsCard from '../components/analytics/StatsCard';
import ClicksLineChart from '../components/analytics/ClicksLineChart';
import DeviceDoughnutChart from '../components/analytics/DeviceDoughnutChart';
import BrowserBarChart from '../components/analytics/BrowserBarChart';
import CountryBarChart from '../components/analytics/CountryBarChart';
import ReferrerDoughnutChart from '../components/analytics/ReferrerDoughnutChart';
import TopUrlsTable from '../components/analytics/TopUrlsTable';
import { FiLink, FiActivity, FiZap, FiCalendar } from 'react-icons/fi';

const AnalyticsPage = () => {
  const {
    stats,
    clicksData,
    deviceData,
    browserData,
    countryData,
    referrerData,
    topUrls,
    isLoading,
    dateRange,
    changeDateRange,
  } = useAnalytics();

  return (
    <div className="page-wrapper analytics-layout">
      {/* Header and Date Filter Toolbar */}
      <header className="analytics-header">
        <h1 className="analytics-title">Analytics Dashboard</h1>
        <div className="date-toolbar">
          <button
            className={`btn btn-outline toolbar-btn ${dateRange === 7 ? 'toolbar-active' : ''}`}
            onClick={() => changeDateRange(7)}
          >
            Last 7 Days
          </button>
          <button
            className={`btn btn-outline toolbar-btn ${dateRange === 30 ? 'toolbar-active' : ''}`}
            onClick={() => changeDateRange(30)}
          >
            Last 30 Days
          </button>
          <button
            className={`btn btn-outline toolbar-btn ${dateRange === 90 ? 'toolbar-active' : ''}`}
            onClick={() => changeDateRange(90)}
          >
            Last 90 Days
          </button>
        </div>
      </header>

      {/* Overview Cards Row */}
      <section className="stats-row-grid">
        <StatsCard
          icon={<FiLink />}
          title="Total Links Created"
          value={stats.totalUrls}
          color="var(--primary)"
          isLoading={isLoading}
        />
        <StatsCard
          icon={<FiActivity />}
          title="Total Clicks Logs"
          value={stats.totalClicks}
          color="var(--secondary)"
          isLoading={isLoading}
        />
        <StatsCard
          icon={<FiZap />}
          title="Active Redirects"
          value={stats.activeUrls}
          color="#4CAF50"
          isLoading={isLoading}
        />
        <StatsCard
          icon={<FiCalendar />}
          title="Created This Month"
          value={stats.urlsThisMonth}
          color="#FFD93D"
          isLoading={isLoading}
        />
      </section>

      {/* Clicks Chart (Full Width) */}
      <section className="chart-fullwidth-section">
        <ClicksLineChart data={clicksData} isLoading={isLoading} />
      </section>

      {/* Sub charts: Devices + Browsers */}
      <section className="charts-double-row">
        <DeviceDoughnutChart data={deviceData} isLoading={isLoading} />
        <BrowserBarChart data={browserData} isLoading={isLoading} />
      </section>

      {/* Sub charts: Countries + Referrers */}
      <section className="charts-double-row">
        <CountryBarChart data={countryData} isLoading={isLoading} />
        <ReferrerDoughnutChart data={referrerData} isLoading={isLoading} />
      </section>

      {/* Top URLs table */}
      <section className="top-urls-section">
        <TopUrlsTable urls={topUrls} isLoading={isLoading} />
      </section>

      <style>{`
        .analytics-layout {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .analytics-header {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 8px;
        }
        .analytics-title {
          font-size: 1.8rem;
          font-weight: 800;
          color: white;
        }
        .date-toolbar {
          display: flex;
          gap: 8px;
        }
        .toolbar-btn {
          height: 36px;
          font-size: 0.82rem;
          padding: 0 14px;
          border-color: var(--border);
        }
        .toolbar-active {
          background-color: var(--primary) !important;
          color: white !important;
          border-color: var(--primary) !important;
          box-shadow: 0 2px 10px rgba(108, 99, 255, 0.3);
        }
        .stats-row-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .charts-double-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }

        @media (min-width: 580px) {
          .stats-row-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (min-width: 768px) {
          .analytics-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
          }
          .stats-row-grid {
            grid-template-columns: repeat(4, 1fr);
          }
          .charts-double-row {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default AnalyticsPage;
