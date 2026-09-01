/**
 * @file       domainController.js
 * @description Controllers for custom domain management — add, verify, status,
 *              set default, remove, recheck DNS, and setup guides.
 * @module     controllers/domainController
 * @requires   models/CustomDomain
 * @requires   models/Url
 * @requires   utils/domainService
 * @requires   utils/emailService
 */

'use strict';

const CustomDomain = require('../models/CustomDomain');
const Url = require('../models/Url');
const Notification = require('../models/Notification');
const domainService = require('../utils/domainService');
const emailService = require('../utils/emailService');

/**
 * Adds a new custom domain for a Business plan user.
 * @route   POST /api/domains
 * @access  Protected (Business plan only)
 */
const addCustomDomain = async (req, res, next) => {
  try {
    const { domain } = req.body;
    const userId = req.user._id;

    if (!domain) {
      return res.status(400).json({
        success: false,
        message: 'Domain is required',
      });
    }

    const cleanDomain = domain.toLowerCase().trim();

    // Validate domain
    const validation = await domainService.validateDomain(cleanDomain);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error,
      });
    }

    // Check if user already has a custom domain (Business plan allows 1)
    const existingDomain = await CustomDomain.findOne({
      userId,
      status: { $nin: ['removed'] },
    });

    if (existingDomain) {
      return res.status(400).json({
        success: false,
        message: 'You already have a custom domain configured. Business plan allows 1 custom domain.',
        data: { existingDomain: existingDomain.domain },
      });
    }

    // Generate verification token
    const verificationToken = domainService.generateVerificationToken();

    // Create CustomDomain record
    const customDomain = new CustomDomain({
      userId,
      domain: cleanDomain,
      status: 'pending_verification',
      verificationToken,
      verificationMethod: 'txt_record',
    });

    await customDomain.save();

    // Get DNS instructions
    const dnsInstructions = customDomain.getDnsInstructions();

    // Send email notification in background
    emailService.sendDomainAddedEmail(req.user, {
      domain: cleanDomain,
      verificationToken,
      dnsInstructions,
    }).catch((err) => {
      console.error(`Domain added email failed: ${err.message}`);
    });

    res.status(201).json({
      success: true,
      data: {
        domain: cleanDomain,
        status: 'pending_verification',
        verification: {
          method: 'txt_record',
          host: `_quicklink-verify.${cleanDomain}`,
          type: 'TXT',
          value: `quicklink-verify=${verificationToken}`,
        },
        instructions: dnsInstructions.instructions,
      },
      message: 'Domain added successfully. Please verify DNS ownership.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies DNS ownership of a custom domain.
 * @route   POST /api/domains/:domain/verify
 * @access  Protected
 */
const verifyDomain = async (req, res, next) => {
  try {
    const { domain } = req.params;
    const userId = req.user._id;

    const customDomain = await CustomDomain.findOne({
      domain: domain.toLowerCase(),
      userId,
      status: { $nin: ['removed'] },
    });

    if (!customDomain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found',
      });
    }

    if (customDomain.status !== 'pending_verification' && customDomain.status !== 'dns_failed') {
      return res.status(400).json({
        success: false,
        message: `Domain is already in "${customDomain.status}" state`,
      });
    }

    // Run DNS verification
    const dnsResult = await domainService.verifyDnsRecord(
      customDomain.domain,
      customDomain.verificationToken
    );

    if (dnsResult.verified) {
      // Update status: DNS verified → SSL provisioning
      customDomain.status = 'dns_verified';
      customDomain.dnsVerifiedAt = new Date();
      customDomain.errorMessage = null;
      await customDomain.save();

      // Send verification success email
      emailService.sendDomainVerifiedEmail(req.user, {
        domain: customDomain.domain,
      }).catch((err) => {
        console.error(`Domain verified email failed: ${err.message}`);
      });

      // Start SSL provisioning in background
      customDomain.status = 'ssl_provisioning';
      await customDomain.save();

      // Provision SSL (simulated for Cloud Run)
      domainService.provisionSslCertificate(customDomain.domain)
        .then(async (sslResult) => {
          if (sslResult.success) {
            // Send domain active email
            emailService.sendDomainActiveEmail(req.user, {
              domain: customDomain.domain,
              exampleUrl: `https://${customDomain.domain}/example`,
            }).catch((err) => {
              console.error(`Domain active email failed: ${err.message}`);
            });

            // Create notification
            await Notification.create({
              userId,
              type: 'welcome', // Fallback type compatible with existing DB enum
              title: 'Custom Domain Active! 🌐',
              message: `Your domain ${customDomain.domain} is now live and ready to use.`,
              isEmailSent: true,
              emailSentAt: new Date(),
              metadata: { domain: customDomain.domain },
            });
          }
        })
        .catch((err) => {
          console.error(`SSL provisioning failed: ${err.message}`);
        });

      return res.status(200).json({
        success: true,
        data: {
          status: 'ssl_provisioning',
          message: 'DNS verified! SSL certificate is being provisioned. This takes 2-5 minutes.',
        },
      });
    }

    // DNS verification failed
    customDomain.errorMessage = dnsResult.error || 'DNS record not found';
    await customDomain.save();

    return res.status(200).json({
      success: false,
      data: {
        status: 'pending_verification',
        expected: dnsResult.expected,
        found: dnsResult.records,
        message: dnsResult.error || 'DNS record not found yet. Please wait for propagation and try again.',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets all custom domains for the authenticated user.
 * @route   GET /api/domains
 * @access  Protected
 */
const getDomains = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const domains = await CustomDomain.find({
      userId,
      status: { $nin: ['removed'] },
    }).sort({ createdAt: -1 }).lean();

    // Enrich with URL counts
    const enrichedDomains = await Promise.all(
      domains.map(async (d) => {
        const urlCount = await Url.countDocuments({ customDomain: d.domain });
        return {
          domain: d.domain,
          status: d.status,
          isDefault: d.isDefault,
          urlCount,
          sslExpiresAt: d.sslExpiresAt,
          dnsVerifiedAt: d.dnsVerifiedAt,
          health: d.status === 'active' ? 'healthy' : d.status,
          createdAt: d.createdAt,
          lastCheckedAt: d.lastCheckedAt,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: {
        domains: enrichedDomains,
        maxDomains: 1,
        usedDomains: domains.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Gets detailed status for a specific domain.
 * @route   GET /api/domains/:domain/status
 * @access  Protected
 */
const getDomainStatus = async (req, res, next) => {
  try {
    const { domain } = req.params;
    const userId = req.user._id;

    const customDomain = await CustomDomain.findOne({
      domain: domain.toLowerCase(),
      userId,
      status: { $nin: ['removed'] },
    });

    if (!customDomain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found',
      });
    }

    // Run health check for active domains
    let healthReport = null;
    if (customDomain.status === 'active') {
      healthReport = await domainService.checkDomainHealth(customDomain.domain);
    }

    // Get URL stats
    const urlCount = await Url.countDocuments({ customDomain: customDomain.domain });
    const Click = require('../models/Click');
    const urlIds = await Url.find({ customDomain: customDomain.domain }).select('_id').lean();
    const totalClicks = await Click.countDocuments({
      urlId: { $in: urlIds.map((u) => u._id) },
    });

    const daysUntilExpiry = customDomain.sslExpiresAt
      ? Math.ceil((new Date(customDomain.sslExpiresAt) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    res.status(200).json({
      success: true,
      data: {
        domain: customDomain.domain,
        status: customDomain.status,
        dns: {
          verified: !!customDomain.dnsVerifiedAt,
          verifiedAt: customDomain.dnsVerifiedAt,
          method: customDomain.verificationMethod,
        },
        ssl: {
          active: customDomain.status === 'active' || customDomain.status === 'ssl_active',
          issuedAt: customDomain.sslIssuedAt,
          expiresAt: customDomain.sslExpiresAt,
          daysUntilExpiry,
          autoRenew: customDomain.sslAutoRenew,
          certificateId: customDomain.sslCertificateId,
        },
        health: healthReport
          ? {
              overall: healthReport.overall,
              dns: healthReport.dns,
              ssl: healthReport.ssl,
              redirect: healthReport.redirect,
              lastChecked: customDomain.lastCheckedAt,
            }
          : null,
        stats: {
          totalUrls: urlCount,
          totalClicks,
        },
        isDefault: customDomain.isDefault,
        createdAt: customDomain.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Sets a domain as the default for new short URLs.
 * @route   PUT /api/domains/:domain/default
 * @access  Protected
 */
const setDefaultDomain = async (req, res, next) => {
  try {
    const { domain } = req.params;
    const userId = req.user._id;

    const customDomain = await CustomDomain.findOne({
      domain: domain.toLowerCase(),
      userId,
      status: 'active',
    });

    if (!customDomain) {
      return res.status(404).json({
        success: false,
        message: 'Active domain not found. Domain must be active to set as default.',
      });
    }

    // Remove default flag from all other domains
    await CustomDomain.updateMany(
      { userId, _id: { $ne: customDomain._id } },
      { $set: { isDefault: false } }
    );

    // Set this domain as default
    customDomain.isDefault = true;
    await customDomain.save();

    res.status(200).json({
      success: true,
      message: `${customDomain.domain} is now your default short URL domain.`,
      data: { domain: customDomain.domain, isDefault: true },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Removes a custom domain and migrates URLs to default domain.
 * @route   DELETE /api/domains/:domain
 * @access  Protected
 */
const removeDomain = async (req, res, next) => {
  try {
    const { domain } = req.params;
    const userId = req.user._id;

    const customDomain = await CustomDomain.findOne({
      domain: domain.toLowerCase(),
      userId,
      status: { $nin: ['removed'] },
    });

    if (!customDomain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found',
      });
    }

    // Update all URLs using this domain to use null (default domain)
    const updateResult = await Url.updateMany(
      { customDomain: customDomain.domain },
      { $set: { customDomain: null } }
    );

    // Remove domain setup
    await domainService.removeDomainSetup(customDomain.domain);

    res.status(200).json({
      success: true,
      message: `Domain ${customDomain.domain} has been removed. ${updateResult.modifiedCount} URLs migrated to default domain.`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Forces a DNS recheck on a domain.
 * @route   POST /api/domains/:domain/recheck
 * @access  Protected
 */
const recheckDns = async (req, res, next) => {
  try {
    const { domain } = req.params;
    const userId = req.user._id;

    const customDomain = await CustomDomain.findOne({
      domain: domain.toLowerCase(),
      userId,
      status: { $nin: ['removed'] },
    });

    if (!customDomain) {
      return res.status(404).json({
        success: false,
        message: 'Domain not found',
      });
    }

    // Run DNS check
    const dnsResult = await domainService.verifyDnsRecord(
      customDomain.domain,
      customDomain.verificationToken
    );

    customDomain.lastCheckedAt = new Date();

    if (!dnsResult.verified && customDomain.status === 'active') {
      // DNS was working but now failing
      customDomain.status = 'dns_failed';
      customDomain.errorMessage = 'DNS records are no longer pointing correctly';
      await customDomain.save();

      // Send health alert email
      emailService.sendDomainHealthAlertEmail(req.user, {
        domain: customDomain.domain,
        issue: 'DNS records are no longer pointing correctly',
      }).catch((err) => {
        console.error(`Domain health alert email failed: ${err.message}`);
      });

      return res.status(200).json({
        success: true,
        data: {
          domain: customDomain.domain,
          status: 'dns_failed',
          message: 'DNS records are no longer valid. Please update your DNS settings.',
          records: dnsResult.records,
        },
      });
    }

    if (dnsResult.verified && customDomain.status === 'dns_failed') {
      // DNS was failing but now working again
      customDomain.status = 'active';
      customDomain.errorMessage = null;
    }

    await customDomain.save();

    res.status(200).json({
      success: true,
      data: {
        domain: customDomain.domain,
        status: customDomain.status,
        dnsVerified: dnsResult.verified,
        lastCheckedAt: customDomain.lastCheckedAt,
        message: dnsResult.verified ? 'DNS records are valid' : 'DNS verification pending',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Returns DNS setup guides for popular providers.
 * @route   GET /api/domains/setup-guide
 * @access  Protected
 */
const getDomainSetupGuide = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        providers: [
          {
            name: 'Cloudflare',
            steps: [
              'Log into your Cloudflare dashboard',
              'Select the domain you want to use',
              'Go to DNS → Records',
              'Click "Add record"',
              'Select Type: TXT',
              'Enter Name: _quicklink-verify',
              'Enter Content: quicklink-verify=YOUR_TOKEN',
              'Set TTL to Auto',
              'Click Save',
              'Wait 2-5 minutes for propagation',
              'Also add a CNAME record pointing your domain to the QuickLink Cloud Run URL',
            ],
          },
          {
            name: 'GoDaddy',
            steps: [
              'Log into your GoDaddy account',
              'Go to My Products → DNS',
              'Select your domain',
              'Click "Add" under Records',
              'Select Type: TXT',
              'Enter Host: _quicklink-verify',
              'Enter TXT Value: quicklink-verify=YOUR_TOKEN',
              'Set TTL to 600 (10 minutes)',
              'Click Save',
              'DNS changes may take up to 48 hours to propagate',
            ],
          },
          {
            name: 'Namecheap',
            steps: [
              'Log into your Namecheap account',
              'Go to Domain List → Manage',
              'Click "Advanced DNS" tab',
              'Click "Add New Record"',
              'Select Type: TXT Record',
              'Enter Host: _quicklink-verify',
              'Enter Value: quicklink-verify=YOUR_TOKEN',
              'Set TTL to Automatic',
              'Click the green checkmark to save',
              'Wait 10-30 minutes for propagation',
            ],
          },
          {
            name: 'Google Domains',
            steps: [
              'Log into Google Domains (domains.google.com)',
              'Select your domain',
              'Go to DNS → Custom records',
              'Click "Manage custom records"',
              'Enter Host name: _quicklink-verify',
              'Select Type: TXT',
              'Enter Data: quicklink-verify=YOUR_TOKEN',
              'Set TTL to 300',
              'Click Save',
              'Wait 5-10 minutes for propagation',
            ],
          },
        ],
        supportedTlds: domainService.getSupportedTlds(),
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addCustomDomain,
  verifyDomain,
  getDomains,
  getDomainStatus,
  setDefaultDomain,
  removeDomain,
  recheckDns,
  getDomainSetupGuide,
};
