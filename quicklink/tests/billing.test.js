/**
 * @file       billing.test.js
 * @description Integration tests for payment history tables, invoice lists,
 *              bulk shorten routes limits, and CSV data stream exports.
 */

'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const PaymentHistory = require('../models/PaymentHistory');
const Url = require('../models/Url');
const { clearAllCache } = require('../utils/cache');

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/quicklink_test';

describe('QuickLink Billing History & Features Gating Suite', () => {
  let testUser;
  let testToken;

  beforeAll(async () => {
    process.env.MONGO_URI = TEST_MONGO_URI;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_key_12345';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGO_URI);
    }
  });

  beforeEach(async () => {
    clearAllCache();
    await User.deleteMany({});
    await Subscription.deleteMany({});
    await PaymentHistory.deleteMany({});
    await Url.deleteMany({});

    // Create member user
    testUser = await User.create({
      name: 'Billing Tester',
      email: 'billing-tester@example.com',
      password: 'password123',
      planId: 'free',
    });
    testToken = testUser.getJwtToken();

    await Subscription.create({
      userId: testUser._id,
      planId: 'free',
      status: 'free',
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Subscription.deleteMany({});
    await PaymentHistory.deleteMany({});
    await Url.deleteMany({});
    await mongoose.connection.close();
  });

  // ── TEST 1: GET /api/subscription/payments ───────────────────────
  describe('GET /api/subscription/payments', () => {
    it('should return invoice list of past transactions', async () => {
      // Mock some payments
      await PaymentHistory.create({
        userId: testUser._id,
        planId: 'pro',
        amount: 900,
        currency: 'usd',
        status: 'succeeded',
        stripePaymentIntentId: 'pi_test_123',
        stripeInvoiceId: 'in_123',
        stripeCustomerId: 'cus_123',
        paidAt: new Date(),
        receiptUrl: 'https://stripe.com/receipt',
      });

      const res = await request(app)
        .get('/api/subscription/payments')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.payments.length).toBe(1);
      expect(res.body.data.payments[0].stripeInvoiceId).toBe('in_123');
    });
  });

  // ── TEST 2: Gated bulk url shortening ───────────────────────────
  describe('POST /api/bulk-shorten', () => {
    it('should block bulk shortening requests on Free tier', async () => {
      await request(app)
        .post('/api/bulk-shorten')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ urls: ['https://example.com/1', 'https://example.com/2'] })
        .expect(403);
    });

    it('should accept bulk shortening requests on Pro tier', async () => {
      testUser.planId = 'pro';
      await testUser.save();
      await Subscription.updateOne({ userId: testUser._id }, { planId: 'pro', status: 'active' });

      const res = await request(app)
        .post('/api/bulk-shorten')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ urls: ['https://example.com/1', 'https://example.com/2'] })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.successCount).toBe(2);
    });
  });

  // ── TEST 3: Gated CSV exports ────────────────────────────────────
  describe('GET /api/export/urls/csv', () => {
    it('should deny url export access to Free tier members', async () => {
      await request(app)
        .get('/api/export/urls/csv')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(403);
    });

    it('should download CSV stream to Pro tier members', async () => {
      testUser.planId = 'pro';
      await testUser.save();
      await Subscription.updateOne({ userId: testUser._id }, { planId: 'pro', status: 'active' });

      await Url.create({
        userId: testUser._id,
        longUrl: 'https://google.com',
        shortCode: 'g123',
      });

      const res = await request(app)
        .get('/api/export/urls/csv')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('g123');
    });
  });
});
