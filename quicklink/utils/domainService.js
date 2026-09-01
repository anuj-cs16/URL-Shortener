/**
 * @file       domainService.js
 * @description Domain management utility functions for DNS verification,
 *              SSL provisioning, health checks, and domain routing.
 * @module     utils/domainService
 * @requires   dns
 * @requires   crypto
 * @requires   models/CustomDomain
 */

'use strict';

const dns = require('dns');
const crypto = require('crypto');
const CustomDomain = require('../models/CustomDomain');

// Supported TLDs for custom domains
const SUPPORTED_TLDS = [
  '.com', '.io', '.co', '.in', '.net',
  '.org', '.link', '.click', '.xyz',
  '.me', '.dev', '.app', '.sh', '.to',
];

// Reserved domain prefixes
const RESERVED_PREFIXES = [
  'www', 'api', 'admin', 'mail', 'ftp',
  'quicklink', 'app', 'dashboard',
];

/**
 * Returns the list of supported TLDs.
 * @returns {string[]} Array of supported TLD strings.
 */
const getSupportedTlds = () => {
  return [...SUPPORTED_TLDS];
};

/**
 * Validates a domain for use as a custom domain.
 * @param {string} domain - The domain to validate.
 * @returns {Promise<Object>} { valid: boolean, error?: string }
 */
const validateDomain = async (domain) => {
  if (!domain || typeof domain !== 'string') {
    return { valid: false, error: 'Domain is required' };
  }

  const cleanDomain = domain.toLowerCase().trim();

  // Check format
  const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  if (!domainRegex.test(cleanDomain)) {
    return { valid: false, error: 'Invalid domain format. Example: mybrand.link' };
  }

  if (cleanDomain.length > 253) {
    return { valid: false, error: 'Domain name is too long (max 253 characters)' };
  }

  // Check it's not a subdomain of our own app
  const defaultDomain = process.env.DEFAULT_DOMAIN || '';
  if (defaultDomain && cleanDomain.endsWith(defaultDomain)) {
    return { valid: false, error: 'Cannot use a subdomain of the default application domain' };
  }

  // Check reserved prefixes
  const prefix = cleanDomain.split('.')[0];
  if (RESERVED_PREFIXES.includes(prefix)) {
    return { valid: false, error: `The domain prefix "${prefix}" is reserved` };
  }

  // Check TLD is supported
  const tld = '.' + cleanDomain.split('.').pop();
  if (!SUPPORTED_TLDS.includes(tld)) {
    return { valid: false, error: `TLD "${tld}" is not supported. Supported: ${SUPPORTED_TLDS.join(', ')}` };
  }

  // Check if domain is already taken
  const existing = await CustomDomain.findOne({
    domain: cleanDomain,
    status: { $nin: ['removed'] },
  });

  if (existing) {
    return { valid: false, error: 'This domain is already registered by another user' };
  }

  return { valid: true };
};

/**
 * Generates a random 64-character hex verification token.
 * @returns {string} Hex token string.
 */
const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Verifies a DNS TXT record for domain ownership.
 * @param {string} domain - The domain to verify.
 * @param {string} token - The expected verification token.
 * @returns {Promise<Object>} { verified: boolean, records: string[] }
 */
const verifyDnsRecord = async (domain, token) => {
  const hostname = `_quicklink-verify.${domain}`;
  const expectedValue = `quicklink-verify=${token}`;

  try {
    const records = await dns.promises.resolveTxt(hostname);
    // dns.resolveTxt returns array of arrays (each TXT record can have multiple strings)
    const flatRecords = records.map((r) => r.join(''));

    const found = flatRecords.some((record) => record === expectedValue);

    return {
      verified: found,
      records: flatRecords,
      expected: expectedValue,
    };
  } catch (error) {
    // ENODATA or ENOTFOUND means no records exist yet
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND' || error.code === 'SERVFAIL') {
      return {
        verified: false,
        records: [],
        expected: expectedValue,
        error: 'No DNS TXT records found. Please wait for DNS propagation (up to 48 hours).',
      };
    }
    return {
      verified: false,
      records: [],
      expected: expectedValue,
      error: `DNS lookup failed: ${error.message}`,
    };
  }
};

