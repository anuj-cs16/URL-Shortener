/**
 * @file       analyticsController.js
 * @description Controllers managing dashboard calculations, geolocation breakdowns, browsers, OS, and clicks frequency logs.
 * @module     controllers/analyticsController
 * @requires   moment
 * @requires   models/Click
 * @requires   models/Url
 */

'use strict';

const moment = require('moment');
const Click = require('../models/Click');
const Url = require('../models/Url');

/**
 * Retrieves aggregate statistics for the user's dashboard.
 * @route   GET /api/analytics/dashboard
 * @returns {Promise<void>}
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const { codes } = req.query;
    let query = { _id: { $in: [] } };
    let clickQuery = { urlId: { $in: [] } };

    if (req.user) {
      query = { userId: req.user._id };
      clickQuery = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      const urls = await Url.find({ shortCode: { $in: codesArray } });
      const urlIds = urls.map(u => u._id);
      query = { _id: { $in: urlIds } };
      clickQuery = { urlId: { $in: urlIds } };
    }

    const startOfMonth = moment().startOf('month').toDate();

    const [
      totalUrls,
      totalClicks,
      urlsThisMonth,
      clicksThisMonth,
      mostClickedUrl,
      newestUrl,
      activeUrls,
      recentClicks,
    ] = await Promise.all([
      Url.countDocuments(query),
      Click.countDocuments(clickQuery),
      Url.countDocuments({ ...query, createdAt: { $gte: startOfMonth } }),
      Click.countDocuments({ ...clickQuery, clickedAt: { $gte: startOfMonth } }),
      Url.findOne(query).sort({ clicks: -1 }),
      Url.findOne(query).sort({ createdAt: -1 }),
      Url.countDocuments({ ...query, expiresAt: { $gt: new Date() } }),
      Click.find(clickQuery).sort({ clickedAt: -1 }).limit(20),
    ]);

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    res.status(200).json({
      success: true,
      data: {
        totalUrls,
        totalClicks,
        urlsThisMonth,
        clicksThisMonth,
        mostClickedUrl: mostClickedUrl
          ? {
              shortCode: mostClickedUrl.shortCode,
              longUrl: mostClickedUrl.longUrl,
              shortUrl: `${baseUrl}/${mostClickedUrl.shortCode}`,
              clicks: mostClickedUrl.clicks,
            }
          : null,
        newestUrl: newestUrl
          ? {
              shortCode: newestUrl.shortCode,
              longUrl: newestUrl.longUrl,
              shortUrl: `${baseUrl}/${newestUrl.shortCode}`,
              createdAt: newestUrl.createdAt,
            }
          : null,
        activeUrls,
        recentClicks: recentClicks.map((click) => ({
          shortCode: click.shortCode,
          shortUrl: `${baseUrl}/${click.shortCode}`,
          country: click.country,
          countryCode: click.countryCode,
          city: click.city,
          browser: click.browser,
          deviceType: click.deviceType,
          referrer: click.referrer,
          clickedAt: click.clickedAt,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves clicks count grouped by day for a selected date range.
 * @route   GET /api/analytics/clicks-over-time
 * @returns {Promise<void>}
 */
const getClicksOverTime = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const { codes } = req.query;
    let clickQuery = { urlId: { $in: [] } };

    if (req.user) {
      clickQuery = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      const urls = await Url.find({ shortCode: { $in: codesArray } });
      const urlIds = urls.map(u => u._id);
      clickQuery = { urlId: { $in: urlIds } };
    }

    const startDate = moment().subtract(days - 1, 'days').startOf('day');

    const clicks = await Click.find({
      ...clickQuery,
      clickedAt: { $gte: startDate.toDate() },
    });

    const clicksMap = {};
    clicks.forEach((click) => {
      const dateStr = moment(click.clickedAt).format('YYYY-MM-DD');
      clicksMap[dateStr] = (clicksMap[dateStr] || 0) + 1;
    });

    const data = [];
    for (let i = 0; i < days; i++) {
      const dateStr = moment(startDate).add(i, 'days').format('YYYY-MM-DD');
      data.push({
        date: dateStr,
        clicks: clicksMap[dateStr] || 0,
      });
    }

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves device breakdown clicks metrics.
 * @route   GET /api/analytics/devices
 * @returns {Promise<void>}
 */
