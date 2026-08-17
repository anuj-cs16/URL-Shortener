/**
 * @file       securityHelper.js
 * @description Helper functions for encryption, TOTP token checks, backup codes generation, and risk calculation.
 * @module     utils/securityHelper
 */

'use strict';

const crypto = require('crypto');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const CryptoJS = require('crypto-js');
const mongoose = require('mongoose');

/**
 * Encrypts data using AES-256 with the ENCRYPTION_KEY environment variable.
 * @param {string} data - Plain text to encrypt.
 * @returns {string} Encrypted string.
 */
const encryptData = (data) => {
  const key = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
  return CryptoJS.AES.encrypt(data, key).toString();
};

/**
 * Decrypts AES-256 encrypted data.
 * @param {string} encryptedData - Encrypted cipher text.
 * @returns {string} Decrypted plain text.
 */
const decryptData = (encryptedData) => {
  const key = process.env.ENCRYPTION_KEY || '12345678901234567890123456789012';
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

/**
 * Hashes a string (e.g. backup codes) using SHA-256.
 * @param {string} code - The input string.
 * @returns {string} The SHA-256 hash.
 */
const hashCode = (code) => {
  return CryptoJS.SHA256(code).toString();
};

/**
 * Generates a new 2FA TOTP secret and returns base32, otpauthUrl, and QR code image.
 * @param {string} userEmail - User's email.
 * @returns {Promise<Object>}
 */
const generateTwoFactorSecret = async (userEmail) => {
  const appName = process.env.TWO_FACTOR_APP_NAME || 'QuickLink';
  const secret = speakeasy.generateSecret({
    name: `${appName}:${userEmail}`,
    issuer: appName,
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    otpauthUrl: secret.otpauth_url,
    qrCodeUrl,
  };
};

/**
 * Verifies a 6-digit TOTP token against the secret.
 * @param {string} secret - Base32 secret key.
 * @param {string} token - 6-digit verification code.
 * @returns {boolean}
 */
const verifyTwoFactorToken = (secret, token) => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow +/- 2 intervals (60s drift tolerance)
  });
};

/**
 * Generates a set of backup codes formatted as XXXX-XXXX.
 * Returns plain codes (for display) and hashed versions (for DB).
 * @param {number} [count=8] - Quantity to generate.
 * @returns {Object} { plainCodes: Array, hashedCodes: Array }
 */
const generateBackupCodes = (count = 8) => {
  const plainCodes = [];
  const hashedCodes = [];

  for (let i = 0; i < count; i++) {
    const p1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const p2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const code = `${p1}-${p2}`;
    plainCodes.push(code);
    hashedCodes.push(hashCode(code));
  }

  return { plainCodes, hashedCodes };
};

/**
 * Verifies if the entered backup code matches any of the remaining hashed codes.
 * @param {Array<string>} hashedCodes - Hashed backup codes list.
 * @param {string} enteredCode - Raw entered backup code.
 * @returns {number} Index of matched code, or -1.
 */
const verifyBackupCode = (hashedCodes, enteredCode) => {
  const hashed = hashCode(enteredCode);
  return hashedCodes.indexOf(hashed);
};

/**
 * Checks if the current country represents a new country location for this user.
 * @param {Object} user - User document instance.
 * @param {string} currentCountry - Country code.
 * @returns {Promise<boolean>}
 */
const isNewLocation = async (user, currentCountry) => {
  if (!user || !user.knownIpAddresses || user.knownIpAddresses.length === 0) {
    return false;
  }

  try {
    const LoginActivity = mongoose.model('LoginActivity');
    const pastLogins = await LoginActivity.find({
      userId: user._id,
      activityType: 'login_success',
    });

    const countries = pastLogins
      .map((log) => log.country)
      .filter((c) => c && c !== 'Unknown');

    if (countries.length === 0) {
      return false;
    }

    return !countries.includes(currentCountry);
  } catch (err) {
    console.error(`Error in isNewLocation helper: ${err.message}`);
    return false;
  }
};

/**
 * Computes login transaction risk score.
 * @param {Object} user - User document instance.
 * @param {Object} loginData - { ip, country, time, browser, device }
 * @returns {Promise<number>} Risk score (0 - 100).
 */
const calculateRiskScore = async (user, loginData) => {
  let score = 0;

  if (user) {
    // 1. IP comparison (+30)
    if (!user.knownIpAddresses.includes(loginData.ip)) {
      score += 30;
    }

    // 2. Country comparison (+40)
    const isNew = await isNewLocation(user, loginData.country);
    if (isNew) {
      score += 40;
    }

    // 3. Browser comparison (+10)
    try {
      const LoginActivity = mongoose.model('LoginActivity');
      const browserSeen = await LoginActivity.findOne({
        userId: user._id,
        activityType: 'login_success',
        browser: loginData.browser,
      });
      if (!browserSeen && user.knownIpAddresses.length > 0) {
        score += 10;
      }
    } catch (e) {}
  }

  // 4. Unusual hour (+20)
  const hour = new Date().getHours();
  if (hour >= 2 && hour <= 5) {
    score += 20;
  }

  return score;
};

/**
 * Generates cryptographically secure random hexadecimal token.
 * @param {number} [length=32] - Byte length of token.
 * @returns {string} Hex string.
 */
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

module.exports = {
  encryptData,
  decryptData,
  hashCode,
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  generateBackupCodes,
  verifyBackupCode,
  isNewLocation,
  calculateRiskScore,
  generateSecureToken,
};
