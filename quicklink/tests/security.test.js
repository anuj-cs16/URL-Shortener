/**
 * @file       security.test.js
 * @description Integration tests for Security API routes (2FA setup, enable, verify, disable, sessions, logs, IP blocking).
 * @requires   supertest
 * @requires   mongoose
 * @requires   server
 * @requires   models/User
 * @requires   models/TwoFactorAuth
 * @requires   models/BlockedIp
 * @requires   models/LoginActivity
 * @requires   speakeasy
 */

'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const TwoFactorAuth = require('../models/TwoFactorAuth');
const BlockedIp = require('../models/BlockedIp');
const LoginActivity = require('../models/LoginActivity');
const speakeasy = require('speakeasy');
const securityHelper = require('../utils/securityHelper');

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/quicklink_test';

describe('Security API Endpoints Suite', () => {
  let testUser;
  let testToken;

  beforeAll(async () => {
    process.env.MONGO_URI = TEST_MONGO_URI;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_key_12345';
    process.env.TWO_FACTOR_APP_NAME = 'QuickLink';
    process.env.ENCRYPTION_KEY = '12345678901234567890123456789012'; // 32 characters
    process.env.MAX_LOGIN_ATTEMPTS = '5';
    process.env.LOCK_TIME_MINUTES = '30';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGO_URI);
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await TwoFactorAuth.deleteMany({});
    await BlockedIp.deleteMany({});
    await LoginActivity.deleteMany({});

    testUser = await User.create({
      name: 'Security User',
      email: 'security@example.com',
      password: 'password123',
    });
    testToken = testUser.getJwtToken();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await TwoFactorAuth.deleteMany({});
    await BlockedIp.deleteMany({});
    await LoginActivity.deleteMany({});
    await mongoose.connection.close();
  });

  describe('2FA Operations', () => {
    it('Should successfully initiate 2FA setup', async () => {
      const res = await request(app)
        .post('/api/security/2fa/setup')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.secret).toBeDefined();
      expect(res.body.data.qrCode).toBeDefined();
    });

    it('Should successfully verify setup token and enable 2FA', async () => {
      // 1. Generate a temporary secret
      const tempSecret = speakeasy.generateSecret({ name: 'QuickLink' }).base32;
      const validToken = speakeasy.totp({
        secret: tempSecret,
        encoding: 'base32',
      });

      const res = await request(app)
        .post('/api/security/2fa/enable')
        .set('Authorization', `Bearer ${testToken}`)
        .send({
          token: validToken,
          secret: tempSecret,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.backupCodes).toHaveLength(8);

      // Verify db changes
      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isTwoFactorEnabled).toBe(true);

      const twoFA = await TwoFactorAuth.findOne({ userId: testUser._id });
      expect(twoFA).not.toBeNull();
      expect(twoFA.isEnabled).toBe(true);
    });

    it('Should successfully verify 2FA code during login stage', async () => {
      // Setup 2FA for the user first
      const tempSecret = speakeasy.generateSecret({ name: 'QuickLink' }).base32;
      const encryptedSecret = securityHelper.encryptData(tempSecret);
      const { hashedCodes } = securityHelper.generateBackupCodes(8);

      await TwoFactorAuth.create({
        userId: testUser._id,
        secret: encryptedSecret,
        isEnabled: true,
        backupCodes: hashedCodes,
        usedBackupCodes: [],
      });

      testUser.isTwoFactorEnabled = true;
      await testUser.save();

      // Create a partial token for the verify route
      const jwt = require('jsonwebtoken');
      const partialToken = jwt.sign(
        { id: testUser._id, twoFactorVerified: false, isPartial: true },
        process.env.JWT_SECRET + (testUser.jwtSecret || ''),
        { expiresIn: '10m' }
      );

      const validToken = speakeasy.totp({
        secret: tempSecret,
        encoding: 'base32',
      });

      const res = await request(app)
        .post('/api/security/2fa/verify')
        .set('Cookie', [`token=${partialToken}`])
        .send({ token: validToken })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.email).toBe(testUser.email);
    });

    it('Should successfully disable 2FA', async () => {
      const tempSecret = speakeasy.generateSecret({ name: 'QuickLink' }).base32;
      const encryptedSecret = securityHelper.encryptData(tempSecret);
      const { hashedCodes } = securityHelper.generateBackupCodes(8);

      await TwoFactorAuth.create({
        userId: testUser._id,
        secret: encryptedSecret,
        isEnabled: true,
        backupCodes: hashedCodes,
      });

      testUser.isTwoFactorEnabled = true;
      await testUser.save();

      const validToken = speakeasy.totp({
        secret: tempSecret,
        encoding: 'base32',
      });

      const verifiedToken = testUser.getJwtToken(true);

      const res = await request(app)
        .post('/api/security/2fa/disable')
        .set('Authorization', `Bearer ${verifiedToken}`)
        .send({
          password: 'password123',
          token: validToken,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toMatch(/disabled/i);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.isTwoFactorEnabled).toBe(false);
    });
  });

  describe('Active Sessions & Account Logs', () => {
    it('Should list current active session info', async () => {
      const res = await request(app)
        .get('/api/security/sessions')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].isCurrent).toBe(true);
    });

    it('Should terminate all active sessions by invalidating JWT secret', async () => {
      const oldJwtSecret = testUser.jwtSecret;

      const res = await request(app)
        .post('/api/security/sessions/terminate-all')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ password: 'password123' })
        .expect(200);

      expect(res.body.success).toBe(true);

      const updatedUser = await User.findById(testUser._id);
      expect(updatedUser.jwtSecret).not.toBe(oldJwtSecret);
    });

    it('Should get security overview data', async () => {
      const res = await request(app)
        .get('/api/security/overview')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.securityScore).toBeDefined();
      expect(res.body.data.recommendations).toBeDefined();
    });
  });

  describe('IP Blocking Guard', () => {
    it('Should deny requests from blocked IP addresses', async () => {
      await BlockedIp.create({
        ipAddress: '12.34.56.78',
        reason: 'Malicious attempts',
        isPermanent: true,
      });

      // Hit an endpoint using X-Forwarded-For to simulate the blocked IP
      const res = await request(app)
        .get('/api/auth/me')
        .set('X-Forwarded-For', '12.34.56.78')
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/denied/i);
    });
  });
});
