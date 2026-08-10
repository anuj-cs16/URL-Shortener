/**
 * @file       auth.js
 * @description Authentication middlewares to protect endpoints, check guest status, and resolve optional user sessions.
 * @module     middleware/auth
 * @requires   jsonwebtoken
 * @requires   models/User
 */

'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Extracts JWT token from Cookie or Authorization header.
 * @param {Object} req - Express request object.
 * @returns {string|null} The token string if found, null otherwise.
 */
const extractToken = (req) => {
  let token = null;

  // 1. Try to read token from cookies
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }
  // 2. Try to read token from Authorization header (Bearer token)
  else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  return token;
};

/**
 * Middleware: Requires the request to be authenticated.
 * Restricts access to logged-in users only.
 */
const isAuthenticated = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this',
      });
    }

    // Find user in database
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this',
      });
    }

    // Attach user instance to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Restricts access to guest users only.
 * Redirects or blocks authenticated users.
 */
const isGuest = async (req, res, next) => {
  try {
    const token = extractToken(req);

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        
        if (user) {
          return res.status(400).json({
            success: false,
            message: 'You are already logged in',
          });
        }
      } catch (err) {
        // Token is invalid/expired, treat as guest and proceed
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Resolves authentication details optionally.
 * Does not block guests, but attaches user to req.user if logged in.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    req.user = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
        }
      } catch (err) {
        // Token invalid/expired, keep req.user as null
      }
    }

    next();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  isAuthenticated,
  isGuest,
  optionalAuth,
};
