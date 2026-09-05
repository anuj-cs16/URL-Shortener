/**
 * @file       urlScraper.js
 * @description Safe web scraper to extract destination webpage title, metadata, and text snippet for AI context.
 * @module     utils/urlScraper
 */

'use strict';

const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrapes destination webpage metadata safely.
 * @param {string} targetUrl
 * @returns {Promise<{title: string, description: string, bodySnippet: string}>}
 */
async function scrapeUrlMetadata(targetUrl) {
  try {
    const response = await axios.get(targetUrl, {
      timeout: 5000,
      headers: {
        'User-Agent': 'QuickLinkBot/1.0 (+https://quicklink.app/bot)',
        Accept: 'text/html,application/xhtml+xml',
      },
      maxContentLength: 2 * 1024 * 1024, // 2MB max
    });

    const $ = cheerio.load(response.data);
    const title =
      $('title').text().trim() ||
      $('meta[property="og:title"]').attr('content') ||
      '';
    const description =
      $('meta[name="description"]').attr('content') ||
      $('meta[property="og:description"]').attr('content') ||
      '';

    // Remove non-content tags
    $('script, style, nav, footer, noscript, svg, iframe').remove();
    const bodySnippet = $('body').text().replace(/\s+/g, ' ').trim().slice(0, 1000);

    return { title, description, bodySnippet };
  } catch (error) {
    return { title: '', description: '', bodySnippet: '' };
  }
}

module.exports = { scrapeUrlMetadata };
