/**
 * @file       aiRoutes.js
 * @description Express router for QuickLink AI Intelligence Suite endpoints.
 * @module     routes/aiRoutes
 */

'use strict';

const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const aiController = require('../controllers/aiController');

router.post('/suggestions', isAuthenticated, aiController.getSmartSuggestions);
router.post('/safety-check', isAuthenticated, aiController.checkUrlSafety);
router.get('/predictions/:shortCode', isAuthenticated, aiController.getUrlPredictions);
router.post('/utm-builder', isAuthenticated, aiController.buildSmartUtm);
router.post('/copilot', isAuthenticated, aiController.sendCopilotMessage);
router.get('/copilot/history', isAuthenticated, aiController.getCopilotHistory);

module.exports = router;
