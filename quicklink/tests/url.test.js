/**
 * @file       url.test.js
 * @description Integration tests for QuickLink URL Shortener API endpoints and redirection flow.
 * @requires   supertest
 * @requires   mongoose
 * @requires   server
 * @requires   models/Url
 */

'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Url = require('../models/Url');
const User = require('../models/User');

// Define connection string for testing database
const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/quicklink_test';

describe('QuickLink URL Shortener API Suite', () => {
  let testUser;
  let testToken;
  
  // Connect to the test database prior to executing test cases
  beforeAll(async () => {
    // Override main env config
    process.env.MONGO_URI = TEST_MONGO_URI;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_key_12345';
    process.env.JWT_EXPIRE = '1h';
    
    // Connect if mongoose hasn't established a connection yet
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGO_URI);
    }
  });

  // Clear data collection before each test to maintain clean assertions
  beforeEach(async () => {
    await Url.deleteMany({});
    await User.deleteMany({});

    // Create authenticated user context
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    testToken = testUser.getJwtToken();
  });

  // Close database connections after testing finishes
  afterAll(async () => {
    await Url.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ── TEST 1: POST /api/shorten ──────────────────────────────
  describe('POST /api/shorten', () => {
    it('should create short URL with valid URL', async () => {
      const payload = { longUrl: 'https://www.google.com' };
      
      const res = await request(app)
        .post('/api/shorten')
        .send(payload)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.shortCode).toHaveLength(7);
      expect(res.body.data.shortUrl).toContain(res.body.data.shortCode);
      expect(res.body.data.clicks).toBe(0);
      expect(res.body.message).toBe('Short URL created successfully');

      // Verify persistence inside database
      const dbUrl = await Url.findOne({ shortCode: res.body.data.shortCode });
      expect(dbUrl).toBeTruthy();
      expect(dbUrl.longUrl).toBe(payload.longUrl);
    });

    it('should return 400 for invalid URL', async () => {
      const payload = { longUrl: 'not-a-valid-url-format' };

      const res = await request(app)
        .post('/api/shorten')
        .send(payload)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please enter a valid URL');
    });

    it('should return 400 for empty URL', async () => {
      const payload = { longUrl: '' };

      const res = await request(app)
        .post('/api/shorten')
        .send(payload)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please enter a valid URL');
    });

    it('should return 400 for duplicate custom code', async () => {
      // First creation
      await Url.create({
        longUrl: 'https://www.first-example.com',
        shortCode: 'my-custom-code',
        customCode: 'my-custom-code',
      });

      // Second creation attempt using the same code
      const payload = {
        longUrl: 'https://www.second-example.com',
        customCode: 'my-custom-code',
      };

      const res = await request(app)
        .post('/api/shorten')
        .send(payload)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Custom code is already in use');
    });
  });

  // ── TEST 2: GET /:shortCode ───────────────────────────────
  describe('GET /:shortCode', () => {
    it('should redirect to long URL', async () => {
      const targetUrl = 'https://www.wikipedia.org';
      const doc = await Url.create({
        longUrl: targetUrl,
        shortCode: 'wikiCode',
      });

      const res = await request(app)
        .get(`/${doc.shortCode}`)
        .expect(301);

      expect(res.headers.location).toBe(targetUrl);

      // Verify clicks incremented
      const updatedDoc = await Url.findOne({ shortCode: doc.shortCode });
      expect(updatedDoc.clicks).toBe(1);
      expect(updatedDoc.lastClickedAt).toBeTruthy();
    });

    it('should return 404 for non-existent code', async () => {
      const res = await request(app)
        .get('/noCode')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Short URL not found');
    });

    it('should return 410 for expired URL', async () => {
      const doc = await Url.create({
        longUrl: 'https://www.expired-site.com',
        shortCode: 'expired',
        expiresAt: new Date(Date.now() - 1000), // set expiry to past date
      });

      const res = await request(app)
        .get(`/${doc.shortCode}`)
        .expect('Content-Type', /json/)
        .expect(410);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('This short URL has expired');
    });
  });

  // ── TEST 3: GET /api/urls ─────────────────────────────────
  describe('GET /api/urls', () => {
    it('should return all URLs array', async () => {
      await Url.create({ longUrl: 'https://first.com', shortCode: 'first', userId: testUser._id });
      await Url.create({ longUrl: 'https://second.com', shortCode: 'second', userId: testUser._id });

      const res = await request(app)
        .get('/api/urls')
        .set('Cookie', [`token=${testToken}`])
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(2);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].shortCode).toBe('second'); // Newest first
    });

    it('should return empty array if no URLs', async () => {
      const res = await request(app)
        .get('/api/urls')
        .set('Cookie', [`token=${testToken}`])
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(0);
      expect(res.body.data).toHaveLength(0);
    });
  });

  // ── TEST 4: DELETE /api/urls/:shortCode ───────────────────
  describe('DELETE /api/urls/:shortCode', () => {
    it('should delete URL successfully', async () => {
      const doc = await Url.create({
        longUrl: 'https://delete-me.com',
        shortCode: 'delCode',
      });

      const res = await request(app)
        .delete(`/api/urls/${doc.shortCode}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Short URL deleted successfully');

      // Verify deletion in database
      const dbUrl = await Url.findOne({ shortCode: doc.shortCode });
      expect(dbUrl).toBeNull();
    });

    it('should return 404 if URL not found', async () => {
      const res = await request(app)
        .delete('/api/urls/notInDb')
        .expect('Content-Type', /json/)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Short URL not found');
    });
  });
});
