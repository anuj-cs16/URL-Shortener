/**
 * @file       seoHelper.js
 * @description Provides metadata configs and JSON-LD schema utilities for React pages.
 * @module     utils/seoHelper
 */

'use strict';

/**
 * Metadata configuration mapping by page keys.
 */
const metadataConfig = {
  home: {
    title: 'QuickLink — Premium URL Shortener, Analytics & Security',
    description: 'Shorten long URLs, track advanced real-time click statistics, and protect your links with password encryption and 2FA authentication.',
    keywords: 'url shortener, link shortener, custom url, link analytics, secure links, qr code generator',
  },
  login: {
    title: 'Sign In | QuickLink',
    description: 'Access your QuickLink dashboard to manage shortened links and monitor click analytics.',
    keywords: 'login, quicklink login, sign in',
  },
  signup: {
    title: 'Create Account | QuickLink',
    description: 'Sign up for QuickLink to customize your short links and access real-time geo-tracking dashboard.',
    keywords: 'signup, create link account, link shortener free',
  },
  dashboard: {
    title: 'User Dashboard | QuickLink',
    description: 'Manage your links, configure expiration parameters, and monitor click statistics.',
    keywords: 'url management, link dashboard, statistics',
  },
  analytics: {
    title: 'Advanced Analytics | QuickLink',
    description: 'Review device types, browser clients, country metrics, and click frequency for your links.',
    keywords: 'link analytics, browser tracking, geo analytics',
  },
  security: {
    title: 'Security Settings | QuickLink',
    description: 'Configure two-factor authentication, monitor active sessions, and review security logs.',
    keywords: '2fa security, link security, user settings',
  },
  verify2fa: {
    title: 'Two-Factor Verification | QuickLink',
    description: 'Enter your 2FA verification code to access your account securely.',
    keywords: '2fa authentication, code verify',
  },
};

/**
 * Returns page-specific metadata config or fallback.
 * @param {string} pageKey - Key corresponding to page metadata.
 * @returns {Object} Metadata object.
 */
const getPageMeta = (pageKey) => {
  return metadataConfig[pageKey] || metadataConfig.home;
};

/**
 * Generates JSON-LD Structured Data for the website.
 * @returns {Object} JSON-LD structured schema.
 */
const getWebSiteSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    'name': 'QuickLink',
    'url': window.location.origin,
    'potentialAction': {
      '@type': 'SearchAction',
      'target': `${window.location.origin}/?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
};

/**
 * Generates JSON-LD Structured Data for the WebApplication.
 * @returns {Object} JSON-LD structured schema.
 */
const getWebAppSchema = () => {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    'name': 'QuickLink',
    'url': window.location.origin,
    'applicationCategory': 'UtilitiesApplication',
    'operatingSystem': 'All',
    'browserRequirements': 'Requires HTML5 support',
    'offers': {
      '@type': 'Offer',
      'price': '0',
      'priceCurrency': 'USD',
    },
  };
};

module.exports = {
  getPageMeta,
  getWebSiteSchema,
  getWebAppSchema,
};
