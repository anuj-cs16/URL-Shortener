/**
 * @file       SkeletonCard.jsx
 * @description Shimmer placeholder component for layout block elements during data fetching.
 * @module     components/common/SkeletonCard
 * @created    2026-08-12
 */

import React from 'react';

const SkeletonCard = ({ width = '100%', height = '150px', borderRadius = 'var(--radius-md)' }) => {
  const cardStyle = {
    width,
    height,
    borderRadius,
  };

  return (
    <div
      className="anim-shimmer"
      style={cardStyle}
      role="presentation"
      aria-label="Loading placeholder"
    />
  );
};

export default SkeletonCard;