/**
 * Verifies a CNAME record for domain routing.
 * @param {string} domain - The domain to check.
 * @returns {Promise<Object>} { verified: boolean, target: string }
 */
const verifyCnameRecord = async (domain) => {
  const expectedTarget = process.env.DEFAULT_DOMAIN || 'quicklink.run.app';

  try {
    const records = await dns.promises.resolveCname(domain);

    const found = records.some(
      (record) => record.toLowerCase() === expectedTarget.toLowerCase()
    );

    return {
      verified: found,
      target: records.length > 0 ? records[0] : '',
      expected: expectedTarget,
    };
  } catch (error) {
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND' || error.code === 'SERVFAIL') {
      return {
        verified: false,
        target: '',
        expected: expectedTarget,
        error: 'No CNAME record found. Please wait for DNS propagation.',
      };
    }
    return {
      verified: false,
      target: '',
      expected: expectedTarget,
      error: `DNS lookup failed: ${error.message}`,
    };
  }
};

/**
 * Provisions an SSL certificate for a custom domain.
 * On Cloud Run, SSL is managed by Google. This function simulates
 * the lifecycle and updates the domain record accordingly.
 * @param {string} domain - The domain to provision SSL for.
 * @returns {Promise<Object>} { success: boolean, expiresAt?: Date }
 */
