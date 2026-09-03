/**
 * @file constants.js
 * @description Application-wide constants including storage keys, plan limits, and API endpoint paths.
 */

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@quicklink_auth_token',
  USER_DATA: '@quicklink_user_data',
  REFRESH_TOKEN: '@quicklink_refresh_token',
  THEME: '@quicklink_theme',
  ONBOARDING: '@quicklink_onboarding',
  NOTIFICATIONS: '@quicklink_notifications',
  CACHED_URLS: '@quicklink_cached_urls',
  CACHED_STATS: '@quicklink_cached_stats',
};

export const PLAN_LIMITS = {
  free: { urlsPerMonth: 10, clicksPerMonth: 1000 },
  pro: { urlsPerMonth: 500, clicksPerMonth: 50000 },
  business: { urlsPerMonth: -1, clicksPerMonth: -1 },
};

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    PROFILE: '/api/auth/profile',
    PASSWORD: '/api/auth/password',
  },
  URLS: {
    SHORTEN: '/api/shorten',
    ALL: '/api/urls',
    DETAIL: '/api/urls/',       // + shortCode
    QR: '/api/urls/',           // + shortCode + /qr
    DELETE: '/api/urls/',       // + shortCode
  },
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard',
    CLICKS: '/api/analytics/clicks-over-time',
    DEVICES: '/api/analytics/devices',
    BROWSERS: '/api/analytics/browsers',
    COUNTRIES: '/api/analytics/countries',
    URL: '/api/analytics/url/',  // + shortCode
    TOP_URLS: '/api/analytics/top-urls',
    REFERRERS: '/api/analytics/referrers',
  },
  NOTIFICATIONS: {
    ALL: '/api/notifications',
    READ_ALL: '/api/notifications/read-all',
    READ_ONE: '/api/notifications/',    // + id + /read
    DELETE: '/api/notifications/',      // + id
    EMAIL_SETTINGS: '/api/notifications/email-settings',
  },
  SECURITY: {
    OVERVIEW: '/api/security/overview',
    ACTIVITY: '/api/security/activity',
    SESSIONS: '/api/security/sessions',
    TERMINATE_ALL: '/api/security/sessions/terminate-all',
    SETUP_2FA: '/api/security/2fa/setup',
    ENABLE_2FA: '/api/security/2fa/enable',
    DISABLE_2FA: '/api/security/2fa/disable',
    VERIFY_2FA: '/api/security/2fa/verify',
    BACKUP_CODES: '/api/security/2fa/backup-codes',
  },
  SUBSCRIPTION: {
    PLANS: '/api/subscription/plans',
    CURRENT: '/api/subscription/current',
    USAGE: '/api/subscription/usage',
    CHECKOUT: '/api/subscription/checkout',
    PORTAL: '/api/subscription/portal',
    CANCEL: '/api/subscription/cancel',
    PAYMENTS: '/api/subscription/payments',
  },
  HEALTH: '/api/health',
};

export const NOTIFICATION_TYPES = {
  WELCOME: 'welcome',
  URL_CREATED: 'url_created',
  CLICK_MILESTONE: 'click_milestone',
  WEEKLY_REPORT: 'weekly_report',
  URL_EXPIRING: 'url_expiring',
  PAYMENT: 'payment',
  SECURITY: 'security',
};

export const NOTIFICATION_ICONS = {
  welcome: '👋',
  url_created: '🔗',
  click_milestone: '🎉',
  weekly_report: '📊',
  url_expiring: '⚠️',
  payment: '💳',
  security: '🔒',
};

export const DATE_RANGES = [
  { label: '7D', value: 7 },
  { label: '30D', value: 30 },
  { label: '90D', value: 90 },
];

export const URL_FILTERS = ['All', 'Active', 'Expired', 'Top Clicked'];

export const SORT_OPTIONS = [
  { label: 'Newest first', value: 'newest' },
  { label: 'Oldest first', value: 'oldest' },
  { label: 'Most clicks', value: 'most_clicks' },
  { label: 'Least clicks', value: 'least_clicks' },
];

export const APP_VERSION = '1.0.0';
