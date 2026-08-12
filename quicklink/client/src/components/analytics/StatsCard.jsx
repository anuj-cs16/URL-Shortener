/**
 * @file       StatsCard.jsx
 * @description Glassmorphism card displaying analytics metrics with number count up animations.
 * @module     components/analytics/StatsCard
 * @requires   react
 * @requires   react-countup
 * @requires   components/common/SkeletonCard
 * @created    2026-08-12
 */

import React from 'react';
import CountUp from 'react-countup';
import SkeletonCard from '../common/SkeletonCard';

const StatsCard = ({ icon, title, value = 0, color = 'var(--primary)', isLoading = false }) => {
  if (isLoading) {
    return <SkeletonCard height="110px" />;
  }

  return (
    <div className="stats-card-container glass-card">
      <div className="stats-icon-wrapper" style={{ backgroundColor: `${color}15`, color }}>
        {icon}
      </div>
      <div className="stats-info">
        <h3 className="stats-value-num">
          <CountUp end={value} duration={1.5} separator="," />
        </h3>
        <p className="stats-title-lbl">{title}</p>
      </div>

      <style>{`
        .stats-card-container {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 20px;
          border-radius: var(--radius-md);
        }
        .stats-card-container:hover {
          transform: translateY(-3px);
          box-shadow: var(--shadow);
        }
        .stats-icon-wrapper {
          width: 52px;
          height: 52px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.6rem;
          flex-shrink: 0;
        }
        .stats-info {
          display: flex;
          flex-direction: column;
        }
        .stats-value-num {
          font-size: 1.8rem;
          font-weight: 800;
          color: white;
          line-height: 1.1;
          margin-bottom: 2px;
        }
        .stats-title-lbl {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
      `}</style>
    </div>
  );
};

export default StatsCard;
