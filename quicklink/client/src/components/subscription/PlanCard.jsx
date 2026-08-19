/**
 * @file       PlanCard.jsx
 * @description Card element rendering subscription plan pricing details, feature tags, and checkout triggers.
 * @module     components/subscription/PlanCard
 */

import React from 'react';

const PlanCard = ({ plan, isCurrentPlan, billingInterval, onSelect }) => {
  const isYearly = billingInterval === 'yearly';
  
  // Calculate yearly prices (20% off)
  const monthlyPrice = plan.price;
  const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8);
  const displayPrice = isYearly ? (plan.id === 'free' ? 0 : Math.round(yearlyPrice / 12)) : monthlyPrice;

  // Determine button text and styles
  let btnText = 'Upgrade';
  let btnClass = 'plan-card__btn';
  let isButtonDisabled = false;

  if (isCurrentPlan) {
    btnText = 'Current Plan';
    btnClass = 'plan-card__btn plan-card__btn--current';
    isButtonDisabled = true;
  } else if (plan.id === 'free') {
    btnText = 'Get Started Free';
    btnClass = 'plan-card__btn plan-card__btn--free';
  } else if (plan.id === 'business' && isCurrentPlan === 'pro') {
    btnText = 'Upgrade to Business';
    btnClass = 'plan-card__btn plan-card__btn--upgrade';
  } else if (plan.id === 'pro' && isCurrentPlan === 'business') {
    btnText = 'Downgrade to Pro';
    btnClass = 'plan-card__btn plan-card__btn--downgrade';
  } else {
    btnText = plan.price === 0 ? 'Start Free' : 'Start 14-day Free Trial';
    btnClass = plan.price === 0 ? 'plan-card__btn plan-card__btn--free' : 'plan-card__btn plan-card__btn--primary';
  }

  return (
    <div 
      className={`plan-card ${plan.popular ? 'plan-card--popular' : ''}`}
      style={{ '--card-accent': plan.color }}
    >
      {plan.popular && <span className="plan-card__badge">Most Popular</span>}
      
      <div className="plan-card__header">
        <span className="plan-card__icon">{plan.icon}</span>
        <h3 className="plan-card__name">{plan.name}</h3>
        
        <div className="plan-card__price-wrapper">
          <span className="plan-card__currency">$</span>
          <span className="plan-card__price">{displayPrice}</span>
          <span className="plan-card__period">/mo</span>
        </div>

        {isYearly && plan.id !== 'free' && (
          <p className="plan-card__yearly-billing">
            Billed annually (${yearlyPrice}/yr)
          </p>
        )}
        {!isYearly && plan.id !== 'free' && (
          <p className="plan-card__yearly-billing">
            Billed monthly
          </p>
        )}
        {plan.id === 'free' && (
          <p className="plan-card__yearly-billing">
            Free forever
          </p>
        )}
      </div>

      <button 
        className={btnClass}
        onClick={() => !isButtonDisabled && onSelect(plan.id)}
        disabled={isButtonDisabled}
      >
        {btnText}
      </button>

      <ul className="plan-card__features">
        {plan.features.map((feature, idx) => (
          <li key={idx} className="plan-card__feature-item">
            <span className="plan-card__feature-icon plan-card__feature-icon--check">✓</span>
            <span className="plan-card__feature-text">{feature}</span>
          </li>
        ))}

        {plan.notIncluded && plan.notIncluded.map((feature, idx) => (
          <li key={idx} className="plan-card__feature-item plan-card__feature-item--not-included">
            <span className="plan-card__feature-icon plan-card__feature-icon--cross">✕</span>
            <span className="plan-card__feature-text">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlanCard;
