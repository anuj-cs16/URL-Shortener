/**
 * @file       server.js
 * @description Main application entry point. Registers middleware, connects to MongoDB, and launches the Express server.
 * @requires   express
 * @requires   cors
 * @requires   helmet
 * @requires   dotenv
 * @requires   config/database
 * @requires   routes/urlRoutes
 * @requires   middleware/errorHandler
 */

'use strict';

// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const connectDB = async () => {
  // Only connect to database if we are not in testing mode,
  // or if a test database uri is set.
  if (process.env.NODE_ENV !== 'test' || process.env.MONGO_URI) {
    const connect = require('./config/database');
    await connect();
  }
};

// Establish database connection
connectDB();

const urlRoutes = require('./routes/urlRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Apply security and resource configuration middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static assets from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount API health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
  });
});

// Mount router endpoints
app.use('/', urlRoutes);

// Fallback handlers for unmatched requests and uncaught errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Only bind to port if server is executed directly (not imported for testing)
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
  });
}

// Global safety catches for process-level events
process.on('unhandledRejection', (reason) => {
  console.error(`[Unhandled Rejection]: ${reason}`);
});

process.on('uncaughtException', (error) => {
  console.error(`[Uncaught Exception]: ${error.message}`);
  process.exit(1);
});

module.exports = app;
