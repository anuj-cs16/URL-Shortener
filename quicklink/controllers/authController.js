/**
 * @file       authController.js
 * @description Authentication controller methods for user registration, login, logout, profile edits, and credentials change.
 * @module     controllers/authController
 * @requires   models/User
 * @requires   models/Url
 */

'use strict';

const User = require('../models/User');
const Url = require('../models/Url');
const EmailSettings = require('../models/EmailSettings');
const Notification = require('../models/Notification');
const LoginActivity = require('../models/LoginActivity');
const Subscription = require('../models/Subscription');
const { getCurrentUsage } = require('../middleware/usageLimiter');
const emailService = require('../utils/emailService');
const { getClientIP, getLocationInfo, getBrowserInfo, getDeviceType, getOSInfo } = require('../utils/analyticsHelper');

/**
 * Helper: Generates JWT token, sets cookie options, and returns standard success response.
 * @param {Object} user - User document instance.
 * @param {number} statusCode - HTTP status code response.
 * @param {string} message - Response message context.
 * @param {Object} res - Express response object.
 */
const sendTokenResponse = (user, statusCode, message, res) => {
  const token = user.getJwtToken();

  const cookieExpireDays = parseInt(process.env.COOKIE_EXPIRE, 10) || 7;
  const cookieOptions = {
    expires: new Date(Date.now() + cookieExpireDays * 24 * 60 * 60 * 1000),
    httpOnly: true,
    sameSite: 'lax',
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }

  res.status(statusCode).cookie('token', token, cookieOptions).json({
    success: true,
    message,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        totalUrlsCreated: user.totalUrlsCreated,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        planId: user.planId,
        stripeCustomerId: user.stripeCustomerId,
        isLifetimeMember: user.isLifetimeMember,
        referralCode: user.referralCode,
        trialUsed: user.trialUsed,
      },
      token,
    },
  });
};

