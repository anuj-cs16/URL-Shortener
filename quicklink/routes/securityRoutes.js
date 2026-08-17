/**
 * @file       securityRoutes.js
 * @description Route definition mapping for user security, multi-factor configs, and active sessions.
 * @module     routes/securityRoutes
 */

'use strict';

const express = require('express');
const router = express.Router();

const {
  setupTwoFactor,
  enableTwoFactor,
  disableTwoFactor,
  verifyTwoFactor,
  getBackupCodes,
  regenerateBackupCodes,
  getLoginActivity,
  getSecurityOverview,
  reportSuspiciousActivity,
  blockIpAddress,
  getActiveSessions,
  terminateAllSessions,
} = require('../controllers/securityController');

const { isAuthenticated } = require('../middleware/auth');
const { requireTwoFactor, sanitizeInput } = require('../middleware/security');

// Global middleware on all security endpoints
router.use(isAuthenticated);
router.use(sanitizeInput);

// Two Factor configurations
router.post('/2fa/setup', setupTwoFactor);
router.post('/2fa/enable', enableTwoFactor);
router.post('/2fa/disable', requireTwoFactor, disableTwoFactor);
router.post('/2fa/verify', verifyTwoFactor);
router.get('/2fa/backup-codes', getBackupCodes);
router.post('/2fa/backup-codes/regenerate', requireTwoFactor, regenerateBackupCodes);

// Security logs & activity audits
router.get('/activity', getLoginActivity);
router.get('/overview', getSecurityOverview);
router.post('/report', reportSuspiciousActivity);

// Active session audits
router.get('/sessions', getActiveSessions);
router.post('/sessions/terminate-all', requireTwoFactor, terminateAllSessions);

// Blacklist Admin bindings
router.post('/block-ip', blockIpAddress);

module.exports = router;
