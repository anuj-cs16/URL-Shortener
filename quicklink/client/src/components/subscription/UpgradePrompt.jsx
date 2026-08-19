/**
 * @file       UpgradePrompt.jsx
 * @description Prompts the user to upgrade their plan when a premium-only feature is clicked.
 * @module     components/subscription/UpgradePrompt
 */

import React from 'react';
import { Link } from 'react-router-dom';

const UpgradePrompt = ({ feature, requiredPlan = 'Pro', message }) => {
  return (
    <div className="upgrade-prompt">
      <div className="upgrade-prompt__icon-wrapper">
        <span className="upgrade-prompt__lock">🔒</span>
      </div>
      <h4 className="upgrade-prompt__title">{feature} is Locked</h4>
      <p className="upgrade-prompt__message">
        {message || `This feature requires a subscription to the ${requiredPlan} or Business plan.`}
      </p>
      <div className="upgrade-prompt__actions">
        <Link to="/pricing" className="upgrade-prompt__btn upgrade-prompt__btn--primary">
          ⚡ Upgrade to {requiredPlan}
        </Link>
        <Link to="/pricing" className="upgrade-prompt__link">
          Compare Plans
        </Link>
      </div>
    </div>
  );
};

export default UpgradePrompt;
