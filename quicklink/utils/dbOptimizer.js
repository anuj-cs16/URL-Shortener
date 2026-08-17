/**
 * @file       dbOptimizer.js
 * @description Verifies and builds database indexes for optimized query performance.
 * @module     utils/dbOptimizer
 */

'use strict';

const Url = require('../models/Url');
const Click = require('../models/Click');
const User = require('../models/User');
const LoginActivity = require('../models/LoginActivity');

/**
 * Ensures optimal database indexes exist for performance query structures.
 * @returns {Promise<void>}
 */
const ensureIndexes = async () => {
  try {
    console.log('🔍 Database Optimization: Verifying index structures...');

    // Url schema indexes
    await Url.collection.createIndex({ shortCode: 1 }, { unique: true });
    await Url.collection.createIndex({ userId: 1 });
    await Url.collection.createIndex({ createdAt: -1 });
    await Url.collection.createIndex({ expiresAt: 1 });
    await Url.collection.createIndex({ isActive: 1 });

    // Click schema indexes
    await Click.collection.createIndex({ urlId: 1 });
    await Click.collection.createIndex({ shortCode: 1 });
    await Click.collection.createIndex({ clickedAt: -1 });
    await Click.collection.createIndex({ country: 1 });
    await Click.collection.createIndex({ deviceType: 1 });
    await Click.collection.createIndex({ userId: 1 }); // to support user aggregates

    // User schema indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ createdAt: -1 });

    // LoginActivity indexes
    await LoginActivity.collection.createIndex({ userId: 1 });
    await LoginActivity.collection.createIndex({ activityType: 1 });
    await LoginActivity.collection.createIndex({ createdAt: -1 });

    console.log('✅ Database Optimization: Indexes verified and built successfully.');
  } catch (error) {
    console.error(`❌ Database Optimization Error: ${error.message}`);
  }
};

module.exports = {
  ensureIndexes,
};
