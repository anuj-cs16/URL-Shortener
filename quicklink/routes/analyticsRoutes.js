/**
 * @file       analyticsRoutes.js
 * @description Configures Express router endpoints for tracking click metrics and aggregates.
 * @module     routes/analyticsRoutes
 * @requires   express
 * @requires   controllers/analyticsController
 * @requires   middleware/auth
 */

'use strict';

const express = require('express');
const router = express.Router();

const {
  getDashboardStats,
  getClicksOverTime,
  getDeviceStats,
  getBrowserStats,
  getCountryStats,
  getUrlAnalytics,
  getTopUrls,
  getReferrerStats,
} = require('../controllers/analyticsController');

const { optionalAuth } = require('../middleware/auth');

// Allow optional user context identification for requests
router.use(optionalAuth);

router.get('/dashboard', getDashboardStats);
router.get('/clicks-over-time', getClicksOverTime);
router.get('/devices', getDeviceStats);
router.get('/browsers', getBrowserStats);
router.get('/countries', getCountryStats);
router.get('/url/:shortCode', getUrlAnalytics);
router.get('/top-urls', getTopUrls);
router.get('/referrers', getReferrerStats);

module.exports = router;
