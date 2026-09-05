/**
 * @file       ai.test.js
 * @description Integration and unit tests for QuickLink AI Intelligence Suite.
 * @module     tests/ai
 */

'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Url = require('../models/Url');
const Subscription = require('../models/Subscription');

describe('QuickLink AI Intelligence Suite', () => {
  let freeUser, proUser, businessUser;
  let freeToken, proToken, businessToken;

  beforeAll(async () => {
    // Connect DB if not connected
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quicklink_test');
    }
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $regex: /@aitest\.com$/ } });
    await Url.deleteMany({ shortCode: { $regex: /^ai-/ } });
    await Subscription.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Create test accounts across plan tiers
    freeUser = await User.create({
      name: 'AI Free User',
      email: `free-${Date.now()}@aitest.com`,
      password: 'Password123!',
      planId: 'free',
    });
    freeToken = freeUser.getJwtToken();

    proUser = await User.create({
      name: 'AI Pro User',
      email: `pro-${Date.now()}@aitest.com`,
      password: 'Password123!',
      planId: 'pro',
    });
    proToken = proUser.getJwtToken();

    businessUser = await User.create({
      name: 'AI Business User',
      email: `biz-${Date.now()}@aitest.com`,
      password: 'Password123!',
      planId: 'business',
    });
    businessToken = businessUser.getJwtToken();

    await Subscription.create({ userId: proUser._id, planId: 'pro', status: 'active' });
    await Subscription.create({ userId: businessUser._id, planId: 'business', status: 'active' });
  });

  // ── GROUP 1: Safety & Malware Scan ──────────────────────────
  describe('GROUP 1: URL Safety & Threat Scan', () => {
    it('Should return safe score for trusted domain', async () => {
      const res = await request(app)
        .post('/api/ai/safety-check')
        .set('Authorization', `Bearer ${freeToken}`)
        .send({ longUrl: 'https://github.com/expressjs/express' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.safetyScore).toBeGreaterThanOrEqual(50);
      expect(res.body.data.isMalicious).toBe(false);
    });

    it('Should detect test phishing strings / suspicious endpoints', async () => {
      const res = await request(app)
        .post('/api/ai/safety-check')
        .set('Authorization', `Bearer ${freeToken}`)
        .send({ longUrl: 'https://phishing-account-login-fake.com/steal-pass' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.isMalicious).toBe(true);
    });

    it('Should block malicious URL during creation', async () => {
      const res = await request(app)
        .post('/api/shorten')
        .set('Authorization', `Bearer ${freeToken}`)
        .send({ longUrl: 'https://phishing-credential-steal.com/login' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/phishing|malicious|unsafe|security/i);
    });
  });

  // ── GROUP 2: Smart Alias Generation & Categorization ──────────
  describe('GROUP 2: Smart Alias Suggestions & Categorization', () => {
    it('Pro user can request smart alias suggestions', async () => {
      const res = await request(app)
        .post('/api/ai/suggestions')
        .set('Authorization', `Bearer ${proToken}`)
        .send({ longUrl: 'https://example.com/developer-summit-2025' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.aliases)).toBe(true);
      expect(res.body.data.category).toBeDefined();
    });

    it('Free user gets 403 upgrade requirement for smart suggestions', async () => {
      const res = await request(app)
        .post('/api/ai/suggestions')
        .set('Authorization', `Bearer ${freeToken}`)
        .send({ longUrl: 'https://example.com/blog' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Pro or Business');
    });

    it('Should filter out existing database shortCodes from suggestions', async () => {
      const takenCode = `dev-summit-${Date.now()}`;
      await Url.create({
        longUrl: 'https://example.com/taken',
        shortCode: takenCode,
        userId: businessUser._id,
      });

      const res = await request(app)
        .post('/api/ai/suggestions')
        .set('Authorization', `Bearer ${businessToken}`)
        .send({ longUrl: 'https://example.com/developer-summit' });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.aliases).not.toContain(takenCode);
    });
  });

  // ── GROUP 3: Predictive Insights & Copilot Assistant ─────────
  describe('GROUP 3: Predictive Analytics & Copilot Assistant', () => {
    it('Pro/Business user can retrieve 30-day click prediction', async () => {
      const testUrl = await Url.create({
        longUrl: 'https://example.com/product-launch',
        shortCode: `ai-test-${Date.now()}`,
        userId: proUser._id,
      });

      const res = await request(app)
        .get(`/api/ai/predictions/${testUrl.shortCode}`)
        .set('Authorization', `Bearer ${proToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.predictedClicksNext30Days).toBeDefined();
    });

    it('Business user can interact with AI Copilot', async () => {
      const res = await request(app)
        .post('/api/ai/copilot')
        .set('Authorization', `Bearer ${businessToken}`)
        .send({ message: 'Which link had the highest clicks this week?' });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.reply).toBeDefined();
      expect(typeof res.body.data.reply).toBe('string');
    });

    it('Free user gets 403 when trying to access Copilot', async () => {
      const res = await request(app)
        .post('/api/ai/copilot')
        .set('Authorization', `Bearer ${freeToken}`)
        .send({ message: 'Hello AI' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('Business');
    });
  });
});
