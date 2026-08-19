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
const hpp = require('hpp');
const compression = require('compression');
const responseTime = require('response-time');
const { checkBlockedIp, sanitizeInput } = require('./middleware/security');
const securityRoutes = require('./routes/securityRoutes');
const { getCacheStats, clearAllCache } = require('./utils/cache');

const connectDB = async () => {
  // Only connect to database if we are not in testing mode,
  // or if a test database uri is set.
  if (process.env.NODE_ENV !== 'test' || process.env.MONGO_URI) {
    const connect = require('./config/database');
    await connect();

    // Ensure database indexes
    const { ensureIndexes } = require('./utils/dbOptimizer');
    await ensureIndexes();

    // Initialize email service and cron schedules after DB is ready (only in non-test mode)
    if (process.env.NODE_ENV !== 'test') {
      const { verifyEmailConnection } = require('./utils/emailService');
      const { initScheduledJobs } = require('./utils/scheduledJobs');
      verifyEmailConnection();
      initScheduledJobs();
    }
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

app.locals.plans = require('./config/plans');

// Trust proxy for rate limiting on Cloud Run
app.set('trust proxy', 1);

// Measure API latency in dev/prod environments
app.use(responseTime((req, res, time) => {
  if (time > 1000) {
    console.warn(`[SLOW ROUTE DETECTED]: ${req.method} ${req.originalUrl || req.url} took ${time.toFixed(2)}ms`);
  }
}));

// Apply Gzip compression to responses
if (process.env.ENABLE_COMPRESSION !== 'false') {
  app.use(compression({
    filter: (req, res) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    },
    threshold: 1024,
  }));
}

// Apply security and resource configuration middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

app.use(cors());

// Stripe Webhook needs raw body parsed BEFORE express.json()
app.use(
  '/api/subscription/webhook',
  express.raw({ type: 'application/json' }),
  require('./routes/subscriptionRoutes')
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Global input sanitization and parameter pollution/NoSQL safeguards
app.use(hpp());
app.use(sanitizeInput);
app.use(checkBlockedIp);

// Serve static assets — React build in production with gzip/brotli support and strict cache-control
if (process.env.NODE_ENV === 'production') {
  const expressStaticGzip = require('express-static-gzip');
  app.use(expressStaticGzip(path.join(__dirname, 'client/build'), {
    enableBrotli: true,
    orderPreference: ['br', 'gz'],
    setHeaders: (res, filePath) => {
      const baseName = path.basename(filePath);
      if (baseName === 'index.html' || baseName === 'service-worker.js' || baseName === 'manifest.json') {
        res.setHeader('Cache-Control', 'public, max-age=0, no-cache, no-store, must-revalidate');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));
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

// Dynamic XML sitemap generator
app.get('/sitemap.xml', async (req, res) => {
  try {
    const Url = require('./models/Url');
    const urls = await Url.find({ isActive: true }).select('shortCode').lean();
    const baseUrl = process.env.BASE_URL || 'https://quicklink.app';
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    
    // Static Routes
    const staticRoutes = ['', 'login', 'signup', 'dashboard', 'analytics', 'security'];
    staticRoutes.forEach((route) => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/${route}</loc>\n`;
      xml += `    <changefreq>daily</changefreq>\n`;
      xml += `    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n`;
      xml += `  </url>\n`;
    });

    // Dynamic shortcode redirect routes
    urls.forEach((url) => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/${url.shortCode}</loc>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.5</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;
    
    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

// Web Vitals reporter endpoint
app.post('/api/vitals', (req, res) => {
  const { name, value, id, delta } = req.body;
  // Log telemetry or forward to telemetry provider
  console.log(`[Web Vitals Metric - ${name}]: value=${value}, id=${id}, delta=${delta}`);
  res.status(200).json({ success: true });
});

// Admin Cache Instrumentation endpoints
app.get('/api/admin/cache-stats', (req, res) => {
  res.status(200).json({
    success: true,
    data: getCacheStats(),
  });
});

app.post('/api/admin/cache-clear', (req, res) => {
  clearAllCache();
  res.status(200).json({
    success: true,
    message: 'Cache flushed successfully',
  });
});

// Mount router endpoints
app.use('/api/auth', authRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subscription', require('./routes/subscriptionRoutes'));
app.use('/api/bulk-shorten', require('./routes/bulkRoutes'));
app.use('/api/export', require('./routes/exportRoutes'));
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
