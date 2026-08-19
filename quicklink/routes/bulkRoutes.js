/**
 * @file       bulkRoutes.js
 * @description Route definition for bulk URL shortening, restricted to Pro+ accounts.
 * @module     routes/bulkRoutes
 * @requires   express
 * @requires   controllers/bulkController
 * @requires   middleware/auth
 * @requires   middleware/usageLimiter
 */

'use strict';

const express = require('express');
const router = express.Router();

const { bulkShortenUrls } = require('../controllers/bulkController');
const { isAuthenticated } = require('../middleware/auth');
const { checkBulkAccess } = require('../middleware/usageLimiter');

router.post('/', isAuthenticated, checkBulkAccess, bulkShortenUrls);

module.exports = router;