/**
 * Registers a new user account.
 * @route   POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Validate fields are present
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter all required fields',
      });
    }

    // Check if email already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Handle referral code generation and lookup
    const referralCode = require('crypto').randomBytes(4).toString('hex');
    let referredBy = null;
    if (req.body.referredBy) {
      const referrer = await User.findOne({ referralCode: req.body.referredBy.toLowerCase() });
      if (referrer) {
        referredBy = referrer._id;
      }
    }

    // Create user in database
    const user = await User.create({
      name,
      email,
      password,
      referralCode,
      referredBy,
    });

    // Create default Free Subscription
    await Subscription.create({
      userId: user._id,
      planId: 'free',
      status: 'free',
    });

    // Initialize usage record
    await getCurrentUsage(user._id);

    // Create default EmailSettings for user
    await EmailSettings.create({ userId: user._id });

    // Initialize security settings
    await user.calculateSecurityScore();

    // Log Activity
    const userAgent = req.headers['user-agent'] || '';
    const ip = getClientIP(req);
    const location = getLocationInfo(ip);
    const browser = getBrowserInfo(userAgent);
    const os = getOSInfo(userAgent);
    const device = getDeviceType(userAgent);

    await LoginActivity.create({
      userId: user._id,
      activityType: 'login_success',
      ipAddress: ip,
      country: location.country || 'Unknown',
      city: location.city || 'Unknown',
      browser: `${browser.browser || 'Unknown'} ${browser.version || ''}`.trim(),
      operatingSystem: os,
      deviceType: device || 'unknown',
      userAgent,
      suspiciousReason: 'Account registration and automatic login',
    });

    // Send Welcome Email asynchronously (do not await)
    emailService.sendWelcomeEmail(user).then(async (emailSent) => {
      // Create Welcome Notification in database
      await Notification.create({
        userId: user._id,
        type: 'welcome',
        title: 'Welcome to QuickLink! 👋',
        message: 'Your account has been created successfully. Welcome aboard!',
        isEmailSent: emailSent,
        emailSentAt: emailSent ? new Date() : null,
      });
    }).catch(err => {
      console.error(`Welcome email background dispatch failed: ${err.message}`);
    });

    sendTokenResponse(user, 201, 'Account created successfully', res);
  } catch (error) {
    next(error);
  }
};

/**
 * Logins existing user and returns token.
 * @route   POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate both fields present
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    const userAgent = req.headers['user-agent'] || '';
    const ip = getClientIP(req);
    const location = getLocationInfo(ip);
    const browser = getBrowserInfo(userAgent);
    const os = getOSInfo(userAgent);
    const device = getDeviceType(userAgent);

    const loginData = {
      ipAddress: ip,
      country: location.country || 'Unknown',
      city: location.city || 'Unknown',
      browser: `${browser.browser || 'Unknown'} ${browser.version || ''}`.trim(),
      operatingSystem: os,
      deviceType: device || 'desktop',
      userAgent,
    };

    // Find user by email (explicitly select password)
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      // Vague error for security (never reveal if email exists or not)
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password match
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await user.incrementLoginAttempts();

      // Log failure in LoginActivity
      await LoginActivity.create({
        userId: user._id,
        activityType: 'login_failed',
        ipAddress: ip,
        country: loginData.country,
        city: loginData.city,
        browser: loginData.browser,
        operatingSystem: loginData.operatingSystem,
        deviceType: loginData.deviceType,
        userAgent,
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Reset login attempts on successful match
    await user.resetLoginAttempts();

    // Check if 2FA is enabled
    if (user.isTwoFactorEnabled) {
      // Set partial login token in cookie
      const jwt = require('jsonwebtoken');
      const partialToken = jwt.sign(
        { id: user._id, twoFactorVerified: false, isPartial: true },
        process.env.JWT_SECRET + (user.jwtSecret || ''),
        { expiresIn: '10m' } // 10 minutes verification window
      );

      const cookieOptions = {
        expires: new Date(Date.now() + 10 * 60 * 1000),
        httpOnly: true,
        sameSite: 'lax',
      };
      if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
      }

      return res.status(200).cookie('token', partialToken, cookieOptions).json({
        success: true,
        requiresTwoFactor: true,
        message: 'Please enter 2FA code',
      });
    }

    // Calculate risk score
    const securityHelper = require('../utils/securityHelper');
    const riskScore = await securityHelper.calculateRiskScore(user, {
      ip,
      country: loginData.country,
      browser: loginData.browser,
    });

    let isSuspicious = false;
    let suspiciousReason = '';

    if (riskScore > 60) {
      isSuspicious = true;
      suspiciousReason = `High login risk score calculated: ${riskScore}. IP country is ${loginData.country}.`;

      // Log suspicious activity
      await LoginActivity.create({
        userId: user._id,
        activityType: 'suspicious_activity',
        ipAddress: ip,
        country: loginData.country,
        city: loginData.city,
        browser: loginData.browser,
        operatingSystem: loginData.operatingSystem,
        deviceType: loginData.deviceType,
        isSuspicious: true,
        suspiciousReason,
        userAgent,
      });

      // Send email alert (do not await)
      emailService.sendSuspiciousLoginEmail(user, {
        ip,
        country: loginData.country,
        browser: loginData.browser,
        time: new Date(),
        device: loginData.deviceType,
        riskScore,
        suspiciousReason,
      }).catch((err) => console.error(`Failed to send suspicious login email: ${err.message}`));

      // Create Notification
      await Notification.create({
        userId: user._id,
        type: 'login_alert',
        title: 'Suspicious Login Warning 🚨',
        message: `High risk login flagged from ${loginData.browser} (${loginData.country}, IP: ${ip}).`,
        isEmailSent: true,
        emailSentAt: new Date(),
        metadata: { ipAddress: ip },
      });
    }

    // Add IP to knownIpAddresses if new
    if (!user.knownIpAddresses.includes(ip)) {
      user.knownIpAddresses.push(ip);
    }

    // Update login timestamp & IP
    user.lastLoginAt = new Date();
    user.lastLoginIp = ip;
    await user.save();

    // Log success activity
    await LoginActivity.create({
      userId: user._id,
      activityType: 'login_success',
      ipAddress: ip,
      country: loginData.country,
      city: loginData.city,
      browser: loginData.browser,
      operatingSystem: loginData.operatingSystem,
      deviceType: loginData.deviceType,
      isSuspicious,
      suspiciousReason: isSuspicious ? suspiciousReason : null,
      userAgent,
    });

    // Update security score
    await user.calculateSecurityScore();

    // Send normal login alert email as well
    emailService.sendLoginAlertEmail(user, {
      ipAddress: ip,
      country: location.country || 'Unknown',
      browser: loginData.browser,
      deviceType: loginData.deviceType,
    }).then(async (emailSent) => {
      await Notification.create({
        userId: user._id,
        type: 'login_alert',
        title: 'New Login Detected 🔔',
        message: `New login from ${loginData.browser} on a ${loginData.deviceType} (${location.country || 'Unknown'}, IP: ${ip}).`,
        isEmailSent: emailSent,
        emailSentAt: emailSent ? new Date() : null,
        metadata: { ipAddress: ip },
      });
    }).catch(err => {
      console.error(`Login alert background dispatch failed: ${err.message}`);
    });

    sendTokenResponse(user, 200, 'Login successful', res);
  } catch (error) {
    next(error);
  }
};

/**
 * Logs out user by clearing the token cookie.
 * @route   POST /api/auth/logout
 */
