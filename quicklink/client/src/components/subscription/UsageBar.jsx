/**
 * @file       UsageBar.jsx
 * @description Renders limit bars showing resource consumption (URLs, clicks) with warning colors.
 * @module     components/subscription/UsageBar
 */

import React from 'react';
import { Link } from 'react-router-dom';

const UsageBar = ({ label, used, limit, icon, resetDate }) => {
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));

  // Determine progress color
  let colorClass = 'usage-bar__progress--green';
  if (percentage > 80) {
    colorClass = 'usage-bar__progress--red';
  } else if (percentage > 60) {
    colorClass = 'usage-bar__progress--orange';
  }

  const formattedDate = resetDate ? new Date(resetDate).toLocaleDateString() : '';

  return (
    <div className="usage-bar">
      <div className="usage-bar__labels">
        <span className="usage-bar__title">
          <span className="usage-bar__icon">{icon}</span> {label}
        </span>
        <span className="usage-bar__count">
          {used} / {isUnlimited ? '∞' : limit}
        </span>
      </div>

      {!isUnlimited && (
        <div className="usage-bar__track">
          <div 
            className={`usage-bar__progress ${colorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}

      {isUnlimited && (
        <div className="usage-bar__track">
          <div 
            className="usage-bar__progress usage-bar__progress--green"
            style={{ width: '100%' }}
          />
        </div>
      )}

      <div className="usage-bar__meta">
        {percentage >= 100 && !isUnlimited && (
          <p className="usage-bar__alert usage-bar__alert--red">
            ⚠️ Limit reached! <Link to="/pricing" className="usage-bar__link">Upgrade plan</Link> to shorten more URLs.
          </p>
        )}
        {percentage >= 80 && percentage < 100 && !isUnlimited && (
          <p className="usage-bar__alert usage-bar__alert--orange">
            ⚠️ Approaching limit ({percentage}% used).
          </p>
        )}
        {percentage < 80 && !isUnlimited && (
          <p className="usage-bar__alert usage-bar__alert--green">
            ✓ Good standing.
          </p>
        )}
        {isUnlimited && (
          <p className="usage-bar__alert usage-bar__alert--green">
            ✓ Unlimited access.
          </p>
        )}
        {formattedDate && (
          <span className="usage-bar__reset-text">Resets on {formattedDate}</span>
        )}
      </div>
    </div>
  );
};

export default UsageBar;
