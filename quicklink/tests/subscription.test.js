/**
 * @file       subscription.test.js
 * @description Integration tests for subscription plans configurations, usage limits,
 *              checkout, webhook events, and payments history.
 */

'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const UsageRecord = require('../models/UsageRecord');
const PaymentHistory = require('../models/PaymentHistory');
const Url = require('../models/Url');
const { clearAllCache } = require('../utils/cache');

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/quicklink_test';

describe('QuickLink Subscription & Billing API Suite', () => {
  let testUser;
  let testToken;

  beforeAll(async () => {
    process.env.MONGO_URI = TEST_MONGO_URI;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_key_12345';
    process.env.STRIPE_PRO_PRICE_ID = 'price_pro_test_id';
    process.env.STRIPE_BUSINESS_PRICE_ID = 'price_business_test_id';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGO_URI);
    }
  });

  beforeEach(async () => {
    clearAllCache();
    await User.deleteMany({});
    await Subscription.deleteMany({});
    await UsageRecord.deleteMany({});
    await PaymentHistory.deleteMany({});
    await Url.deleteMany({});

    // Create default Free member
    testUser = await User.create({
      name: 'Premium Tester',
      email: 'tester@example.com',
      password: 'password123',
      planId: 'free',
    });
    testToken = testUser.getJwtToken();

    // Create matching Free subscription
    await Subscription.create({
      userId: testUser._id,
      planId: 'free',
      status: 'free',
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Subscription.deleteMany({});
    await UsageRecord.deleteMany({});
    await PaymentHistory.deleteMany({});
    await Url.deleteMany({});
    await mongoose.connection.close();
  });

  // ── TEST 1: GET /api/subscription/plans ──────────────────────────
  describe('GET /api/subscription/plans', () => {
    it('should return all pricing plan tiers', async () => {
      const res = await request(app)
        .get('/api/subscription/plans')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.plans.length).toBe(3);
      expect(res.body.data.currentPlan).toBe('free');
    });
  });

  // ── TEST 2: GET /api/subscription/current ────────────────────────
  describe('GET /api/subscription/current', () => {
    it('should retrieve current plan details and usage record', async () => {
      const res = await request(app)
        .get('/api/subscription/current')
        .set('Authorization', `Bearer ${testToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.subscription.planId).toBe('free');
      expect(res.body.data.usage.urlsLimit).toBe(10);
    });
  });

  // ── TEST 3: POST /api/subscription/checkout ──────────────────────
  describe('POST /api/subscription/checkout', () => {
    it('should block requests with invalid plan IDs', async () => {
      await request(app)
        .post('/api/subscription/checkout')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ planId: 'invalid_plan' })
        .expect(400);
    });
  });

  // ── TEST 4: Usage limits enforcement ─────────────────────────────
  describe('Usage limits enforcement', () => {
    it('should prevent URL creation when user exceeds monthly limits', async () => {
      const { getCurrentUsage } = require('../middleware/usageLimiter');
      const usage = await getCurrentUsage(testUser._id);
      
      // Simulate user already shortened 10 URLs (Free tier limit)
      usage.urlsCreated = 10;
      await usage.save();

      const res = await request(app)
        .post('/api/shorten')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ longUrl: 'https://google.com' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('limit reached');
    });

    it('should block custom code aliases on Free plan', async () => {
      const res = await request(app)
        .post('/api/shorten')
        .set('Authorization', `Bearer ${testToken}`)
        .send({ longUrl: 'https://google.com', customCode: 'google-alias' })
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('require Pro plan');
    });
  });

  // ── TEST 5: Stripe webhook simulator ─────────────────────────────
  describe('POST /api/subscription/webhook signature and flow simulation', () => {
    it('should process webhook events and upgrade plans on checkout.session.completed', async () => {
      // Mock stripe event signature validation bypass
      const stripeService = require('../utils/stripeService');
      const originalConstruct = stripeService.constructWebhookEvent;

      stripeService.constructWebhookEvent = (payload, sig) => ({
        type: 'checkout.session.completed',
        data: {
          object: {
            customer: 'cus_test_123',
            subscription: 'sub_test_123',
            metadata: { userId: testUser._id.toString() },
          },
        },
      });

      // Mock Stripe SDK getSubscription call
      const stripe = require('stripe');
      const spyRetrieve = jest.spyOn(stripe.prototype.subscriptions, 'retrieve').mockImplementation(async () => ({
        status: 'active',
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        cancel_at_period_end: false,
        trial_end: null,
        items: {
          data: [{ price: { id: 'price_pro_test_id' } }],
        },
      }));

      await request(app)
        .post('/api/subscription/webhook')
        .set('stripe-signature', 'dummy_sig')
        .send({ id: 'evt_test_completed' })
        .expect(200);

      // Verify that user record is upgraded
      const upgradedUser = await User.findById(testUser._id);
      expect(upgradedUser.planId).toBe('pro');
      expect(upgradedUser.stripeCustomerId).toBe('cus_test_123');

      // Verify that active subscription details are written
      const sub = await Subscription.findOne({ userId: testUser._id });
      expect(sub.planId).toBe('pro');
      expect(sub.status).toBe('active');
      expect(sub.stripeSubscriptionId).toBe('sub_test_123');

      // Clean up mock spy
      spyRetrieve.mockRestore();
      stripeService.constructWebhookEvent = originalConstruct;
    });

    it('should downgrade plans on customer.subscription.deleted', async () => {
      // Mock webhook signature validation bypass
      const stripeService = require('../utils/stripeService');
      const originalConstruct = stripeService.constructWebhookEvent;

      stripeService.constructWebhookEvent = (payload, sig) => ({
        type: 'customer.subscription.deleted',
        data: {
          object: {
            id: 'sub_test_123',
          },
        },
      });

      // Pre-set user subscription state as Pro
      testUser.planId = 'pro';
      await testUser.save();

      await Subscription.create({
        userId: testUser._id,
        planId: 'pro',
        status: 'active',
        stripeSubscriptionId: 'sub_test_123',
      });

      await request(app)
        .post('/api/subscription/webhook')
        .set('stripe-signature', 'dummy_sig')
        .send({ id: 'evt_test_deleted' })
        .expect(200);

      const downgradedUser = await User.findById(testUser._id);
      expect(downgradedUser.planId).toBe('free');

      const sub = await Subscription.findOne({ userId: testUser._id });
      expect(sub.planId).toBe('free');
      expect(sub.status).toBe('canceled');

      stripeService.constructWebhookEvent = originalConstruct;
    });
  });
});
