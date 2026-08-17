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
const { getCache, setCache } = require('../utils/cache');

/**
 * Retrieves aggregate statistics for the user's dashboard.
 * @route   GET /api/analytics/dashboard
 * @returns {Promise<void>}
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const { codes } = req.query;
    let cacheKey = '';

    if (req.user) {
      cacheKey = `analytics_dashboard_${req.user._id}`;
    } else if (codes) {
      cacheKey = `analytics_dashboard_guest_${codes}`;
    } else {
      cacheKey = `analytics_dashboard_guest_empty`;
    }

    const cached = getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    let query = { _id: { $in: [] } };
    let clickQuery = { urlId: { $in: [] } };

    if (req.user) {
      query = { userId: req.user._id };
      clickQuery = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      const urls = await Url.find({ shortCode: { $in: codesArray } }).select('_id').lean();
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
      Url.findOne(query).sort({ clicks: -1 }).select('shortCode longUrl clicks').lean(),
      Url.findOne(query).sort({ createdAt: -1 }).select('shortCode longUrl createdAt').lean(),
      Url.countDocuments({ ...query, expiresAt: { $gt: new Date() } }),
      Click.find(clickQuery).sort({ clickedAt: -1 }).limit(20).select('shortCode country countryCode city browser deviceType referrer clickedAt').lean(),
    ]);

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    const responseData = {
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
    };

    setCache(cacheKey, responseData, 300);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

const getClicksOverTime = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const { codes } = req.query;
    let cacheKey = '';

    if (req.user) {
      cacheKey = `clicks_time_${req.user._id}_${days}`;
    } else if (codes) {
      cacheKey = `clicks_time_guest_${codes}_${days}`;
    } else {
      cacheKey = `clicks_time_guest_empty_${days}`;
    }

    const cached = getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    let clickQuery = { urlId: { $in: [] } };

    if (req.user) {
      clickQuery = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      const urls = await Url.find({ shortCode: { $in: codesArray } }).select('_id').lean();
      const urlIds = urls.map(u => u._id);
      clickQuery = { urlId: { $in: urlIds } };
    }

    const startDate = moment().subtract(days - 1, 'days').startOf('day');

    const clicks = await Click.find({
      ...clickQuery,
      clickedAt: { $gte: startDate.toDate() },
    }).select('clickedAt').lean();

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

    const responseData = {
      success: true,
      data,
    };

    setCache(cacheKey, responseData, 300);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(responseData);
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
    let cacheKey = '';

    if (req.user) {
      cacheKey = `devices_${req.user._id}`;
    } else if (codes) {
      cacheKey = `devices_guest_${codes}`;
    } else {
      cacheKey = `devices_guest_empty`;
    }

    const cached = getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    let clickQuery = { urlId: { $in: [] } };

    if (req.user) {
      clickQuery = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      const urls = await Url.find({ shortCode: { $in: codesArray } }).select('_id').lean();
      const urlIds = urls.map(u => u._id);
      clickQuery = { urlId: { $in: urlIds } };
    }

    const clicks = await Click.find(clickQuery).select('deviceType').lean();
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

    const responseData = {
      success: true,
      data,
    };

    setCache(cacheKey, responseData, 300);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

const getBrowserStats = async (req, res, next) => {
  try {
    const { codes } = req.query;
    let cacheKey = '';

    if (req.user) {
      cacheKey = `browsers_${req.user._id}`;
    } else if (codes) {
      cacheKey = `browsers_guest_${codes}`;
    } else {
      cacheKey = `browsers_guest_empty`;
    }

    const cached = getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    let clickQuery = { urlId: { $in: [] } };

    if (req.user) {
      clickQuery = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      const urls = await Url.find({ shortCode: { $in: codesArray } }).select('_id').lean();
      const urlIds = urls.map(u => u._id);
      clickQuery = { urlId: { $in: urlIds } };
    }

    const clicks = await Click.find(clickQuery).select('browser').lean();
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

    const responseData = {
      success: true,
      data: topBrowsers,
    };

    setCache(cacheKey, responseData, 300);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(responseData);
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
    let cacheKey = '';

    if (req.user) {
      cacheKey = `countries_${req.user._id}`;
    } else if (codes) {
      cacheKey = `countries_guest_${codes}`;
    } else {
      cacheKey = `countries_guest_empty`;
    }

    const cached = getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    let clickQuery = { urlId: { $in: [] } };

    if (req.user) {
      clickQuery = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      const urls = await Url.find({ shortCode: { $in: codesArray } }).select('_id').lean();
      const urlIds = urls.map(u => u._id);
      clickQuery = { urlId: { $in: urlIds } };
    }

    const clicks = await Click.find(clickQuery).select('country countryCode').lean();
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

    const responseData = {
      success: true,
      data: topCountries,
    };

    setCache(cacheKey, responseData, 300);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

const getUrlAnalytics = async (req, res, next) => {
  try {
    const { shortCode } = req.params;
    const cacheKey = `url_analytics_${shortCode}`;

    const cached = getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    const url = await Url.findOne({ shortCode }).select('longUrl shortCode clicks createdAt expiresAt userId').lean();
    if (!url) {
      return res.status(404).json({
        success: false,
        message: 'Short URL not found',
      });
    }

    const clicks = await Click.find({ urlId: url._id })
      .sort({ clickedAt: -1 })
      .select('clickedAt deviceType browser country countryCode referrer ipAddress city operatingSystem')
      .lean();
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

    const responseData = {
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
    };

    setCache(cacheKey, responseData, 30);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(responseData);
  } catch (error) {
    next(error);
  }
};

const getTopUrls = async (req, res, next) => {
  try {
    const { codes } = req.query;
    const limit = parseInt(req.query.limit) || 5;
    let cacheKey = '';

    if (req.user) {
      cacheKey = `top_urls_${req.user._id}_${limit}`;
    } else if (codes) {
      cacheKey = `top_urls_guest_${codes}_${limit}`;
    } else {
      cacheKey = `top_urls_guest_empty_${limit}`;
    }

    const cached = getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    let query = { _id: { $in: [] } };
    if (req.user) {
      query = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      query = { shortCode: { $in: codesArray } };
    }

    const urls = await Url.find(query)
      .sort({ clicks: -1 })
      .limit(limit)
      .select('shortCode longUrl clicks createdAt')
      .lean();
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    const data = urls.map((url) => ({
      shortCode: url.shortCode,
      longUrl: url.longUrl,
      shortUrl: `${baseUrl}/${url.shortCode}`,
      clicks: url.clicks,
      createdAt: url.createdAt,
    }));

    const responseData = {
      success: true,
      data,
    };

    setCache(cacheKey, responseData, 300);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(responseData);
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
    let cacheKey = '';

    if (req.user) {
      cacheKey = `referrers_${req.user._id}`;
    } else if (codes) {
      cacheKey = `referrers_guest_${codes}`;
    } else {
      cacheKey = `referrers_guest_empty`;
    }

    const cached = getCache(cacheKey);
    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.status(200).json(cached);
    }

    let clickQuery = { urlId: { $in: [] } };

    if (req.user) {
      clickQuery = { userId: req.user._id };
    } else if (codes) {
      const codesArray = codes.split(',');
      const urls = await Url.find({ shortCode: { $in: codesArray } }).select('_id').lean();
      const urlIds = urls.map(u => u._id);
      clickQuery = { urlId: { $in: urlIds } };
    }

    const clicks = await Click.find(clickQuery).select('referrer').lean();
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

    const responseData = {
      success: true,
      data: list,
    };

    setCache(cacheKey, responseData, 300);
    res.setHeader('X-Cache', 'MISS');
    res.status(200).json(responseData);
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