const logout = async (req, res, next) => {
  try {
    // Log logout activity
    if (req.user) {
      const ip = getClientIP(req);
      const userAgent = req.headers['user-agent'] || '';
      const location = getLocationInfo(ip);
      const browser = getBrowserInfo(userAgent);
      const os = getOSInfo(userAgent);
      const device = getDeviceType(userAgent);

      await LoginActivity.create({
        userId: req.user._id,
        activityType: 'logout',
        ipAddress: ip,
        country: location.country || 'Unknown',
        city: location.city || 'Unknown',
        browser: `${browser.browser || 'Unknown'} ${browser.version || ''}`.trim(),
        operatingSystem: os,
        deviceType: device || 'unknown',
        userAgent,
      });
    }

    const cookieOptions = {
      expires: new Date(Date.now()), // Expiry now
      httpOnly: true,
    };

    if (process.env.NODE_ENV === 'production') {
      cookieOptions.secure = true;
    }

    res.status(200).cookie('token', '', cookieOptions).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the profile details of the current logged-in user.
 * @route   GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    // Count total URLs created by this user
    const totalUrlsCreated = await Url.countDocuments({ userId: req.user._id });

    // Sync count back to user profile
    req.user.totalUrlsCreated = totalUrlsCreated;
    await req.user.save();

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          totalUrlsCreated,
          createdAt: req.user.createdAt,
          lastLoginAt: req.user.lastLoginAt,
          planId: req.user.planId,
          stripeCustomerId: req.user.stripeCustomerId,
          isLifetimeMember: req.user.isLifetimeMember,
          referralCode: req.user.referralCode,
          trialUsed: req.user.trialUsed,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Updates profile details (name and email) for the current user.
 * @route   PUT /api/auth/profile
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and email',
      });
    }

    // Check if new email is taken by another user
    if (email !== req.user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
    }

    // Update fields
    req.user.name = name;
    req.user.email = email;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: req.user._id,
          name: req.user.name,
          email: req.user.email,
          role: req.user.role,
          totalUrlsCreated: req.user.totalUrlsCreated,
          createdAt: req.user.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Changes password of the current user.
 * @route   PUT /api/auth/password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new passwords',
      });
    }

    // Fetch user with password field
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters',
      });
    }

    // Update password (triggers pre-save hashing hook)
    user.password = newPassword;
    await user.save();

    // Trigger Password Changed Alert asynchronously (do not await)
    const ip = getClientIP(req);
    
    // Log Activity in LoginActivity
    const userAgent = req.headers['user-agent'] || '';
    const location = getLocationInfo(ip);
    const browser = getBrowserInfo(userAgent);
    const os = getOSInfo(userAgent);
    const device = getDeviceType(userAgent);

    await LoginActivity.create({
      userId: user._id,
      activityType: 'password_changed',
      ipAddress: ip,
      country: location.country || 'Unknown',
      city: location.city || 'Unknown',
      browser: `${browser.browser || 'Unknown'} ${browser.version || ''}`.trim(),
      operatingSystem: os,
      deviceType: device || 'unknown',
      userAgent,
    });

    emailService.sendPasswordChangedEmail(user, ip).then(async (emailSent) => {
      // Create Database Notification
      await Notification.create({
        userId: user._id,
        type: 'password_changed',
        title: 'Password Changed Successfully 🔐',
        message: `Your account password was updated successfully from IP address ${ip}.`,
        isEmailSent: emailSent,
        emailSentAt: emailSent ? new Date() : null,
        metadata: { ipAddress: ip },
      });
    }).catch(err => {
      console.error(`Password change email background dispatch failed: ${err.message}`);
    });

    sendTokenResponse(user, 200, 'Password updated successfully', res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  changePassword,
};
