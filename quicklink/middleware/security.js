/**
 * @file       security.js
 * @description Authentication guards, IP rate limiters, lockout checks, 2FA validators, and input sanitizers.
 * @module     middleware/security
 */

'use strict';

const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const BlockedIp = require('../models/BlockedIp');
const User = require('../models/User');

/**
 * Middleware: Blocks requests from blacklisted IP addresses.
 */
const checkBlockedIp = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const blocked = await BlockedIp.findOne({ ipAddress });

    if (blocked) {
      if (blocked.isPermanent) {
        return res.status(403).json({
          success: false,
          message: 'Access denied from this IP address',
        });
      }

      if (blocked.expiresAt && blocked.expiresAt > Date.now()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied from this IP address',
        });
      }

      // If expired, delete the block record
      await BlockedIp.deleteOne({ _id: blocked._id });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Prevents authentication attempts if account is temporarily locked.
 */
const checkAccountLocked = async (req, res, next) => {
  try {
    // Only apply to POST /api/auth/login
    if (!req.path.includes('/login') || req.method !== 'POST') {
      return next();
    }

    const { email } = req.body;
    if (!email) {
      return next();
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return next();
    }

    if (user.isAccountLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked. Try again in ${minutesLeft} minutes`,
        lockedUntil: user.lockUntil,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Flags suspicious login attempts based on IP histories, country changes, or off-hours.
 */
const detectSuspiciousActivity = async (req, res, next) => {
  try {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const user = req.user;
    const LoginActivity = mongoose.model('LoginActivity');

    let isSuspicious = false;
    let suspiciousReason = '';

    // 1. Check for brute force failures from same IP (last 10 mins)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const failedLoginsCount = await LoginActivity.countDocuments({
      ipAddress: ip,
      activityType: 'login_failed',
      createdAt: { $gte: tenMinutesAgo },
    });

    if (failedLoginsCount > 5) {
      isSuspicious = true;
      suspiciousReason = `More than 5 failed logins (${failedLoginsCount}) from this IP in the last 10 minutes.`;
    }

    // 2. Check for multiple distinct users logged in from this IP in the last 24h
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const distinctUsers = await LoginActivity.distinct('userId', {
      ipAddress: ip,
      activityType: 'login_success',
      createdAt: { $gte: twentyFourHoursAgo },
    });

    if (distinctUsers.length > 3) {
      isSuspicious = true;
      suspiciousReason = `Multiple accounts (${distinctUsers.length}) logged in from same IP in the last 24 hours.`;
    }

    // 3. User specific profile flags (if authenticated user is available)
    if (user) {
      const currentCountry = req.headers['cf-ipcountry'] || 'Unknown';
      if (currentCountry !== 'Unknown' && user.knownIpAddresses.length > 0) {
        const securityHelper = require('../utils/securityHelper');
        if (securityHelper.isNewLocation(user, currentCountry)) {
          isSuspicious = true;
          suspiciousReason = `Login country change detected: IP country is ${currentCountry}.`;
        }
      }

      // Unusual hour check (2AM to 5AM)
      const hour = new Date().getHours();
      if (hour >= 2 && hour <= 5) {
        isSuspicious = true;
        suspiciousReason = `Login requested at suspicious hours: ${hour}:00.`;
      }
    }

    req.isSuspicious = isSuspicious;
    req.suspiciousReason = isSuspicious ? suspiciousReason : null;

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Demands TOTP or backup token verification before continuing to route handler.
 */
const requireTwoFactor = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this',
      });
    }

    if (user.isTwoFactorEnabled) {
      const verified = req.twoFactorVerified || (req.session && req.session.twoFactorVerified);
      if (!verified) {
        return res.status(403).json({
          success: false,
          message: 'Two factor authentication required',
          requiresTwoFactor: true,
        });
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Internal Express Rate Limit configurations
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 100,
  statusCode: 429,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 mins
  max: 10,
  statusCode: 429,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please retry after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Middleware: Stricter rate limiting rules depending on route context.
 */
const ipRateLimiter = (req, res, next) => {
  if (req.path.includes('/login') || req.path.includes('/register') || req.path.includes('/2fa')) {
    return authLimiter(req, res, next);
  }
  return generalLimiter(req, res, next);
};

const cleanXss = (str) => {
  if (typeof str !== 'string') return str;
  return str.replace(/<[^>]*>?/gm, '');
};

// Deep in-place trimmer and NoSQL/XSS sanitizer
const sanitizeObject = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$')) {
        delete obj[key];
      } else if (typeof obj[key] === 'string') {
        obj[key] = cleanXss(obj[key]).trim();
      } else if (typeof obj[key] === 'object') {
        sanitizeObject(obj[key]);
      }
    }
  }
};

/**
 * Middleware: Cleans incoming params, query headers, and trims body strings to prevent injection.
 */
const sanitizeInput = (req, res, next) => {
  if (req.body) {
    sanitizeObject(req.body);
  }
  if (req.query) {
    sanitizeObject(req.query);
  }
  if (req.params) {
    sanitizeObject(req.params);
  }

  next();
};

module.exports = {
  checkBlockedIp,
  checkAccountLocked,
  detectSuspiciousActivity,
  requireTwoFactor,
  ipRateLimiter,
  sanitizeInput,
};
