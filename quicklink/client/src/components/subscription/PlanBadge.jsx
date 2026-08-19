/**
 * @file       PlanBadge.jsx
 * @description Small badge component rendering user subscription status (Free, Pro ⚡, Business 🚀).
 * @module     components/subscription/PlanBadge
 */

import React from 'react';

const PlanBadge = ({ planId = 'free', size = 'md' }) => {
  const normId = String(planId).toLowerCase();
  
  let label = 'Free';
  let badgeClass = 'plan-badge--free';

  if (normId === 'pro') {
    label = 'Pro ⚡';
    badgeClass = 'plan-badge--pro';
  } else if (normId === 'business') {
    label = 'Business 🚀';
    badgeClass = 'plan-badge--business';
  }

  return (
    <span className={`plan-badge plan-badge--${size} ${badgeClass}`}>
      {label}
    </span>
  );
};

export default PlanBadge;
