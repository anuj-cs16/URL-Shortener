/**
 * @file       exportRoutes.js
 * @description Route definitions for downloading URLs and analytics history data formats, restricted to Pro+.
 * @module     routes/exportRoutes
 * @requires   express
 * @requires   controllers/exportController
 * @requires   middleware/auth
 * @requires   config/plans
 */

'use strict';

const express = require('express');
const router = express.Router();

const { exportUrlsCsv, exportUrlsJson, exportAnalyticsCsv } = require('../controllers/exportController');
const { isAuthenticated } = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const { isFeatureAvailable } = require('../config/plans');

/**
 * Middleware: Gates export functionality to Pro+ tier.
 */
const checkExportAccess = async (req, res, next) => {
  try {
    const sub = await Subscription.findOne({ userId: req.user._id });
    const planId = sub ? sub.planId : 'free';

    if (!isFeatureAvailable(planId, 'exportData')) {
      return res.status(403).json({
        success: false,
        message: 'Data export requires a Pro or Business plan',
        feature: 'exportData',
        requiredPlan: 'pro',
        upgradeUrl: '/pricing',
      });
    }
    next();
  } catch (error) {
    next(error);
  }
};

// All export actions require authentication and premium access
router.use(isAuthenticated);
router.use(checkExportAccess);

router.get('/urls/csv', exportUrlsCsv);
router.get('/urls/json', exportUrlsJson);
router.get('/analytics/csv', exportAnalyticsCsv);

module.exports = router;
