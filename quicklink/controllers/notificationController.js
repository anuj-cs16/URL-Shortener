/**
 * @file       notificationController.js
 * @description Controller methods for handling in-app notifications and email subscription preferences.
 * @module     controllers/notificationController
 * @requires   models/Notification
 * @requires   models/EmailSettings
 * @requires   utils/emailService
 * @created    2026-08-12
 */

'use strict';

const Notification = require('../models/Notification');
const EmailSettings = require('../models/EmailSettings');
const emailService = require('../utils/emailService');

/**
 * Retrieves in-app notifications for the authenticated user.
 * @route   GET /api/notifications
 * @access  Private
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Fetch last 50 notifications
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        unreadCount,
        total: notifications.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Marks a specific notification as read.
 * @route   PUT /api/notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      data: notification,
      message: 'Notification marked as read',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Marks all notifications for the user as read.
 * @route   PUT /api/notifications/read-all
 * @access  Private
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: {
        modifiedCount: result.modifiedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a specific notification.
 * @route   DELETE /api/notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, userId });
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets email settings for the authenticated user (creates defaults if missing).
 * @route   GET /api/notifications/email-settings
 * @access  Private
 */
const getEmailSettings = async (req, res, next) => {
  try {
    const userId = req.user._id;

    let settings = await EmailSettings.findOne({ userId });
    if (!settings) {
      settings = await EmailSettings.create({ userId });
    }

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates email subscription preferences.
 * @route   PUT /api/notifications/email-settings
 * @access  Private
 */
const updateEmailSettings = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const {
      weeklyReport,
      urlCreated,
      clickMilestone,
      urlExpiring,
      urlExpired,
      loginAlert,
      milestoneValues,
    } = req.body;

    // Validate milestoneValues is an array of numbers if provided
    if (milestoneValues !== undefined && !Array.isArray(milestoneValues)) {
      return res.status(400).json({
        success: false,
        message: 'milestoneValues must be an array of numbers',
      });
    }

    let settings = await EmailSettings.findOne({ userId });
    if (!settings) {
      settings = new EmailSettings({ userId });
    }

    if (weeklyReport !== undefined) settings.weeklyReport = !!weeklyReport;
    if (urlCreated !== undefined) settings.urlCreated = !!urlCreated;
    if (clickMilestone !== undefined) settings.clickMilestone = !!clickMilestone;
    if (urlExpiring !== undefined) settings.urlExpiring = !!urlExpiring;
    if (urlExpired !== undefined) settings.urlExpired = !!urlExpired;
    if (loginAlert !== undefined) settings.loginAlert = !!loginAlert;
    if (milestoneValues !== undefined) settings.milestoneValues = milestoneValues;

    await settings.save();

    res.status(200).json({
      success: true,
      data: settings,
      message: 'Email preferences updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sends a test welcome email to verify SMTP transporter configurations.
 * @route   POST /api/notifications/test-email
 * @access  Private
 */
const testEmailSend = async (req, res, next) => {
  try {
    const user = req.user;

    const emailSent = await emailService.sendWelcomeEmail(user);
    if (emailSent) {
      res.status(200).json({
        success: true,
        message: `Test email sent successfully to ${user.email}`,
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'SMTP dispatch failed. Please verify environment configs.',
      });
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getEmailSettings,
  updateEmailSettings,
  testEmailSend,
};
