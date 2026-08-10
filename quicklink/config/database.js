/**
 * @file       database.js
 * @description Establishes connection to the MongoDB database using Mongoose.
 * @module     config/database
 * @requires   mongoose
 */

'use strict';

const mongoose = require('mongoose');

/**
 * Connects to MongoDB database using MONGO_URI environment variable.
 * Logs status on success and terminates process on failure.
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ Database connection failed: MONGO_URI environment variable is not defined.');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
