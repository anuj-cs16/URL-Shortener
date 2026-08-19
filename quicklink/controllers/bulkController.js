/**
 * @file       bulkController.js
 * @description Controller methods for bulk URL shortening operations (restricted to Pro+).
 * @module     controllers/bulkController
 */

'use strict';

const Url = require('../models/Url');
const Subscription = require('../models/Subscription');
const { getPlanLimits } = require('../config/plans');
const generateShortCode = require('../utils/generateShortCode');
const { deleteCache } = require('../utils/cache');

/**
 * Validates a single URL string.
 * @param {string} urlStr
 * @returns {boolean}
 */
const validateUrl = (urlStr) => {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    let checkUrl = urlStr.trim();
    if (!/^https?:\/\//i.test(checkUrl)) {
      checkUrl = 'http://' + checkUrl;
    }
    const parsed = new URL(checkUrl);
    return parsed.hostname.includes('.');
  } catch (e) {
    return false;
  }
};

/**
 * Shortens an array of URLs in bulk.
 * @route   POST /api/bulk-shorten
 */
const bulkShortenUrls = async (req, res, next) => {
  try {
    const { urls } = req.body;

    if (!urls || !Array.isArray(urls)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid input: urls must be an array',
      });
    }

    if (urls.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Limit exceeded: Maximum 50 URLs can be processed in a single bulk operation',
      });
    }

    // Get plan limits
    const sub = await Subscription.findOne({ userId: req.user._id });
    const planId = sub ? sub.planId : 'free';
    const limits = getPlanLimits(planId);

    // Get current usage record
    const { getCurrentUsage } = require('../middleware/usageLimiter');
    const usage = await getCurrentUsage(req.user._id);

    // Calculate remaining URL allowance
    const remainingUrls = limits.urlsPerMonth === -1 ? -1 : Math.max(0, limits.urlsPerMonth - usage.urlsCreated);

    const results = [];
    let successCount = 0;
    let failCount = 0;

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    for (let url of urls) {
      if (!url || typeof url !== 'string') {
        results.push({ longUrl: String(url), success: false, error: 'Invalid URL' });
        failCount++;
        continue;
      }

      const formattedUrl = url.trim();

      // Check if we hit the limit during this loop
      if (limits.urlsPerMonth !== -1 && successCount >= remainingUrls) {
        results.push({ longUrl: formattedUrl, success: false, error: 'Monthly URL limit reached' });
        failCount++;
        continue;
      }

      if (!validateUrl(formattedUrl)) {
        results.push({ longUrl: formattedUrl, success: false, error: 'Invalid URL format' });
        failCount++;
        continue;
      }

      try {
        const shortCode = await generateShortCode();
        let finalUrl = formattedUrl;
        if (!/^https?:\/\//i.test(finalUrl)) {
          finalUrl = 'http://' + finalUrl;
        }

        const newUrl = new Url({
          longUrl: finalUrl,
          shortCode,
          userId: req.user._id,
        });
        await newUrl.save();

        results.push({
          longUrl: finalUrl,
          shortCode,
          shortUrl: `${baseUrl}/${shortCode}`,
          success: true,
        });

        successCount++;
      } catch (err) {
        results.push({ longUrl: formattedUrl, success: false, error: err.message });
        failCount++;
      }
    }

    // Update usage counters in database
    if (successCount > 0) {
      usage.urlsCreated += successCount;
      usage.bulkOperations += 1;
      await usage.save();

      req.user.totalUrlsCreated += successCount;
      await req.user.save();

      // Clear user lists caching
      deleteCache(`urls_user_${req.user._id}`);
      deleteCache(`analytics_dashboard_${req.user._id}`);
    }

    res.status(200).json({
      success: true,
      data: {
        results,
        successCount,
        failCount,
        total: urls.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bulkShortenUrls,
};
