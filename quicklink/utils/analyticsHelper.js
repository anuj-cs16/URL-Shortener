/**
 * @file       analyticsHelper.js
 * @description Helper functions to extract request IP, geo-location, user-agent details, and referrers.
 * @module     utils/analyticsHelper
 * @requires   ua-parser-js
 * @requires   geoip-lite
 */

'use strict';

const UAParser = require('ua-parser-js');
const geoip = require('geoip-lite');

/**
 * Parses user agent to detect device type.
 * @param {string} userAgent - User agent string from request headers.
 * @returns {string} 'mobile' | 'tablet' | 'desktop' | 'unknown'
 */
const getDeviceType = (userAgent) => {
  if (!userAgent) return 'unknown';
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  const type = device.type;

  if (type === 'mobile') return 'mobile';
  if (type === 'tablet') return 'tablet';
  if (!type) return 'desktop';
  return 'unknown';
};

/**
 * Parses user agent to extract browser name and version.
 * @param {string} userAgent - User agent string from request headers.
 * @returns {Object} `{ browser: string, version: string }`
 */
const getBrowserInfo = (userAgent) => {
  if (!userAgent) return { browser: 'Unknown', version: 'Unknown' };
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  return {
    browser: browser.name || 'Unknown',
    version: browser.version || 'Unknown',
  };
};

/**
 * Parses user agent to extract operating system.
 * @param {string} userAgent - User agent string from request headers.
 * @returns {string} Operating system name ('Windows' | 'MacOS' | 'iOS' | 'Android' | 'Linux' | 'Unknown')
 */
const getOSInfo = (userAgent) => {
  if (!userAgent) return 'Unknown';
  const parser = new UAParser(userAgent);
  const os = parser.getOS();
  const name = os.name;
  if (!name) return 'Unknown';

  const nameLower = name.toLowerCase();
  if (nameLower.includes('windows')) return 'Windows';
  if (nameLower.includes('mac os') || nameLower.includes('macos')) return 'MacOS';
  if (nameLower.includes('ios')) return 'iOS';
  if (nameLower.includes('android')) return 'Android';
  if (nameLower.includes('linux') || nameLower.includes('ubuntu') || nameLower.includes('debian')) return 'Linux';

  return 'Unknown';
};

/**
 * Resolves location details from IP address.
 * @param {string} ipAddress - Client IP address.
 * @returns {Object} `{ country: string, countryCode: string, city: string }`
 */
const getLocationInfo = (ipAddress) => {
  if (!ipAddress || ipAddress === '127.0.0.1' || ipAddress === '::1') {
    return {
      country: 'Unknown',
      countryCode: 'XX',
      city: 'Unknown',
    };
  }

  try {
    const geo = geoip.lookup(ipAddress);
    if (!geo) {
      return {
        country: 'Unknown',
        countryCode: 'XX',
        city: 'Unknown',
      };
    }

    let countryName = 'Unknown';
    if (geo.country) {
      try {
        const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
        countryName = regionNames.of(geo.country) || geo.country;
      } catch (e) {
        countryName = geo.country;
      }
    }

    return {
      country: countryName,
      countryCode: geo.country || 'XX',
      city: geo.city || 'Unknown',
    };
  } catch (err) {
    console.error('GeoIP lookup error:', err);
    return {
      country: 'Unknown',
      countryCode: 'XX',
      city: 'Unknown',
    };
  }
};

/**
 * Maps traffic source referrer header.
 * @param {string} referrerHeader - HTTP Referer header.
 * @returns {string} Traffic source category or domain.
 */
const getReferrer = (referrerHeader) => {
  if (!referrerHeader) return 'Direct';

  const refLower = referrerHeader.toLowerCase();
  if (refLower.includes('google')) return 'Google';
  if (refLower.includes('facebook') || refLower.includes('fb.')) return 'Facebook';
  if (refLower.includes('twitter') || refLower.includes('t.co')) return 'Twitter';
  if (refLower.includes('instagram')) return 'Instagram';

  try {
    const url = new URL(referrerHeader);
    return url.hostname.replace('www.', '');
  } catch (error) {
    return referrerHeader;
  }
};

/**
 * Extracts client IP address from request headers.
 * @param {Object} req - Express request object.
 * @returns {string} Resolved IP address.
 */
const getClientIP = (req) => {
  if (!req) return '127.0.0.1';

  let ip = '';

  if (req.headers['x-forwarded-for']) {
    const list = req.headers['x-forwarded-for'].split(',');
    ip = list[0].trim();
  } else if (req.headers['x-real-ip']) {
    ip = req.headers['x-real-ip'];
  } else if (req.connection && req.connection.remoteAddress) {
    ip = req.connection.remoteAddress;
  } else if (req.socket && req.socket.remoteAddress) {
    ip = req.socket.remoteAddress;
  }

  // Normalize localhost Loopback IPv6
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }

  return ip || '127.0.0.1';
};

module.exports = {
  getDeviceType,
  getBrowserInfo,
  getOSInfo,
  getLocationInfo,
  getReferrer,
  getClientIP,
};
