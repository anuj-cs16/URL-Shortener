/**
 * @file       database.js
 * @description Establishes connection to the MongoDB database using Mongoose with serverless connection pooling support.
 * @module     config/database
 * @requires   mongoose
 */

'use strict';

const mongoose = require('mongoose');

let isConnected = false;

/**
 * Connects to MongoDB database using MONGO_URI environment variable.
 * Reuses active connections across serverless warm invocations.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    // If already connected or connecting in mongoose instance, reuse connection
    if (isConnected || mongoose.connection.readyState >= 1) {
      return;
    }

    const mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.error('❌ Database connection failed: MONGO_URI environment variable is not defined.');
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        throw new Error('MONGO_URI environment variable is not defined.');
      }
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoUri);

    isConnected = true;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    if (process.env.VERCEL) {
      throw error;
    }
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
