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
    const { longUrl, customCode } = req.body;
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

    // Save URL document to database
    const newUrl = new Url({
      longUrl,
      shortCode,
      customCode: customCode || null,
      userId: req.user ? req.user._id : null,
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

    res.status(201).json({
      success: true,
      data: {
        longUrl: newUrl.longUrl,
        shortUrl,
        shortCode,
        qrCode: qrCodeDataUrl,
        expiresAt: newUrl.expiresAt,
        clicks: newUrl.clicks,
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

    const url = await Url.findOne({ shortCode });
    if (!url || !url.isActive) {
      if (acceptsHtml) {
        return next();
      }
      return res.status(404).json({
        success: false,
        message: 'Short URL not found',
      });
    }

    // Check if the URL has expired
    if (url.isExpired()) {
      if (acceptsHtml) {
        return res.status(410).sendFile(path.join(__dirname, '..', 'public', 'expired.html'));
      }
      return res.status(410).json({
        success: false,
        message: 'This short URL has expired',
      });
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

    // Save detailed Click tracking record
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

    // Increment click tracking parameters on original URL doc
    url.clicks += 1;
    url.lastClickedAt = new Date();
    await url.save();

    // Check click milestones in background (do not await)
    if (url.userId) {
      const milestones = [10, 50, 100, 500, 1000, 5000];
      const reachedMilestone = milestones.find((m) => url.clicks === m && !url.milestonesReached.includes(m));
      if (reachedMilestone) {
        User.findById(url.userId).then((user) => {
          if (user) {
            emailService.sendClickMilestoneEmail(user, url, reachedMilestone).then(async (emailSent) => {
              await Notification.create({
                userId: user._id,
                type: 'click_milestone',
                title: 'Popularity Milestone Reached! 🎉',
                message: `Your link for code ${url.shortCode} reached ${reachedMilestone} clicks!`,
                isEmailSent: emailSent,
                emailSentAt: emailSent ? new Date() : null,
                metadata: {
                  shortCode: url.shortCode,
                  clicks: url.clicks,
                  milestone: reachedMilestone,
                },
              });
            }).catch(err => {
              console.error(`Milestone notification dispatch failed: ${err.message}`);
            });
          }
        }).catch(err => {
          console.error(`User fetch for milestone warning failed: ${err.message}`);
        });

        url.milestonesReached.push(reachedMilestone);
        await url.save();
      }
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
    // If guest, return empty history array
    if (!req.user) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: [],
      });
    }

    // Authenticated users retrieve only their URLs
    const urls = await Url.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    const formattedUrls = urls.map((url) => {
      const obj = url.toObject();
      return {
        ...obj,
        shortUrl: `${baseUrl}/${obj.shortCode}`,
        isExpired: url.isExpired(),
      };
    });

    res.status(200).json({
      success: true,
      count: formattedUrls.length,
      data: formattedUrls,
    });
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

    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'Short URL not found',
      });
    }

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    res.status(200).json({
      success: true,
      data: {
        longUrl: url.longUrl,
        shortUrl: `${baseUrl}/${url.shortCode}`,
        shortCode: url.shortCode,
        clicks: url.clicks,
        isActive: url.isActive,
        isExpired: url.isExpired(),
        expiresAt: url.expiresAt,
        createdAt: url.createdAt,
        lastClickedAt: url.lastClickedAt,
      },
    });
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
