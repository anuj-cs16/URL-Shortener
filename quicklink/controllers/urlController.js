/**
 * @file       urlController.js
 * @description Controllers handling client requests for URL creation, redirection, retrieval, stats, and deletion.
 * @module     controllers/urlController
 * @requires   models/Url
 * @requires   utils/generateShortCode
 * @requires   qrcode
 */

'use strict';

const path = require('path');
const QRCode = require('qrcode');
const Url = require('../models/Url');
const Click = require('../models/Click');
const User = require('../models/User');
const Notification = require('../models/Notification');
const emailService = require('../utils/emailService');
const generateShortCode = require('../utils/generateShortCode');
const { getCache, setCache, deleteCache } = require('../utils/cache');
const {
  getClientIP,
  getLocationInfo,
  getDeviceType,
  getBrowserInfo,
  getOSInfo,
  getReferrer,
} = require('../utils/analyticsHelper');

/**
 * Creates a shortened URL from a long URL.
 * Supports custom aliases.
 * @route   POST /api/shorten
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @param   {Function} next - Express next function.
 * @returns {Promise<void>}
 */
const createShortUrl = async (req, res, next) => {
  try {
    const { longUrl, customCode, urlPassword } = req.body;
    let shortCode = '';

    // Check if custom code is provided
    if (customCode) {
      // Validate custom code contains only safe characters
      const customCodeRegex = /^[A-Za-z0-9_-]+$/;
      if (!customCodeRegex.test(customCode)) {
        return res.status(400).json({
          success: false,
          message: 'Custom code can only contain letters, numbers, hyphens, and underscores',
        });
      }

      // Check availability
      const existingCustom = await Url.findOne({ shortCode: customCode });
      if (existingCustom) {
        return res.status(400).json({
          success: false,
          message: 'Custom code is already in use',
        });
      }
      shortCode = customCode;
    } else {
      // Generate standard unique short code
      shortCode = await generateShortCode();
    }

    // Hash password if Pro/Business and provided
    let hashedUrlPassword = null;
    if (urlPassword && req.user) {
      const Subscription = require('../models/Subscription');
      const sub = await Subscription.findOne({ userId: req.user._id });
      const planId = sub ? sub.planId : 'free';
      if (planId === 'pro' || planId === 'business') {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        hashedUrlPassword = await bcrypt.hash(urlPassword, salt);
      }
    }

    // Save URL document to database
    const newUrl = new Url({
      longUrl,
      shortCode,
      customCode: customCode || null,
      userId: req.user ? req.user._id : null,
      urlPassword: hashedUrlPassword,
    });
    await newUrl.save();

    // Increment user url count stats if logged in
    if (req.user) {
      req.user.totalUrlsCreated += 1;
      await req.user.save();
    }

    // Construct full short URL and generate QR code
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const shortUrl = `${baseUrl}/${shortCode}`;

    // Send URL Creation Email and Notification in background (do not await)
    if (req.user) {
      const fullUrlData = {
        longUrl: newUrl.longUrl,
        shortUrl,
        shortCode,
        expiresAt: newUrl.expiresAt,
      };
      emailService.sendUrlCreatedEmail(req.user, fullUrlData).then(async (emailSent) => {
        await Notification.create({
          userId: req.user._id,
          type: 'url_created',
          title: 'Short Link Created 🔗',
          message: `Your link for code ${shortCode} was created successfully.`,
          isEmailSent: emailSent,
          emailSentAt: emailSent ? new Date() : null,
          metadata: { shortCode, longUrl: newUrl.longUrl },
        });
      }).catch(err => {
        console.error(`URL created notification dispatch failed: ${err.message}`);
      });
    }
    const qrCodeDataUrl = await QRCode.toDataURL(shortUrl);

    // Clear caches
    if (req.user) {
      deleteCache(`urls_user_${req.user._id}`);
      deleteCache(`analytics_dashboard_${req.user._id}`);
    }

    res.status(201).json({
      success: true,
      data: {
        longUrl: newUrl.longUrl,
        shortUrl,
        shortCode,
        qrCode: qrCodeDataUrl,
        expiresAt: newUrl.expiresAt,
        clicks: newUrl.clicks,
        isPasswordProtected: !!newUrl.urlPassword,
      },
      message: 'Short URL created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Resolves a short code and redirects to the original long URL.
 * Tracks click counts and timestamps.
 * @route   GET /:shortCode
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @param   {Function} next - Express next function.
 * @returns {Promise<void>}
 */
const redirectToLongUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const acceptsHtml = req.headers.accept && req.headers.accept.includes('text/html');

    // Fetch from cache first
    let url = getCache(`redirect_${shortCode}`);
    if (!url) {
      url = await Url.findOne({ shortCode }).lean();
      if (url) {
        setCache(`redirect_${shortCode}`, url, 300);
      }
    }

    if (!url || !url.isActive) {
      if (acceptsHtml) {
        return next();
      }
      return res.status(404).json({
        success: false,
        message: 'Short URL not found',
      });
    }

    // Check if the URL has expired (check against raw expiresAt date since url is a lean object)
    const isExpired = url.expiresAt && new Date(url.expiresAt) <= new Date();
    if (isExpired) {
      if (acceptsHtml) {
        return res.status(410).sendFile(path.join(__dirname, '..', 'public', 'expired.html'));
      }
      return res.status(410).json({
        success: false,
        message: 'This short URL has expired',
      });
    }

    // Check if URL is password protected
    if (url.urlPassword) {
      const password = req.body.urlPassword || req.query.password || req.headers['x-url-password'];
      if (!password) {
        if (acceptsHtml) {
          return res.status(200).sendFile(path.join(__dirname, '..', 'public', 'password.html'));
        }
        return res.status(401).json({
          success: false,
          requiresPassword: true,
          message: 'Password required',
        });
      }

      const bcrypt = require('bcryptjs');
      const isMatch = await bcrypt.compare(password, url.urlPassword);
      if (!isMatch) {
        if (acceptsHtml) {
          return res.redirect(`/${shortCode}?error=1`);
        }
        return res.status(403).json({
          success: false,
          message: 'Invalid password',
        });
      }
    }

    // Capture analytical parameters
    const userAgent = req.headers['user-agent'] || '';
    const ip = getClientIP(req);
    const location = getLocationInfo(ip);
    const device = getDeviceType(userAgent);
    const browser = getBrowserInfo(userAgent);
    const os = getOSInfo(userAgent);
    const referrerHeader = req.headers.referer || req.headers.referrer;
    const referrer = getReferrer(referrerHeader);

    // Save detailed Click tracking record (asynchronous write)
    const click = new Click({
      urlId: url._id,
      shortCode: url.shortCode,
      userId: url.userId,
      ipAddress: ip,
      country: location.country,
      countryCode: location.countryCode,
      city: location.city,
      browser: browser.browser || browser.name || 'Unknown',
      browserVersion: browser.version || 'Unknown',
      operatingSystem: os,
      deviceType: device,
      referrer: referrer,
      clickedAt: new Date(),
    });
    await click.save();

    // Increment click usage under premium limits
    if (url.userId) {
      const { incrementClickUsage } = require('../middleware/usageLimiter');
      await incrementClickUsage(url.userId);
    }

    // Invalidate stats/analytics cache on click
    deleteCache(`url_stats_${shortCode}`);
    deleteCache(`url_analytics_${shortCode}`);
    if (url.userId) {
      const userIdStr = url.userId.toString();
      deleteCache(`analytics_dashboard_${userIdStr}`);
      deleteCache(`devices_${userIdStr}`);
      deleteCache(`browsers_${userIdStr}`);
      deleteCache(`countries_${userIdStr}`);
      deleteCache(`referrers_${userIdStr}`);
      deleteCache(`clicks_time_${userIdStr}_7`);
      deleteCache(`clicks_time_${userIdStr}_30`);
      deleteCache(`top_urls_${userIdStr}_5`);
      deleteCache(`top_urls_${userIdStr}_10`);
    }

    // Increment click tracking parameters on original URL doc (synchronous write before redirect)
    await Url.updateOne({ _id: url._id }, { $inc: { clicks: 1 }, $set: { lastClickedAt: new Date() } });

    // Check click milestones in background (non-blocking)
    if (url.userId) {
      const milestones = [10, 50, 100, 500, 1000, 5000];
      Url.findById(url._id).select('clicks userId shortCode milestonesReached').lean()
        .then(async (currentUrl) => {
          if (currentUrl) {
            const reachedMilestone = milestones.find((m) => currentUrl.clicks === m && !currentUrl.milestonesReached.includes(m));
            if (reachedMilestone) {
              User.findById(url.userId).lean().then((user) => {
                if (user) {
                  emailService.sendClickMilestoneEmail(user, currentUrl, reachedMilestone).then(async (emailSent) => {
                    await Notification.create({
                      userId: user._id,
                      type: 'click_milestone',
                      title: 'Popularity Milestone Reached! 🎉',
                      message: `Your link for code ${url.shortCode} reached ${reachedMilestone} clicks!`,
                      isEmailSent: emailSent,
                      emailSentAt: emailSent ? new Date() : null,
                      metadata: {
                        shortCode: url.shortCode,
                        clicks: currentUrl.clicks,
                        milestone: reachedMilestone,
                      },
                    });
                  }).catch((err) => {
                    console.error(`Milestone notification dispatch failed: ${err.message}`);
                  });
                }
              }).catch((err) => {
                console.error(`User fetch for milestone warning failed: ${err.message}`);
              });

              await Url.updateOne({ _id: url._id }, { $push: { milestonesReached: reachedMilestone } });
            }
          }
        })
        .catch((err) => console.error(`Failed to check milestones: ${err.message}`));
    }

    // Perform permanent redirect (301)
    res.redirect(301, url.longUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves all URLs in the system, sorted by creation date.
 * @route   GET /api/urls
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @param   {Function} next - Express next function.
 * @returns {Promise<void>}
 */
const getAllUrls = async (req, res, next) => {
  try {
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    // If guest, check query parameter `codes`
    if (!req.user) {
      const { codes } = req.query;
      if (codes) {
        const cacheKey = `urls_guest_${codes}`;
        const cached = getCache(cacheKey);
        if (cached) {
          res.setHeader('X-Cache', 'HIT');
          return res.status(200).json(cached);
        }

        const codesArray = codes.split(',');
        const urls = await Url.find({ shortCode: { $in: codesArray } })
          .sort({ createdAt: -1 })
          .select('longUrl shortCode clicks isActive expiresAt createdAt lastClickedAt customCode milestonesReached userId')
          .lean();

        const formattedUrls = urls.map((url) => {
          const isExpired = url.expiresAt && new Date(url.expiresAt) <= new Date();
          return {
            ...url,
            shortUrl: `${baseUrl}/${url.shortCode}`,
            isExpired,
          };
        });

        const responseData = {
          success: true,
          count: formattedUrls.length,
          data: formattedUrls,
        };
        setCache(cacheKey, responseData, 60);
        res.setHeader('X-Cache', 'MISS');
        return res.status(200).json(responseData);
      }
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // Authenticated users retrieve only their URLs
    const cacheKey = `urls_user_${req.user._id}`;
    const cached = getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const urls = await Url.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('longUrl shortCode clicks isActive expiresAt createdAt lastClickedAt customCode milestonesReached userId')
      .lean();

    const formattedUrls = urls.map((url) => {
      const isExpired = url.expiresAt && new Date(url.expiresAt) <= new Date();
      return {
        ...url,
        shortUrl: `${baseUrl}/${url.shortCode}`,
        isExpired,
      };
    });

    const responseData = {
      success: true,
      count: formattedUrls.length,
      data: formattedUrls,
    };
    setCache(cacheKey, responseData, 60);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves statistics for a specific short URL.
 * @route   GET /api/urls/:shortCode
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @param   {Function} next - Express next function.
 * @returns {Promise<void>}
 */
const getUrlStats = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const cacheKey = `url_stats_${shortCode}`;

    const cached = getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const url = await Url.findOne({ shortCode })
      .select('longUrl shortCode clicks isActive expiresAt createdAt lastClickedAt')
      .lean();
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'Short URL not found',
      });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const isExpired = url.expiresAt && new Date(url.expiresAt) <= new Date();

    const responseData = {
      success: true,
      data: {
        longUrl: url.longUrl,
        shortUrl: `${baseUrl}/${url.shortCode}`,
        shortCode: url.shortCode,
        clicks: url.clicks,
        isActive: url.isActive,
        isExpired,
        expiresAt: url.expiresAt,
        createdAt: url.createdAt,
        lastClickedAt: url.lastClickedAt,
      },
    };

    setCache(cacheKey, responseData, 30);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

/**
 * Deletes a short URL from the database.
 * @route   DELETE /api/urls/:shortCode
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @param   {Function} next - Express next function.
 * @returns {Promise<void>}
 */
const deleteUrl = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'Short URL not found',
      });
    }

    // Verify ownership
    if (req.user) {
      if (!url.userId || url.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own URLs',
        });
      }
    } else {
      // Guests can only delete Guest URLs (userId is null)
      if (url.userId !== null) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own URLs',
        });
      }
    }

    await Url.findOneAndDelete({ shortCode });

    // Clear caches
    deleteCache(`redirect_${shortCode}`);
    deleteCache(`url_stats_${shortCode}`);
    deleteCache(`url_analytics_${shortCode}`);
    if (req.user) {
      deleteCache(`urls_user_${req.user._id}`);
      deleteCache(`analytics_dashboard_${req.user._id}`);
    } else {
      // For guest delete, we can clear all guest urls caches or let them TTL out
      // Since guest can delete a URL, we will clear their guest urls list if codes list changes
    }

    res.status(200).json({
      success: true,
      message: 'Short URL deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generates a QR code data URL for a given short code.
 * @route   GET /api/urls/:shortCode/qr
 * @param   {Object} req - Express request object.
 * @param   {Object} res - Express response object.
 * @param   {Function} next - Express next function.
 * @returns {Promise<void>}
 */
const getQrCode = async (req, res, next) => {
  try {
    const { shortCode } = req.params;

    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'Short URL not found',
      });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const shortUrl = `${baseUrl}/${url.shortCode}`;
    const qrCodeDataUrl = await QRCode.toDataURL(shortUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    });

    res.status(200).json({
      success: true,
      data: {
        shortUrl,
        shortCode: url.shortCode,
        qrCode: qrCodeDataUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createShortUrl,
  redirectToLongUrl,
  getAllUrls,
  getUrlStats,
  deleteUrl,
  getQrCode,
};
