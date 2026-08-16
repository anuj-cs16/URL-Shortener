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
const cookieParser = require('cookie-parser');

const connectDB = async () => {
  // Only connect to database if we are not in testing mode,
  // or if a test database uri is set.
  if (process.env.NODE_ENV !== 'test' || process.env.MONGO_URI) {
    const connect = require('./config/database');
    await connect();

    // Initialize email service and cron schedules after DB is ready
    const { verifyEmailConnection } = require('./utils/emailService');
    const { initScheduledJobs } = require('./utils/scheduledJobs');
    verifyEmailConnection();
    initScheduledJobs();
  }
};

// Establish database connection
connectDB();

const urlRoutes = require('./routes/urlRoutes');
const authRoutes = require('./routes/authRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// Trust proxy for rate limiting on Cloud Run
app.set('trust proxy', 1);

// Apply security and resource configuration middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net'],
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
app.use(cookieParser());

// Serve static assets — React build in production, public/ in development
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
} else {
  app.use(express.static(path.join(__dirname, 'public')));
}

// Mount API health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount router endpoints
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/', urlRoutes);

// Serve React SPA catch-all in production (after API routes)
if (process.env.NODE_ENV === 'production') {
  app.get('{*path}', (req, res, next) => {
    // API endpoints should fall through to the notFound handler
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(__dirname, 'client', 'build', 'index.html'));
  });
}

// Fallback handlers for unmatched requests and uncaught errors
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 8080;
const NODE_ENV = process.env.NODE_ENV || 'development';

let server;
// Only bind to port if server is executed directly (not imported for testing)
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
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

// Graceful shutdown handling for Cloud Run container lifecycle
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down...');
  const mongoose = require('mongoose');
  if (server) {
    server.close(() => {
      console.log('Server closed');
      mongoose.connection.close();
      process.exit(0);
    });
  } else {
    mongoose.connection.close();
    process.exit(0);
  }
});

module.exports = app;
