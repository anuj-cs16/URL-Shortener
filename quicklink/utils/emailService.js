/**
 * @file       emailService.js
 * @description Nodemailer SMTP configuration and template mapping.
 *              Defines transactional email dispatch routines with preference checks.
 * @module     utils/emailService
 * @requires   nodemailer
 * @requires   nodemailer-express-handlebars
 * @requires   juice
 * @requires   models/EmailSettings
 * @created    2026-08-12
 */

'use strict';

const nodemailer = require('nodemailer');
const path = require('path');
const EmailSettings = require('../models/EmailSettings');

// Fallback defaults for mail configuration
const emailServiceType = process.env.EMAIL_SERVICE || '';
const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = parseInt(process.env.EMAIL_PORT, 10) || 587;
const emailUser = process.env.EMAIL_USER || '';
const emailPass = process.env.EMAIL_PASSWORD || '';
const emailFrom = process.env.EMAIL_FROM || 'QuickLink <noreply@quicklink.app>';
const appUrl = process.env.BASE_URL || 'http://localhost:5000';

let transporter;

try {
  const config = {
    host: emailHost,
    port: emailPort,
    secure: emailPort === 465, // True for 465, false for 587/others
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  };

  // If EMAIL_SERVICE is explicitly specified (e.g., 'gmail'), use default presets
  if (emailServiceType) {
    config.service = emailServiceType;
  }

  transporter = nodemailer.createTransport(config);
} catch (error) {
  console.error(`Email transporter initialization failed: ${error.message}`);
}

/**
 * Base email sender helper.
 * @param {Object} options - Sending configurations.
 * @param {string} options.to - Recipient email.
 * @param {string} options.subject - Email subject line.
 * @param {string} options.template - Template name (hbs filename without ext).
 * @param {Object} options.context - Variables passed to the template.
 * @returns {Promise<boolean>} True on success, false on failure.
 */
const sendEmail = async (options) => {
  if (process.env.NODE_ENV === 'test') {
    console.log(`[Email Service Mock]: Skipped sending email to ${options.to} (subject: ${options.subject}) in testing environment.`);
    return true;
  }

  if (process.env.NOTIFICATION_EMAIL_ENABLED === 'false') {
    console.log(`[Email Service]: Emails disabled by configuration. Skipped sending to ${options.to}.`);
    return true;
  }

  try {
    const fs = require('fs');
    const handlebars = require('handlebars');

    // Compile templates manually to avoid ESM require issues in test suites
    const layoutPath = path.join(__dirname, '..', 'templates', 'emails', 'layouts', 'main.hbs');
    const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${options.template}.hbs`);

    const layoutSource = fs.readFileSync(layoutPath, 'utf8');
    const templateSource = fs.readFileSync(templatePath, 'utf8');

    const layoutTemplate = handlebars.compile(layoutSource);
    const bodyTemplate = handlebars.compile(templateSource);

    const mergedContext = {
      ...options.context,
      appUrl,
    };

    const bodyHtml = bodyTemplate(mergedContext);
    const fullHtml = layoutTemplate({
      ...mergedContext,
      body: bodyHtml,
    });

    const mailOptions = {
      from: emailFrom,
      to: options.to,
      subject: options.subject,
      html: fullHtml,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${options.to}. MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${options.to}: ${error.message}`);
    return false;
  }
};

/**
 * Verifies the connection configuration of the transporter.
 * @returns {Promise<void>}
 */
const verifyEmailConnection = async () => {
  if (process.env.NODE_ENV === 'test') return;
  try {
    await transporter.verify();
    console.log('✅ Email service connected successfully');
  } catch (error) {
    console.error(`❌ Email service connection error: ${error.message}`);
  }
};

/**
 * Resolves user settings and returns whether notification type is enabled.
 * Defaults to true if no settings documents are found.
 * @param {string} userId - Mongo ID of the user.
 * @param {string} preferenceKey - Preference toggle name.
 * @returns {Promise<boolean>}
 */
const isPreferenceEnabled = async (userId, preferenceKey) => {
  try {
    const settings = await EmailSettings.findOne({ userId });
    if (!settings) return true; // default to true
    return !!settings[preferenceKey];
  } catch (e) {
    return true; // fallback
  }
};

/**
 * Transactional: Welcome Email on Registration.
 */
const sendWelcomeEmail = async (user) => {
  if (!user || !user.email) return false;
  return await sendEmail({
    to: user.email,
    subject: 'Welcome to QuickLink! 🔗',
    template: 'welcome',
    context: {
      name: user.name,
      loginUrl: `${appUrl}/login`,
    },
  });
};

/**
 * Transactional: Link creation alert.
 */