const getDeviceStats = async (req, res, next) => {
  try {
    const { codes } = req.query;
    let clickQuery = { urlId: { $in: [] } };

    if (req.user) {
      clickQuery = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      const urls = await Url.find({ shortCode: { $in: codesArray } });
      const urlIds = urls.map(u => u._id);
      clickQuery = { urlId: { $in: urlIds } };
    }

    const clicks = await Click.find(clickQuery);
    const total = clicks.length;

    const counts = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
    clicks.forEach((click) => {
      const type = click.deviceType || 'unknown';
      if (counts.hasOwnProperty(type)) {
        counts[type]++;
      } else {
        counts.unknown++;
      }
    });

    const data = {};
    Object.keys(counts).forEach((key) => {
      const count = counts[key];
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      data[key] = { count, percentage };
    });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves browser clicks metrics.
 * @route   GET /api/analytics/browsers
 * @returns {Promise<void>}
 */
const getBrowserStats = async (req, res, next) => {
  try {
    const { codes } = req.query;
    let clickQuery = { urlId: { $in: [] } };

    if (req.user) {
      clickQuery = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      const urls = await Url.find({ shortCode: { $in: codesArray } });
      const urlIds = urls.map(u => u._id);
      clickQuery = { urlId: { $in: urlIds } };
    }

    const clicks = await Click.find(clickQuery);
    const total = clicks.length;

    const browserCounts = {};
    clicks.forEach((click) => {
      const name = click.browser || 'Unknown';
      browserCounts[name] = (browserCounts[name] || 0) + 1;
    });

    const list = Object.keys(browserCounts).map((name) => {
      const count = browserCounts[name];
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return { browser: name, count, percentage };
    });

    list.sort((a, b) => b.count - a.count);
    const topBrowsers = list.slice(0, 6);

    res.status(200).json({
      success: true,
      data: topBrowsers,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves country clicks metrics.
 * @route   GET /api/analytics/countries
 * @returns {Promise<void>}
 */
const getCountryStats = async (req, res, next) => {
  try {
    const { codes } = req.query;
    let clickQuery = { urlId: { $in: [] } };

    if (req.user) {
      clickQuery = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      const urls = await Url.find({ shortCode: { $in: codesArray } });
      const urlIds = urls.map(u => u._id);
      clickQuery = { urlId: { $in: urlIds } };
    }

    const clicks = await Click.find(clickQuery);
    const total = clicks.length;

    const countryCounts = {};
    const countryCodes = {};
    clicks.forEach((click) => {
      const name = click.country || 'Unknown';
      countryCounts[name] = (countryCounts[name] || 0) + 1;
      countryCodes[name] = click.countryCode || 'XX';
    });

    const list = Object.keys(countryCounts).map((name) => {
      const count = countryCounts[name];
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return {
        country: name,
        countryCode: countryCodes[name],
        count,
        percentage,
      };
    });

    list.sort((a, b) => b.count - a.count);
    const topCountries = list.slice(0, 10);

    res.status(200).json({
      success: true,
      data: topCountries,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves analytics breakdown logs for a single URL.
 * @route   GET /api/analytics/url/:shortCode
 * @returns {Promise<void>}
 */
const getUrlAnalytics = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const url = await Url.findOne({ shortCode });
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'Short URL not found',
      });
    }


    const clicks = await Click.find({ urlId: url._id }).sort({ clickedAt: -1 });
    const total = clicks.length;

    // 1. Clicks Over Time (Last 7 Days)
    const startDate = moment().subtract(6, 'days').startOf('day');
    const clicksMap = {};
    clicks.forEach((click) => {
      const dateStr = moment(click.clickedAt).format('YYYY-MM-DD');
      clicksMap[dateStr] = (clicksMap[dateStr] || 0) + 1;
    });
    const clicksOverTime = [];
    for (let i = 0; i < 7; i++) {
      const dateStr = moment(startDate).add(i, 'days').format('YYYY-MM-DD');
      clicksOverTime.push({
        date: dateStr,
        clicks: clicksMap[dateStr] || 0,
      });
    }

    // 2. Device Breakdown
    const deviceCounts = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 };
    clicks.forEach((click) => {
      const type = click.deviceType || 'unknown';
      if (deviceCounts.hasOwnProperty(type)) {
        deviceCounts[type]++;
      } else {
        deviceCounts.unknown++;
      }
    });
    const deviceBreakdown = {};
    Object.keys(deviceCounts).forEach((key) => {
      const count = deviceCounts[key];
      deviceBreakdown[key] = {
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });

    // 3. Browser Breakdown
    const browserCounts = {};
    clicks.forEach((click) => {
      const name = click.browser || 'Unknown';
      browserCounts[name] = (browserCounts[name] || 0) + 1;
    });
    const browserBreakdown = Object.keys(browserCounts)
      .map((name) => ({
        browser: name,
        count: browserCounts[name],
        percentage: total > 0 ? Math.round((browserCounts[name] / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 4. Country Breakdown
    const countryCounts = {};
    const countryCodes = {};
    clicks.forEach((click) => {
      const name = click.country || 'Unknown';
      countryCounts[name] = (countryCounts[name] || 0) + 1;
      countryCodes[name] = click.countryCode || 'XX';
    });
    const countryBreakdown = Object.keys(countryCounts)
      .map((name) => ({
        country: name,
        countryCode: countryCodes[name],
        count: countryCounts[name],
        percentage: total > 0 ? Math.round((countryCounts[name] / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 5. Referrer Breakdown
    const referrerCounts = {};
    clicks.forEach((click) => {
      const ref = click.referrer || 'Direct';
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    });
    const referrerBreakdown = Object.keys(referrerCounts)
      .map((ref) => ({
        referrer: ref,
        count: referrerCounts[ref],
        percentage: total > 0 ? Math.round((referrerCounts[ref] / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // 6. Recent Clicks (last 10)
    const recentClicks = clicks.slice(0, 10).map((click) => ({
      ipAddress: click.ipAddress,
      country: click.country,
      countryCode: click.countryCode,
      city: click.city,
      browser: click.browser,
      operatingSystem: click.operatingSystem,
      deviceType: click.deviceType,
      referrer: click.referrer,
      clickedAt: click.clickedAt,
    }));

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    res.status(200).json({
      success: true,
      data: {
        url: {
          longUrl: url.longUrl,
          shortUrl: `${baseUrl}/${url.shortCode}`,
          shortCode: url.shortCode,
          totalClicks: url.clicks,
          createdAt: url.createdAt,
          expiresAt: url.expiresAt,
        },
        clicksOverTime,
        deviceBreakdown,
        browserBreakdown,
        countryBreakdown,
        referrerBreakdown,
        recentClicks,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves the top clicked URLs for the authenticated user.
 * @route   GET /api/analytics/top-urls
 * @returns {Promise<void>}
 */
const getTopUrls = async (req, res, next) => {
  try {
    const { codes } = req.query;
    const limit = parseInt(req.query.limit) || 5;

    let query = { _id: { $in: [] } };
    if (req.user) {
      query = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      query = { shortCode: { $in: codesArray } };
    }

    const urls = await Url.find(query).sort({ clicks: -1 }).limit(limit);
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    const data = urls.map((url) => ({
      shortCode: url.shortCode,
      longUrl: url.longUrl,
      shortUrl: `${baseUrl}/${url.shortCode}`,
      clicks: url.clicks,
      createdAt: url.createdAt,
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieves traffic referrer metrics.
 * @route   GET /api/analytics/referrers
 * @returns {Promise<void>}
 */
const getReferrerStats = async (req, res, next) => {
  try {
    const { codes } = req.query;
    let clickQuery = { urlId: { $in: [] } };

    if (req.user) {
      clickQuery = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      const urls = await Url.find({ shortCode: { $in: codesArray } });
      const urlIds = urls.map(u => u._id);
      clickQuery = { urlId: { $in: urlIds } };
    }

    const clicks = await Click.find(clickQuery);
    const total = clicks.length;

    const referrerCounts = {};
    clicks.forEach((click) => {
      const ref = click.referrer || 'Direct';
      referrerCounts[ref] = (referrerCounts[ref] || 0) + 1;
    });

    const list = Object.keys(referrerCounts).map((ref) => {
      const count = referrerCounts[ref];
      const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
      return { referrer: ref, count, percentage };
    });

    list.sort((a, b) => b.count - a.count);

    res.status(200).json({
      success: true,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getClicksOverTime,
  getDeviceStats,
  getBrowserStats,
  getCountryStats,
  getUrlAnalytics,
  getTopUrls,
  getReferrerStats,
};
