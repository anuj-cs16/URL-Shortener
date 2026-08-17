/**
 * @file       securityController.js
 * @description Controllers managing multi-factor configuration, verification token audits, IP blacklist admins, and login reports.
 * @module     controllers/securityController
 */

'use strict';

const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const TwoFactorAuth = require('../models/TwoFactorAuth');
const LoginActivity = require('../models/LoginActivity');
const BlockedIp = require('../models/BlockedIp');
const Notification = require('../models/Notification');
const securityHelper = require('../utils/securityHelper');
const emailService = require('../utils/emailService');

/**
 * Initiates TOTP 2FA secret configuration.
 * @route   POST /api/security/2fa/setup
 */
const setupTwoFactor = async (req, res, next) => {
  try {
    const user = req.user;
    if (user.isTwoFactorEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is already enabled.',
      });
    }

    const { secret, otpauthUrl, qrCodeUrl } = await securityHelper.generateTwoFactorSecret(user.email);
    const encryptedSecret = securityHelper.encryptData(secret);

    // Save/update temp record
    await TwoFactorAuth.findOneAndUpdate(
      { userId: user._id },
      { secret: encryptedSecret, isEnabled: false },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        secret,
        qrCode: qrCodeUrl,
        manualEntry: secret,
      },
      message: 'Scan QR code with authenticator app',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validates verification token and enables Two Factor on the user document.
 * @route   POST /api/security/2fa/enable
 */
