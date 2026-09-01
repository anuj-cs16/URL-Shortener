/**
 * @file       domainRoutes.js
 * @description Express router for custom domain management endpoints.
 * @module     routes/domainRoutes
 * @requires   express
 * @requires   controllers/domainController
 * @requires   middleware/auth
 * @requires   middleware/usageLimiter
 */

'use strict';

const express = require('express');
const router = express.Router();

const {
  addCustomDomain,
  verifyDomain,
  getDomains,
  getDomainStatus,
  setDefaultDomain,
  removeDomain,
  recheckDns,
  getDomainSetupGuide,
} = require('../controllers/domainController');

const { isAuthenticated } = require('../middleware/auth');
const { checkBusinessPlan } = require('../middleware/usageLimiter');

// All routes require authentication
router.use(isAuthenticated);

// Setup guide (placed before /:domain routes to avoid matching)
router.get('/setup-guide', getDomainSetupGuide);

// Domain CRUD
router.post('/', checkBusinessPlan, addCustomDomain);
router.get('/', getDomains);

// Domain-specific operations
router.post('/:domain/verify', verifyDomain);
router.get('/:domain/status', getDomainStatus);
router.put('/:domain/default', setDefaultDomain);
router.delete('/:domain', removeDomain);
router.post('/:domain/recheck', recheckDns);

module.exports = router;
