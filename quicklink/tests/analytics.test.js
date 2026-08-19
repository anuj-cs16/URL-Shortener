/**
 * @file       analytics.test.js
 * @description Integration tests for Click tracking, geolocation, browser/device metrics aggregation,
 *              and single URL analytics routes.
 * @requires   supertest
 * @requires   mongoose
 * @requires   server
 * @requires   models/User
 * @requires   models/Url
 * @requires   models/Click
 */

'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Url = require('../models/Url');
const Click = require('../models/Click');
const { clearAllCache } = require('../utils/cache');

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/quicklink_test';

const MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
const TABLET_UA = 'Mozilla/5.0 (iPad; CPU OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1';
const DESKTOP_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.84 Safari/537.36';

describe('QuickLink Analytics Dashboard Suite', () => {
  let userA, userB, tokenA, tokenB, urlA, urlB;

  beforeAll(async () => {
    process.env.MONGO_URI = TEST_MONGO_URI;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_key_12345';
    process.env.JWT_EXPIRE = '1h';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGO_URI);
    }
  });

  beforeEach(async () => {
    clearAllCache();
    await User.deleteMany({});
    await Url.deleteMany({});
    await Click.deleteMany({});

    // Create Test User A
    userA = await User.create({
      name: 'User A',
      email: 'usera@example.com',
      password: 'password123',
    });
    tokenA = userA.getJwtToken();

    // Create Test User B
    userB = await User.create({
      name: 'User B',
      email: 'userb@example.com',
      password: 'password123',
    });
    tokenB = userB.getJwtToken();

    // Create URL owned by User A
    urlA = await Url.create({
      longUrl: 'https://www.usera.com',
      shortCode: 'codeA',
      userId: userA._id,
    });

    // Create URL owned by User B
    urlB = await Url.create({
      longUrl: 'https://www.userb.com',
      shortCode: 'codeB',
      userId: userB._id,
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Url.deleteMany({});
    await Click.deleteMany({});
    await mongoose.connection.close();
  });

  // ── TEST 1: GET /api/analytics/dashboard ───────────────────
  describe('GET /api/analytics/dashboard', () => {
    it('Should return empty stats for guest user without codes', async () => {
      const res = await request(app)
        .get('/api/analytics/dashboard')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUrls).toBe(0);
      expect(res.body.data.totalClicks).toBe(0);
    });

    it('Should return stats for guest user with codes', async () => {
      const res = await request(app)
        .get(`/api/analytics/dashboard?codes=${urlA.shortCode}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUrls).toBe(1);
    });

    it('Should return stats for logged in user', async () => {
      // Seed a click for User A
      await Click.create({
        urlId: urlA._id,
        shortCode: urlA.shortCode,
        userId: userA._id,
        deviceType: 'desktop',
      });

      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Cookie', [`token=${tokenA}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUrls).toBe(1);
      expect(res.body.data.totalClicks).toBe(1);
      expect(res.body.data.mostClickedUrl.shortCode).toBe(urlA.shortCode);
    });

    it('Should return 0 counts for new user with no links', async () => {
      const newUser = await User.create({
        name: 'New User',
        email: 'new@example.com',
        password: 'password123',
      });
      const newToken = newUser.getJwtToken();

      const res = await request(app)
        .get('/api/analytics/dashboard')
        .set('Cookie', [`token=${newToken}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.totalUrls).toBe(0);
      expect(res.body.data.totalClicks).toBe(0);
      expect(res.body.data.mostClickedUrl).toBeNull();
    });
  });

  // ── TEST 2: GET /api/analytics/clicks-over-time ────────────
  describe('GET /api/analytics/clicks-over-time', () => {
    it('Should return 7 days of data by default', async () => {
      const res = await request(app)
        .get('/api/analytics/clicks-over-time')
        .set('Cookie', [`token=${tokenA}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(7);
    });

    it('Should return 30 days when ?days=30', async () => {
      const res = await request(app)
        .get('/api/analytics/clicks-over-time?days=30')
        .set('Cookie', [`token=${tokenA}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(30);
    });

    it('Should fill missing days with 0', async () => {
      const res = await request(app)
        .get('/api/analytics/clicks-over-time?days=7')
        .set('Cookie', [`token=${tokenA}`])
        .expect(200);

      const totalClicksInResponse = res.body.data.reduce((acc, curr) => acc + curr.clicks, 0);
      expect(totalClicksInResponse).toBe(0);
    });
  });

  // ── TEST 3: GET /api/analytics/devices ─────────────────────
  describe('GET /api/analytics/devices', () => {
    it('Should return device breakdown and percentages should add to 100', async () => {
      // Seed clicks for User A
      await Click.create({ urlId: urlA._id, shortCode: urlA.shortCode, userId: userA._id, deviceType: 'desktop' });
      await Click.create({ urlId: urlA._id, shortCode: urlA.shortCode, userId: userA._id, deviceType: 'mobile' });
      await Click.create({ urlId: urlA._id, shortCode: urlA.shortCode, userId: userA._id, deviceType: 'mobile' });

      const res = await request(app)
        .get('/api/analytics/devices')
        .set('Cookie', [`token=${tokenA}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      const devices = res.body.data;
      expect(devices.desktop.count).toBe(1);
      expect(devices.mobile.count).toBe(2);
      expect(devices.tablet.count).toBe(0);
      expect(devices.unknown.count).toBe(0);

      const sumPercentage = devices.desktop.percentage + devices.mobile.percentage + devices.tablet.percentage + devices.unknown.percentage;
      expect(sumPercentage).toBe(100);
    });
  });

  // ── TEST 4: GET /api/analytics/url/:shortCode ──────────────
  describe('GET /api/analytics/url/:shortCode', () => {
    it('Should return analytics for own URL', async () => {
      const res = await request(app)
        .get(`/api/analytics/url/${urlA.shortCode}`)
        .set('Cookie', [`token=${tokenA}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.url.shortCode).toBe(urlA.shortCode);
    });

    it('Should return analytics for another user\'s URL (publicly accessible)', async () => {
      const res = await request(app)
        .get(`/api/analytics/url/${urlA.shortCode}`)
        .set('Cookie', [`token=${tokenB}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.url.shortCode).toBe(urlA.shortCode);
    });

    it('Should return 404 for non-existent URL', async () => {
      const res = await request(app)
        .get('/api/analytics/url/nonexistentCode')
        .set('Cookie', [`token=${tokenA}`])
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Short URL not found');
    });
  });

  // ── TEST 5: Click Tracking on Redirection ───────────────────
  describe('Click Tracking on Redirect', () => {
    it('Should save click data on redirect and increment URL clicks count', async () => {
      // Access redirected route with mobile UA and mock header referrer
      const resRedirect = await request(app)
        .get(`/${urlA.shortCode}`)
        .set('User-Agent', MOBILE_UA)
        .set('Referer', 'https://www.google.com')
        .expect(301);

      expect(resRedirect.headers.location).toBe(urlA.longUrl);

      // Verify URL model increment
      const updatedUrl = await Url.findById(urlA._id);
      expect(updatedUrl.clicks).toBe(1);
      expect(updatedUrl.lastClickedAt).toBeDefined();

      // Verify Click log creation
      const click = await Click.findOne({ urlId: urlA._id });
      expect(click).toBeTruthy();
      expect(click.deviceType).toBe('mobile');
      expect(click.referrer).toBe('Google');
      expect(click.browser).toBe('Mobile Safari');
      expect(click.operatingSystem).toBe('iOS');
    });

    it('Should detect tablet user agents correctly', async () => {
      await request(app)
        .get(`/${urlA.shortCode}`)
        .set('User-Agent', TABLET_UA)
        .expect(301);

      const click = await Click.findOne({ urlId: urlA._id });
      expect(click).toBeTruthy();
      expect(click.deviceType).toBe('tablet');
    });

    it('Should detect desktop user agents correctly', async () => {
      await request(app)
        .get(`/${urlA.shortCode}`)
        .set('User-Agent', DESKTOP_UA)
        .expect(301);

      const click = await Click.findOne({ urlId: urlA._id });
      expect(click).toBeTruthy();
      expect(click.deviceType).toBe('desktop');
      expect(click.browser).toBe('Chrome');
      expect(click.operatingSystem).toBe('Windows');
    });
  });
});