const provisionSslCertificate = async (domain) => {
  try {
    console.log(`[SSL] Provisioning certificate for ${domain}...`);

    const customDomain = await CustomDomain.findOne({ domain });
    if (!customDomain) {
      return { success: false, error: 'Domain not found' };
    }

    // Generate a certificate ID (simulated — Cloud Run handles actual TLS)
    const certId = `cr-cert-${crypto.randomBytes(8).toString('hex')}`;
    const issuedAt = new Date();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days

    customDomain.sslCertificateId = certId;
    customDomain.sslIssuedAt = issuedAt;
    customDomain.sslExpiresAt = expiresAt;
    customDomain.status = 'active';
    customDomain.errorMessage = null;
    await customDomain.save();

    console.log(`[SSL] Certificate provisioned for ${domain}. Expires: ${expiresAt.toISOString()}`);

    return { success: true, certId, expiresAt };
  } catch (error) {
    console.error(`[SSL] Provisioning failed for ${domain}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Renews an SSL certificate for a custom domain.
 * @param {string} domain - The domain to renew SSL for.
 * @returns {Promise<Object>} { renewed: boolean }
 */
const renewSslCertificate = async (domain) => {
  try {
    const customDomain = await CustomDomain.findOne({ domain, status: 'active' });
    if (!customDomain) {
      return { renewed: false, error: 'Active domain not found' };
    }

    if (!customDomain.needsSslRenewal()) {
      return { renewed: false, message: 'Certificate does not need renewal yet' };
    }

    console.log(`[SSL] Renewing certificate for ${domain}...`);

    const certId = `cr-cert-${crypto.randomBytes(8).toString('hex')}`;
    const issuedAt = new Date();
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);

    customDomain.sslCertificateId = certId;
    customDomain.sslIssuedAt = issuedAt;
    customDomain.sslExpiresAt = expiresAt;
    customDomain.errorMessage = null;
    await customDomain.save();

    console.log(`[SSL] Certificate renewed for ${domain}. New expiry: ${expiresAt.toISOString()}`);

    return { renewed: true, certId, expiresAt };
  } catch (error) {
    console.error(`[SSL] Renewal failed for ${domain}: ${error.message}`);
    return { renewed: false, error: error.message };
  }
};

/**
 * Runs a full health check on a custom domain.
 * @param {string} domain - The domain to check.
 * @returns {Promise<Object>} Health report object.
 */
const checkDomainHealth = async (domain) => {
  const report = {
    domain,
    dns: { status: 'unknown', message: '' },
    ssl: { status: 'unknown', expiresAt: null },
    redirect: { status: 'unknown', responseTime: null },
    overall: 'unknown',
  };

  try {
    const customDomain = await CustomDomain.findOne({ domain });
    if (!customDomain) {
      report.overall = 'error';
      report.dns.message = 'Domain not found in database';
      return report;
    }

    // Check DNS resolution
    try {
      const addresses = await dns.promises.resolve4(domain);
      if (addresses && addresses.length > 0) {
        report.dns = { status: 'ok', message: `Resolves to ${addresses[0]}` };
      } else {
        report.dns = { status: 'error', message: 'No A records found' };
      }
    } catch (dnsErr) {
      report.dns = { status: 'error', message: `DNS resolution failed: ${dnsErr.code || dnsErr.message}` };
    }

    // Check SSL status
    if (customDomain.sslExpiresAt) {
      const daysUntilExpiry = Math.ceil(
        (new Date(customDomain.sslExpiresAt) - new Date()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 0) {
        report.ssl = { status: 'expired', expiresAt: customDomain.sslExpiresAt };
      } else if (daysUntilExpiry <= 30) {
        report.ssl = { status: 'warning', expiresAt: customDomain.sslExpiresAt, daysLeft: daysUntilExpiry };
      } else {
        report.ssl = { status: 'ok', expiresAt: customDomain.sslExpiresAt, daysLeft: daysUntilExpiry };
      }
    } else {
      report.ssl = { status: 'error', message: 'No SSL certificate provisioned' };
    }

    // Redirect check (simulated — measure DNS resolution time as proxy)
    const startTime = Date.now();
    try {
      await dns.promises.resolve4(domain);
      const responseTime = Date.now() - startTime;
      report.redirect = { status: 'ok', responseTime };
    } catch {
      report.redirect = { status: 'error', responseTime: null };
    }

    // Update last checked timestamp
    customDomain.lastCheckedAt = new Date();
    await customDomain.save();

    // Determine overall health
    const allOk = report.dns.status === 'ok' &&
                  (report.ssl.status === 'ok' || report.ssl.status === 'warning') &&
                  report.redirect.status === 'ok';
    const hasError = report.dns.status === 'error' || report.ssl.status === 'expired' || report.ssl.status === 'error';

    report.overall = allOk ? 'healthy' : hasError ? 'unhealthy' : 'degraded';

    return report;
  } catch (error) {
    report.overall = 'error';
    report.dns.message = error.message;
    return report;
  }
};

/**
 * Configures server routing for a custom domain.
 * On Cloud Run, this is handled via domain mappings.
 * @param {string} domain - The domain to setup.
 * @returns {Promise<Object>} { success: boolean }
 */
const setupDomainRouting = async (domain) => {
  try {
    console.log(`[Domain Routing] Setting up routing for ${domain}`);
    // Cloud Run domain mapping is managed via gcloud CLI.
    // This function records that the domain is ready for traffic.
    const customDomain = await CustomDomain.findOne({ domain });
    if (customDomain && customDomain.status === 'active') {
      console.log(`[Domain Routing] Domain ${domain} is active and accepting traffic`);
      return { success: true };
    }
    return { success: false, error: 'Domain is not in active state' };
  } catch (error) {
    console.error(`[Domain Routing] Setup failed for ${domain}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Removes domain routing and cleans up resources.
 * @param {string} domain - The domain to remove.
 * @returns {Promise<Object>} { success: boolean }
 */
const removeDomainSetup = async (domain) => {
  try {
    console.log(`[Domain Routing] Removing setup for ${domain}`);

    const customDomain = await CustomDomain.findOne({ domain });
    if (customDomain) {
      customDomain.status = 'removed';
      customDomain.sslCertificateId = null;
      customDomain.sslIssuedAt = null;
      customDomain.sslExpiresAt = null;
      customDomain.isDefault = false;
      customDomain.errorMessage = null;
      await customDomain.save();
    }

    console.log(`[Domain Routing] Domain ${domain} removed successfully`);
    return { success: true };
  } catch (error) {
    console.error(`[Domain Routing] Removal failed for ${domain}: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  validateDomain,
  generateVerificationToken,
  verifyDnsRecord,
  verifyCnameRecord,
  provisionSslCertificate,
  renewSslCertificate,
  checkDomainHealth,
  setupDomainRouting,
  removeDomainSetup,
  getSupportedTlds,
};