const enableTwoFactor = async (req, res, next) => {
  try {
    const { token, secret } = req.body;
    const user = req.user;

    if (!token || !secret) {
      return res.status(400).json({
        success: false,
        message: 'Token and secret are required',
      });
    }

    const isValid = securityHelper.verifyTwoFactorToken(secret, token);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    const { plainCodes, hashedCodes } = securityHelper.generateBackupCodes(8);
    const encryptedSecret = securityHelper.encryptData(secret);

    await TwoFactorAuth.findOneAndUpdate(
      { userId: user._id },
      {
        secret: encryptedSecret,
        isEnabled: true,
        backupCodes: hashedCodes,
        usedBackupCodes: [],
        enabledAt: new Date(),
      },
      { upsert: true }
    );

    user.isTwoFactorEnabled = true;
    await user.calculateSecurityScore();
    await user.save();

    // Log Activity
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const { getBrowserInfo, getDeviceType, getOSInfo, getLocationInfo } = require('../utils/analyticsHelper');
    const userAgent = req.headers['user-agent'] || '';
    const browser = getBrowserInfo(userAgent);
    const os = getOSInfo(userAgent);
    const device = getDeviceType(userAgent);
    const location = getLocationInfo(ip);

    await LoginActivity.create({
      userId: user._id,
      activityType: 'two_factor_enabled',
      ipAddress: ip,
      country: location.country || 'Unknown',
      city: location.city || 'Unknown',
      browser: `${browser.browser || 'Unknown'} ${browser.version || ''}`.trim(),
      operatingSystem: os,
      deviceType: device || 'unknown',
      userAgent,
    });

    // Send Mail Alert
    emailService.sendTwoFactorEnabledEmail(user).catch((err) => {
      console.error(`Failed to send 2FA enabled email: ${err.message}`);
    });

    res.status(200).json({
      success: true,
      data: {
        backupCodes: plainCodes,
      },
      message: '2FA enabled. Save backup codes safely!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Disables Two Factor for user. Requires password and TOTP token.
 * @route   POST /api/security/2fa/disable
 */
const disableTwoFactor = async (req, res, next) => {
  try {
    const { password, token } = req.body;
    const user = req.user;

    if (!password || !token) {
      return res.status(400).json({
        success: false,
        message: 'Password and token are required',
      });
    }

    const dbUser = await User.findById(user._id).select('+password');
    const isMatch = await dbUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    const twoFA = await TwoFactorAuth.findOne({ userId: user._id });
    if (!twoFA || !twoFA.isEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is not enabled',
      });
    }

    const decryptedSecret = securityHelper.decryptData(twoFA.secret);
    const isValid = securityHelper.verifyTwoFactorToken(decryptedSecret, token);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication code',
      });
    }

    await TwoFactorAuth.deleteOne({ _id: twoFA._id });

    user.isTwoFactorEnabled = false;
    await user.calculateSecurityScore();
    await user.save();

    // Log Activity
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const { getBrowserInfo, getDeviceType, getOSInfo, getLocationInfo } = require('../utils/analyticsHelper');
    const userAgent = req.headers['user-agent'] || '';
    const browser = getBrowserInfo(userAgent);
    const os = getOSInfo(userAgent);
    const device = getDeviceType(userAgent);
    const location = getLocationInfo(ip);

    await LoginActivity.create({
      userId: user._id,
      activityType: 'two_factor_disabled',
      ipAddress: ip,
      country: location.country || 'Unknown',
      city: location.city || 'Unknown',
      browser: `${browser.browser || 'Unknown'} ${browser.version || ''}`.trim(),
      operatingSystem: os,
      deviceType: device || 'unknown',
      userAgent,
    });

    // Send Mail Alert
    emailService.sendTwoFactorDisabledEmail(user, ip).catch((err) => {
      console.error(`Failed to send 2FA disabled email: ${err.message}`);
    });

    res.status(200).json({
      success: true,
      message: 'Two-factor authentication has been disabled',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Performs verification on token (accepts TOTP or backup code). If successful, issues full auth JWT token.
 * @route   POST /api/security/2fa/verify
 */
const verifyTwoFactor = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = req.user;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Authentication token/code is required',
      });
    }

    const twoFA = await TwoFactorAuth.findOne({ userId: user._id });
    if (!twoFA || !twoFA.isEnabled) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor authentication is not enabled',
      });
    }

    const decryptedSecret = securityHelper.decryptData(twoFA.secret);
    let isTotpValid = false;

    try {
      isTotpValid = securityHelper.verifyTwoFactorToken(decryptedSecret, token);
    } catch (e) {}

    let isBackupValid = false;
    let backupCodeIndex = -1;

    if (!isTotpValid) {
      backupCodeIndex = securityHelper.verifyBackupCode(twoFA.backupCodes, token);
      if (backupCodeIndex !== -1) {
        isBackupValid = true;
      }
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const { getBrowserInfo, getDeviceType, getOSInfo, getLocationInfo } = require('../utils/analyticsHelper');
    const userAgent = req.headers['user-agent'] || '';
    const browser = getBrowserInfo(userAgent);
    const os = getOSInfo(userAgent);
    const device = getDeviceType(userAgent);
    const location = getLocationInfo(ip);

    if (!isTotpValid && !isBackupValid) {
      // Log Failures
      await LoginActivity.create({
        userId: user._id,
        activityType: 'two_factor_failed',
        ipAddress: ip,
        country: location.country || 'Unknown',
        city: location.city || 'Unknown',
        browser: `${browser.browser || 'Unknown'} ${browser.version || ''}`.trim(),
        operatingSystem: os,
        deviceType: device || 'unknown',
        userAgent,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid authentication code',
      });
    }

    let warning = null;
    if (isBackupValid) {
      twoFA.backupCodes.splice(backupCodeIndex, 1);
      twoFA.usedBackupCodes.push(securityHelper.hashCode(token));

      if (twoFA.backupCodes.length < 3) {
        warning = `Less than 3 backup codes left (${twoFA.backupCodes.length}). Please regenerate them.`;
      }
    }

    twoFA.lastUsedAt = new Date();
    await twoFA.save();

    // Log success
    await LoginActivity.create({
      userId: user._id,
      activityType: 'two_factor_success',
      ipAddress: ip,
      country: location.country || 'Unknown',
      city: location.city || 'Unknown',
      browser: `${browser.browser || 'Unknown'} ${browser.version || ''}`.trim(),
      operatingSystem: os,
      deviceType: device || 'unknown',
      userAgent,
    });

    req.session = req.session || {};
    req.session.twoFactorVerified = true;
    req.twoFactorVerified = true;

    // Issue Full authenticated token cookie
    const fullToken = user.getJwtToken(true);
    const cookieExpireDays = parseInt(process.env.COOKIE_EXPIRE, 10) || 7;
    const cookieOptions = {
      expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: 'lax',
    };
    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

    res.status(200).cookie('token', fullToken, cookieOptions).json({
      success: true,
      message: 'Two factor verification successful',
      warning,
      data: {
        token: fullToken,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns user remaining backup codes count stats.
 * @route   GET /api/security/2fa/backup-codes
 */
const getBackupCodes = async (req, res, next) => {
  try {
    const { password } = req.query;
    const user = req.user;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password query parameter is required',
      });
    }

    const dbUser = await User.findById(user._id).select('+password');
    const isMatch = await dbUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    const twoFA = await TwoFactorAuth.findOne({ userId: user._id });
    if (!twoFA) {
      return res.status(404).json({
        success: false,
        message: 'Two-factor authentication details not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        remainingCodes: twoFA.backupCodes.length,
        usedCodes: twoFA.usedBackupCodes.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Invalidates and regenerates a new set of backup codes.
 * @route   POST /api/security/2fa/backup-codes/regenerate
 */
const regenerateBackupCodes = async (req, res, next) => {
  try {
    const { token } = req.body;
    const user = req.user;

    const twoFA = await TwoFactorAuth.findOne({ userId: user._id });
    if (!twoFA || !twoFA.isEnabled) {
      return res.status(400).json({
        success: false,
        message: '2FA is not enabled',
      });
    }

    const decryptedSecret = securityHelper.decryptData(twoFA.secret);
    const isValid = securityHelper.verifyTwoFactorToken(decryptedSecret, token);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid verification code',
      });
    }

    const { plainCodes, hashedCodes } = securityHelper.generateBackupCodes(8);
    twoFA.backupCodes = hashedCodes;
    twoFA.usedBackupCodes = [];
    await twoFA.save();

    // Log Activity
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const { getBrowserInfo, getDeviceType, getOSInfo, getLocationInfo } = require('../utils/analyticsHelper');
    const userAgent = req.headers['user-agent'] || '';
    const browser = getBrowserInfo(userAgent);
    const os = getOSInfo(userAgent);
    const device = getDeviceType(userAgent);
    const location = getLocationInfo(ip);

    await LoginActivity.create({
      userId: user._id,
      activityType: 'two_factor_enabled',
      ipAddress: ip,
      country: location.country || 'Unknown',
      city: location.city || 'Unknown',
      browser: `${browser.browser || 'Unknown'} ${browser.version || ''}`.trim(),
      operatingSystem: os,
      deviceType: device || 'unknown',
      userAgent,
      suspiciousReason: 'Regenerated backup codes',
    });

    res.status(200).json({
      success: true,
      data: {
        backupCodes: plainCodes,
      },
      message: 'New backup codes generated. Save backup codes safely!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Paginated query for user security logs.
 * @route   GET /api/security/activity
 */
const getLoginActivity = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const type = req.query.type || 'all';

    const filter = { userId };
    if (type !== 'all') {
      if (type === 'suspicious') {
        filter.isSuspicious = true;
      } else {
        filter.activityType = type;
      }
    }

    const total = await LoginActivity.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    const activities = await LoginActivity.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const suspicious = await LoginActivity.countDocuments({ userId, isSuspicious: true });

    res.status(200).json({
      success: true,
      data: {
        activities,
        total,
        page,
        pages,
        suspicious,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Audits account security settings and computes profile overview score.
 * @route   GET /api/security/overview
 */
const getSecurityOverview = async (req, res, next) => {
  try {
    const user = req.user;
    const twoFA = await TwoFactorAuth.findOne({ userId: user._id });
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentLogins = await LoginActivity.countDocuments({
      userId: user._id,
      activityType: 'login_success',
      createdAt: { $gte: thirtyDaysAgo },
    });

    const suspiciousActivities = await LoginActivity.countDocuments({
      userId: user._id,
      isSuspicious: true,
      createdAt: { $gte: thirtyDaysAgo },
    });

    const failedLogins = await LoginActivity.countDocuments({
      userId: user._id,
      activityType: 'login_failed',
      createdAt: { $gte: thirtyDaysAgo },
    });

    const lastLoginLog = await LoginActivity.findOne({
      userId: user._id,
      activityType: 'login_success',
    }).sort({ createdAt: -1 });

    const lastLogin = lastLoginLog
      ? {
          time: lastLoginLog.createdAt,
          ip: lastLoginLog.ipAddress,
          country: lastLoginLog.country,
          browser: lastLoginLog.browser,
          city: lastLoginLog.city,
          device: lastLoginLog.deviceType,
          id: lastLoginLog._id,
        }
      : null;

    const securityScore = await user.calculateSecurityScore();

    const recommendations = [];
    recommendations.push({
      id: 'enable_2fa',
      action: 'Enable 2FA for better security',
      description: 'Two factor authentication adds an extra layer of protection to your account.',
      completed: !!(twoFA && twoFA.isEnabled),
    });

    recommendations.push({
      id: 'strong_password',
      action: 'Use a stronger password',
      description: 'Make sure your password is longer than 12 characters and includes symbols.',
      completed: !!(user.password && user.password.length > 12),
    });

    recommendations.push({
      id: 'review_activity',
      action: 'Review recent suspicious activity logs',
      description: 'Review logs to ensure there are no unrecognized devices or countries.',
      completed: suspiciousActivities === 0,
    });

    res.status(200).json({
      success: true,
      data: {
        securityScore,
        twoFactorEnabled: !!(twoFA && twoFA.isEnabled),
        recentLogins,
        suspiciousActivities,
        failedLogins,
        lastLogin,
        recommendations,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Reports a specific log activity as unauthorized/suspicious.
 * @route   POST /api/security/report
 */
const reportSuspiciousActivity = async (req, res, next) => {
  try {
    const { activityId } = req.body;
    const user = req.user;

    const log = await LoginActivity.findOne({ _id: activityId, userId: user._id });
    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Login activity record not found',
      });
    }

    log.isSuspicious = true;
    log.suspiciousReason = 'Reported by user';
    await log.save();

    // Create database Notification
    await Notification.create({
      userId: user._id,
      type: 'login_alert',
      title: 'Suspicious Login Reported 🚨',
      message: `You reported a login from ${log.browser} (${log.country}, IP: ${log.ipAddress}) as suspicious.`,
      isEmailSent: true,
      emailSentAt: new Date(),
      metadata: { activityId: log._id },
    });

    // Send email alert
    emailService.sendSuspiciousLoginEmail(user, {
      ip: log.ipAddress,
      country: log.country,
      browser: log.browser,
      time: log.createdAt,
      device: log.deviceType,
      riskScore: 100,
      suspiciousReason: 'Reported by user',
    }).catch((err) => {
      console.error(`Failed to send suspicious login email: ${err.message}`);
    });

    res.status(200).json({
      success: true,
      message: 'Activity reported as suspicious. Security alerts sent.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admins endpoint to blacklists a remote IP address.
 * @route   POST /api/security/block-ip
 */
const blockIpAddress = async (req, res, next) => {
  try {
    const { ip, reason, duration } = req.body;

    if (!ip || !reason) {
      return res.status(400).json({
        success: false,
        message: 'IP address and reason are required',
      });
    }

    const ipRegex = /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/;
    if (!ipRegex.test(ip)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IP address format',
      });
    }

    let expiresAt = null;
    let isPermanent = true;

    if (duration) {
      expiresAt = new Date(Date.now() + parseInt(duration, 10) * 60 * 1000);
      isPermanent = false;
    }

    await BlockedIp.findOneAndUpdate(
      { ipAddress: ip },
      { reason, blockedBy: 'admin', expiresAt, isPermanent },
      { upsert: true, new: true }
    );

    res.status(200).json({
      success: true,
      message: `IP ${ip} blocked successfully.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Audits unique login locations/IPs from user logs.
 * @route   GET /api/security/sessions
 */
const getActiveSessions = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const successfulLogins = await LoginActivity.find({
      userId,
      activityType: 'login_success',
      createdAt: { $gte: thirtyDaysAgo },
    }).sort({ createdAt: -1 });

    const currentIp = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const sessions = [];
    const seenIps = new Set();

    for (const log of successfulLogins) {
      if (!seenIps.has(log.ipAddress)) {
        seenIps.add(log.ipAddress);
        sessions.push({
          ipAddress: log.ipAddress,
          country: log.country,
          city: log.city,
          browser: log.browser,
          deviceType: log.deviceType,
          operatingSystem: log.operatingSystem,
          lastActive: log.createdAt,
          isCurrent: log.ipAddress === currentIp,
        });
      }
    }

    if (!seenIps.has(currentIp)) {
      const { getBrowserInfo, getDeviceType, getOSInfo, getLocationInfo } = require('../utils/analyticsHelper');
      const userAgent = req.headers['user-agent'] || '';
      const browser = getBrowserInfo(userAgent);
      const os = getOSInfo(userAgent);
      const device = getDeviceType(userAgent);
      const location = getLocationInfo(currentIp);

      sessions.unshift({
        ipAddress: currentIp,
        country: location.country || 'Unknown',
        city: location.city || 'Unknown',
        browser: `${browser.browser || 'Unknown'} ${browser.version || ''}`.trim(),
        deviceType: device || 'unknown',
        operatingSystem: os,
        lastActive: new Date(),
        isCurrent: true,
      });
    }

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Invalidation trigger. Increments JWT tokenVersion/secret values and logs user out of all sessions.
 * @route   POST /api/security/sessions/terminate-all
 */
const terminateAllSessions = async (req, res, next) => {
  try {
    const { password } = req.body;
    const user = req.user;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required to terminate all sessions',
      });
    }

    const dbUser = await User.findById(user._id).select('+password');
    const isMatch = await dbUser.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password',
      });
    }

    const crypto = require('crypto');
    dbUser.jwtSecret = crypto.randomBytes(32).toString('hex');
    await dbUser.save();

    // Log Activity
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const { getBrowserInfo, getDeviceType, getOSInfo, getLocationInfo } = require('../utils/analyticsHelper');
    const userAgent = req.headers['user-agent'] || '';
    const browser = getBrowserInfo(userAgent);
    const os = getOSInfo(userAgent);
    const device = getDeviceType(userAgent);
    const location = getLocationInfo(ip);

    await LoginActivity.create({
      userId: user._id,
      activityType: 'logout',
      ipAddress: ip,
      country: location.country || 'Unknown',
      city: location.city || 'Unknown',
      browser: `${browser.browser || 'Unknown'} ${browser.version || ''}`.trim(),
      operatingSystem: os,
      deviceType: device || 'unknown',
      userAgent,
      suspiciousReason: 'All sessions terminated by user',
    });

    res.clearCookie('token');

    res.status(200).json({
      success: true,
      message: 'All sessions terminated successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
