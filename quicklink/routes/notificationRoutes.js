/**
 * @file       notificationRoutes.js
 * @description Route definitions for notification alerts and email subscription preferences.
 *              Applies isAuthenticated guard to all routes.
 * @module     routes/notificationRoutes
 * @requires   express
 * @requires   controllers/notificationController
 * @requires   middleware/auth
 * @created    2026-08-12
 */

'use strict';

const express = require('express');
const router = express.Router();

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getEmailSettings,
  updateEmailSettings,
  testEmailSend,
} = require('../controllers/notificationController');

const { isAuthenticated } = require('../middleware/auth');

// All notification routes require authentication
router.use(isAuthenticated);

// In-app notifications resource
router.get('/', getNotifications);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', markAsRead);
router.delete('/:id', deleteNotification);

// User email preferences
router.get('/email-settings', getEmailSettings);
router.put('/email-settings', updateEmailSettings);

// Testing SMTP dispatch configurations
router.post('/test-email', testEmailSend);

module.exports = router;
