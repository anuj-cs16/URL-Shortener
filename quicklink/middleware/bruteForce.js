/**
 * @file       bruteForce.js
 * @description Brute-force protections powered by express-brute and express-brute-mongoose store.
 * @module     middleware/bruteForce
 */

'use strict';

const mongoose = require('mongoose');
const ExpressBrute = require('express-brute');
const MongooseStore = require('express-brute-mongoose');
const User = require('../models/User');

// Initialize the brute schema and model
const bruteSchema = new mongoose.Schema(MongooseStore.schema);
const BruteForceModel = mongoose.model('BruteForce', bruteSchema);
const store = new MongooseStore(BruteForceModel);

let globalBruteForce;
let loginBruteForce;

if (process.env.NODE_ENV === 'test') {
  globalBruteForce = {
    prevent: (req, res, next) => next(),
  };
  loginBruteForce = {
    prevent: (req, res, next) => next(),
  };
} else {
  /**
   * Global brute force protection
   */
  globalBruteForce = new ExpressBrute(store, {
    freeRetries: 5,
    minWait: 1 * 60 * 1000, // 1 minute
    maxWait: 15 * 60 * 1000, // 15 minutes
    lifetime: 1 * 60 * 60, // 1 hour (expressed in seconds)
    failCallback: function (req, res, next, nextValidRequestDate) {
      console.warn(`[Brute Force Alert]: Global limit reached for IP: ${req.ip || req.connection.remoteAddress}`);
      res.status(429).json({
        success: false,
        message: 'Too many requests. Please slow down and try again later.',
        nextValidRequestDate,
      });
    },
  });

  /**
   * Login brute force protection
   */
  loginBruteForce = new ExpressBrute(store, {
    freeRetries: 3,
    minWait: 30 * 1000, // 30 seconds
    maxWait: 30 * 60 * 1000, // 30 minutes
    lifetime: 2 * 60 * 60, // 2 hours (expressed in seconds)
    failCallback: async function (req, res, next, nextValidRequestDate) {
      const { email } = req.body;
      if (email) {
        try {
          const user = await User.findOne({ email: email.toLowerCase() });
          if (user) {
            await user.incrementLoginAttempts();
          }
        } catch (err) {
          console.error(`Error incrementing login attempts in brute callback: ${err.message}`);
        }
      }

      res.status(429).json({
        success: false,
        message: 'Too many login attempts. Access temporarily restricted.',
        nextValidRequestDate,
      });
    },
  });
}

module.exports = {
  globalBruteForce,
  loginBruteForce,
};
