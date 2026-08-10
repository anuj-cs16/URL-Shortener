/**
 * @file       urlRoutes.js
 * @description Configures Express router paths and applies request validation and rate-limiting middleware.
 * @module     routes/urlRoutes
 * @requires   express
 * @requires   controllers/urlController
 * @requires   middleware/validateUrl
 * @requires   middleware/rateLimiter
 */

'use strict';

const express = require('express');
const router = express.Router();

const {
  createShortUrl,
  redirectToLongUrl,
  getAllUrls,
  getUrlStats,
  deleteUrl,
} = require('../controllers/urlController');

const validateUrl = require('../middleware/validateUrl');
const rateLimiter = require('../middleware/rateLimiter');

// Create shortened URL endpoint (with rate limiter and format validator)
router.post('/api/shorten', rateLimiter, validateUrl, createShortUrl);

// Retrieve URL collection history endpoint
router.get('/api/urls', getAllUrls);

// Retrieve click statistics for a short URL
router.get('/api/urls/:shortCode', getUrlStats);

// Delete shortened URL endpoint
router.delete('/api/urls/:shortCode', deleteUrl);

// Redirection lookup endpoint (placed at root level)
router.get('/:shortCode', redirectToLongUrl);

module.exports = router;
