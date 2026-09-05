/**
 * @file       CustomDomain.js
 * @description Mongoose schema and model definition for Custom Domain records.
 *              Tracks domain verification, SSL provisioning, and health status.
 * @module     models/CustomDomain
 * @requires   mongoose
 * @requires   crypto
 */

'use strict';

const mongoose = require('mongoose');

// Reserved domain prefixes that cannot be used
const RESERVED_DOMAINS = [
  'www', 'api', 'admin', 'mail', 'ftp',
  'quicklink', 'app', 'dashboard',
];

/**
 * Validates a domain string format.
 * @param {string} domain - The domain to validate.
 * @returns {boolean} True if valid domain format.
 */
const isValidDomainFormat = (domain) => {
  if (!domain || typeof domain !== 'string') return false;
  // Must have at least one dot, no protocol, no path
  const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/;
  return domainRegex.test(domain) && domain.length <= 253;
};

const customDomainSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  domain: {
    type: String,
    required: [true, 'Domain name is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  status: {
    type: String,
    enum: [
      'pending_verification',
      'dns_verified',
      'ssl_provisioning',
      'ssl_active',
      'active',
      'ssl_expired',
      'dns_failed',
      'suspended',
      'removed',
    ],
    default: 'pending_verification',
  },
  verificationToken: {
    type: String,
    required: true,
  },
  verificationMethod: {
    type: String,
    enum: ['txt_record', 'cname_record'],
    default: 'txt_record',
  },
  dnsVerifiedAt: {
    type: Date,
    default: null,
  },
  sslCertificateId: {
    type: String,
    default: null,
  },
  sslIssuedAt: {
    type: Date,
    default: null,
  },
  sslExpiresAt: {
    type: Date,
    default: null,
  },
  sslAutoRenew: {
    type: Boolean,
    default: true,
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  urlCount: {
    type: Number,
    default: 0,
  },
  lastCheckedAt: {
    type: Date,
    default: null,
  },
  errorMessage: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for query optimization
customDomainSchema.index({ userId: 1 });
customDomainSchema.index({ status: 1 });
customDomainSchema.index({ sslExpiresAt: 1 });

/**
 * Checks if the custom domain is currently active and serving traffic.
 * @returns {boolean} True if status is 'active'.
 */
customDomainSchema.methods.isActive = function () {
  return this.status === 'active';
};

/**
 * Checks if the SSL certificate needs renewal (within 30 days of expiry).
 * @returns {boolean} True if renewal is needed.
 */
customDomainSchema.methods.needsSslRenewal = function () {
  if (!this.sslExpiresAt) return false;
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return new Date(this.sslExpiresAt) <= thirtyDaysFromNow;
};

/**
 * Returns DNS setup instructions based on the verification method.
 * @returns {Object} Instructions object with record type, host, and value.
 */
customDomainSchema.methods.getDnsInstructions = function () {
  if (this.verificationMethod === 'cname_record') {
    const defaultDomain = process.env.DEFAULT_DOMAIN || 'quicklink.run.app';
    return {
      method: 'cname_record',
      records: [
        {
          type: 'CNAME',
          host: this.domain,
          value: defaultDomain,
          ttl: 300,
        },
      ],
      instructions: [
        'Go to your DNS provider (e.g., Cloudflare, GoDaddy, Namecheap)',
        `Add a CNAME record for ${this.domain}`,
        `Set the target/value to: ${defaultDomain}`,
        'Set TTL to 300 seconds (or Auto)',
        'Wait 5-10 minutes for DNS propagation',
        'Click the Verify button below',
      ],
    };
  }

  // Default: TXT record verification
  return {
    method: 'txt_record',
    records: [
      {
        type: 'TXT',
        host: `_quicklink-verify.${this.domain}`,
        value: `quicklink-verify=${this.verificationToken}`,
        ttl: 300,
      },
    ],
    instructions: [
      'Go to your DNS provider (e.g., Cloudflare, GoDaddy, Namecheap)',
      'Add a new TXT record',
      'Set the Host/Name to: _quicklink-verify',
      `Set the Value to: quicklink-verify=${this.verificationToken}`,
      'Set TTL to 300 seconds (or Auto)',
      'Wait 5-10 minutes for DNS propagation',
      'Click the Verify button below',
    ],
  };
};

/**
 * Pre-save hook to update timestamps and validate domain.
 */
customDomainSchema.pre('save', function () {
  // Update the updatedAt timestamp on every save
  this.updatedAt = new Date();

  // Validate domain format when domain is new or modified
  if (this.isModified('domain')) {
    // Validate domain format
    if (!isValidDomainFormat(this.domain)) {
      throw new Error('Invalid domain format. Please enter a valid domain (e.g., mybrand.link)');
    }

    // Extract the subdomain/prefix to check against reserved list
    const domainParts = this.domain.split('.');
    const prefix = domainParts[0].toLowerCase();

    if (RESERVED_DOMAINS.includes(prefix)) {
      throw new Error(`The domain prefix "${prefix}" is reserved and cannot be used`);
    }
  }
});

module.exports = mongoose.model('CustomDomain', customDomainSchema);