const sendUrlCreatedEmail = async (user, urlData) => {
  if (!user || !user.email) return false;
  const isEnabled = await isPreferenceEnabled(user._id, 'urlCreated');
  if (!isEnabled) return false;

  const expiresDateStr = new Date(urlData.expiresAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return await sendEmail({
    to: user.email,
    subject: 'Your short URL is ready! 🔗',
    template: 'url-created',
    context: {
      name: user.name,
      longUrl: urlData.longUrl,
      shortUrl: urlData.shortUrl,
      shortCode: urlData.shortCode,
      expiresAt: expiresDateStr,
    },
  });
};

/**
 * Transactional: Popularity clicks milestones.
 */
const sendClickMilestoneEmail = async (user, urlData, milestone) => {
  if (!user || !user.email) return false;
  const isEnabled = await isPreferenceEnabled(user._id, 'clickMilestone');
  if (!isEnabled) return false;

  // Verify if this specific milestone is enabled in users list
  try {
    const settings = await EmailSettings.findOne({ userId: user._id });
    if (settings && settings.milestoneValues && !settings.milestoneValues.includes(milestone)) {
      return false; // this specific milestone value not active
    }
  } catch (e) { /* fallback to true */ }

  const shortUrl = `${appUrl}/${urlData.shortCode}`;

  return await sendEmail({
    to: user.email,
    subject: `Congratulations! Your link hit ${milestone} clicks! 🎉`,
    template: 'click-milestone',
    context: {
      name: user.name,
      shortCode: urlData.shortCode,
      shortUrl,
      clicks: urlData.clicks,
      milestone,
    },
  });
};

/**
 * Transactional: Weekly performance report.
 */
const sendWeeklyReportEmail = async (user, reportData) => {
  if (!user || !user.email) return false;
  const isEnabled = await isPreferenceEnabled(user._id, 'weeklyReport');
  if (!isEnabled) return false;

  return await sendEmail({
    to: user.email,
    subject: 'Your Weekly Analytics Report 📊',
    template: 'weekly-report',
    context: {
      name: user.name,
      weekStart: reportData.weekStart,
      weekEnd: reportData.weekEnd,
      totalUrls: reportData.totalUrls,
      totalClicks: reportData.totalClicks,
      newUrlsThisWeek: reportData.newUrlsThisWeek,
      newClicksThisWeek: reportData.newClicksThisWeek,
      topUrl: reportData.topUrl,
      topUrlClicks: reportData.topUrlClicks,
      deviceBreakdown: reportData.deviceBreakdown,
      topCountry: reportData.topCountry,
    },
  });
};

/**
 * Transactional: Expiry warning 24-hours.
 */
const sendUrlExpiringEmail = async (user, urlData, hoursLeft = 24) => {
  if (!user || !user.email) return false;
  const isEnabled = await isPreferenceEnabled(user._id, 'urlExpiring');
  if (!isEnabled) return false;

  const shortUrl = `${appUrl}/${urlData.shortCode}`;
  const expiresDateStr = new Date(urlData.expiresAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return await sendEmail({
    to: user.email,
    subject: '⚠️ Warning: Your link is expiring soon',
    template: 'url-expiring',
    context: {
      name: user.name,
      shortUrl,
      shortCode: urlData.shortCode,
      longUrl: urlData.longUrl,
      expiresAt: expiresDateStr,
      hoursLeft,
    },
  });
};

/**
 * Transactional: Link expired notice.
 */
const sendUrlExpiredEmail = async (user, urlData) => {
  if (!user || !user.email) return false;
  const isEnabled = await isPreferenceEnabled(user._id, 'urlExpired');
  if (!isEnabled) return false;

  const createdDateStr = new Date(urlData.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return await sendEmail({
    to: user.email,
    subject: '🕐 Your short link has expired',
    template: 'url-expired',
    context: {
      name: user.name,
      shortCode: urlData.shortCode,
      longUrl: urlData.longUrl,
      totalClicks: urlData.clicks,
      createdAt: createdDateStr,
    },
  });
};

/**
 * Transactional: Password changed security alert (cannot be disabled).
 */
const sendPasswordChangedEmail = async (user, ipAddress) => {
  if (!user || !user.email) return false;

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return await sendEmail({
    to: user.email,
    subject: '🔐 Security Alert: Password Changed',
    template: 'password-changed',
    context: {
      name: user.name,
      changedAt: dateStr,
      ipAddress,
    },
  });
};

/**
 * Transactional: New login warning.
 */
const sendLoginAlertEmail = async (user, loginData) => {
  if (!user || !user.email) return false;
  const isEnabled = await isPreferenceEnabled(user._id, 'loginAlert');
  if (!isEnabled) return false;

  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return await sendEmail({
    to: user.email,
    subject: '🔔 Security Alert: New login detected',
    template: 'login-alert',
    context: {
      name: user.name,
      loginTime: dateStr,
      ipAddress: loginData.ipAddress,
      country: loginData.country,
      browser: loginData.browser,
      device: loginData.deviceType,
    },
  });
};

module.exports = {
  verifyEmailConnection,
  sendWelcomeEmail,
  sendUrlCreatedEmail,
  sendClickMilestoneEmail,
  sendWeeklyReportEmail,
  sendUrlExpiringEmail,
  sendUrlExpiredEmail,
  sendPasswordChangedEmail,
  sendLoginAlertEmail,
};
