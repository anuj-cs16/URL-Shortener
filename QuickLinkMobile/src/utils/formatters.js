/**
 * @file formatters.js
 * @description Formatting utilities for numbers, dates, URLs, and file sizes.
 */

import moment from 'moment';

/**
 * Format large numbers to compact form (e.g., 1234 → "1.2K").
 */
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  if (num < 1000) return num.toString();
  if (num < 1000000) return `${(num / 1000).toFixed(1)}K`;
  if (num < 1000000000) return `${(num / 1000000).toFixed(1)}M`;
  return `${(num / 1000000000).toFixed(1)}B`;
};

/**
 * Format number with commas (e.g., 1234567 → "1,234,567").
 */
export const formatNumberWithCommas = (num) => {
  if (num === null || num === undefined) return '0';
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

/**
 * Format date to relative time (e.g., "2 hours ago").
 */
export const formatTimeAgo = (date) => {
  if (!date) return '';
  return moment(date).fromNow();
};

/**
 * Format date to readable string (e.g., "Sep 3, 2026").
 */
export const formatDate = (date) => {
  if (!date) return '';
  return moment(date).format('MMM D, YYYY');
};

/**
 * Format date to full format (e.g., "September 3, 2026 at 10:30 PM").
 */
export const formatDateFull = (date) => {
  if (!date) return '';
  return moment(date).format('MMMM D, YYYY [at] h:mm A');
};

/**
 * Format date for chart labels (e.g., "Sep 3").
 */
export const formatDateShort = (date) => {
  if (!date) return '';
  return moment(date).format('MMM D');
};

/**
 * Truncate a URL for display (e.g., "https://example.com/very/long/path" → "example.com/very/lo...").
 */
export const truncateUrl = (url, maxLength = 40) => {
  if (!url) return '';
  // Remove protocol
  let clean = url.replace(/^https?:\/\//, '').replace(/^www\./, '');
  if (clean.length <= maxLength) return clean;
  return clean.substring(0, maxLength - 3) + '...';
};

/**
 * Truncate any text string.
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Get greeting based on time of day.
 */
export const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
};

/**
 * Get current date formatted (e.g., "Wednesday, Sep 3, 2026").
 */
export const getCurrentDateFormatted = () => {
  return moment().format('dddd, MMM D, YYYY');
};

/**
 * Format percentage with + or - sign.
 */
export const formatPercentage = (value) => {
  if (value === null || value === undefined) return '0%';
  const prefix = value >= 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}%`;
};

/**
 * Format currency (e.g., 9 → "$9.00").
 */
export const formatCurrency = (amount, currency = 'USD') => {
  if (amount === null || amount === undefined) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format plan ID to display name.
 */
export const formatPlanName = (planId) => {
  const plans = {
    free: 'Free',
    pro: 'Pro',
    business: 'Business',
  };
  return plans[planId?.toLowerCase()] || 'Free';
};

/**
 * Get plan emoji.
 */
export const getPlanEmoji = (planId) => {
  const emojis = {
    free: '🆓',
    pro: '⚡',
    business: '🚀',
  };
  return emojis[planId?.toLowerCase()] || '🆓';
};
