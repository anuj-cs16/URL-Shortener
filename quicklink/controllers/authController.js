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
const emailService = require('../utils/emailService');
const { getClientIP, getLocationInfo, getBrowserInfo, getDeviceType } = require('../utils/analyticsHelper');

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

    // Create user in database
    const user = await User.create({
      name,
      email,
      password,
    });

    // Create default EmailSettings for user
    await EmailSettings.create({ userId: user._id });

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

    // Find user by email (explicitly select password)
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Verify password match
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Update login timestamp
    user.lastLoginAt = new Date();
    await user.save();

    // Trigger Login Security Alert asynchronously (do not await)
    const userAgent = req.headers['user-agent'] || '';
    const ip = getClientIP(req);
    const location = getLocationInfo(ip);
    const browser = getBrowserInfo(userAgent);
    const device = getDeviceType(userAgent);

    const loginData = {
      ipAddress: ip,
      country: location.country || 'Unknown',
      browser: `${browser.browser || 'Unknown'} ${browser.version || ''}`.trim(),
      deviceType: device || 'desktop',
    };

    emailService.sendLoginAlertEmail(user, loginData).then(async (emailSent) => {
      // Create Database Notification
      await Notification.create({
        userId: user._id,
        type: 'login_alert',
        title: 'New Login Detected 🔔',
        message: `New login from ${loginData.browser} on a ${loginData.deviceType} (${loginData.country}, IP: ${loginData.ipAddress}).`,
        isEmailSent: emailSent,
        emailSentAt: emailSent ? new Date() : null,
        metadata: loginData,
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
