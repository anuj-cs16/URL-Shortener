/**
 * @file       exportController.js
 * @description Controllers managing CSV/JSON export downloads for URLs and redirection clicks history.
 * @module     controllers/exportController
 */

'use strict';

const Url = require('../models/Url');
const Click = require('../models/Click');

/**
 * Escapes characters for CSV values.
 * @param {*} val
 * @returns {string}
 */
const escapeCSV = (val) => {
  if (val === null || val === undefined) return '';
  const text = String(val).replace(/"/g, '""');
  if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
    return `"${text}"`;
  }
  return text;
};

/**
 * Exports user's URLs as a CSV file attachment.
 * @route   GET /api/export/urls/csv
 */
const exportUrlsCsv = async (req, res, next) => {
  try {
    const urls = await Url.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    let csvContent = 'Short URL,Original URL,Clicks,Created Date,Expiry Date,Status\n';

    for (const url of urls) {
      const shortUrl = `${baseUrl}/${url.shortCode}`;
      const status = url.isActive ? 'Active' : 'Inactive';
      const createdDate = url.createdAt ? new Date(url.createdAt).toISOString() : '';
      const expiryDate = url.expiresAt ? new Date(url.expiresAt).toISOString() : 'Never';

      csvContent += `${escapeCSV(shortUrl)},${escapeCSV(url.longUrl)},${url.clicks},${escapeCSV(createdDate)},${escapeCSV(expiryDate)},${escapeCSV(status)}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=quicklink-urls.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

/**
 * Exports user's URLs as a JSON file download.
 * @route   GET /api/export/urls/json
 */
const exportUrlsJson = async (req, res, next) => {
  try {
    const urls = await Url.find({ userId: req.user._id }).sort({ createdAt: -1 });
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    const formattedList = urls.map(url => ({
      shortUrl: `${baseUrl}/${url.shortCode}`,
      originalUrl: url.longUrl,
      clicks: url.clicks,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt,
      status: url.isActive ? 'Active' : 'Inactive',
      isPasswordProtected: !!url.urlPassword,
    }));

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=quicklink-urls.json');
    res.status(200).send(JSON.stringify(formattedList, null, 2));
  } catch (error) {
    next(error);
  }
};

/**
 * Exports user's URL redirection click events history as a CSV file.
 * @route   GET /api/export/analytics/csv
 */
const exportAnalyticsCsv = async (req, res, next) => {
  try {
    const userUrls = await Url.find({ userId: req.user._id }).select('_id shortCode');
    const urlIds = userUrls.map(u => u._id);
    const clicks = await Click.find({ urlId: { $in: urlIds } }).sort({ clickedAt: -1 });

    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';

    let csvContent = 'Short URL,Click Date,Country,Device,Browser,Referrer\n';

    for (const click of clicks) {
      const shortUrl = `${baseUrl}/${click.shortCode}`;
      const clickedDate = click.clickedAt ? new Date(click.clickedAt).toISOString() : '';
      const country = click.country || 'Unknown';
      const device = click.deviceType || 'Unknown';
      const browser = click.browser || 'Unknown';
      const referrer = click.referrer || 'Direct';

      csvContent += `${escapeCSV(shortUrl)},${escapeCSV(clickedDate)},${escapeCSV(country)},${escapeCSV(device)},${escapeCSV(browser)},${escapeCSV(referrer)}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=quicklink-analytics.csv');
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  exportUrlsCsv,
  exportUrlsJson,
  exportAnalyticsCsv,
};
