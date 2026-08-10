/**
 * @file       auth.test.js
 * @description Integration tests for user registration, login, logout, profile checks, and URL ownership.
 * @requires   supertest
 * @requires   mongoose
 * @requires   server
 * @requires   models/User
 * @requires   models/Url
 */

'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Url = require('../models/Url');

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/quicklink_test';

describe('QuickLink User Authentication Suite', () => {

  // Setup connection prior to tests
  beforeAll(async () => {
    process.env.MONGO_URI = TEST_MONGO_URI;
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test_secret_key_12345';
    process.env.JWT_EXPIRE = '1h';

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(TEST_MONGO_URI);
    }
  });

  // Clear data collections before each test case
  beforeEach(async () => {
    await User.deleteMany({});
    await Url.deleteMany({});
  });

  // Close database connections after testing finishes
  afterAll(async () => {
    await User.deleteMany({});
    await Url.deleteMany({});
    await mongoose.connection.close();
  });

  // ── TEST 1: POST /api/auth/register ────────────────────────
  describe('POST /api/auth/register', () => {
    it('Should register with valid details', async () => {
      const payload = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(payload)
        .expect('Content-Type', /json/)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Account created successfully');
      expect(res.body.data.user.name).toBe(payload.name);
      expect(res.body.data.user.email).toBe(payload.email);
      expect(res.body.data.user.role).toBe('user');
      expect(res.body.data.token).toBeDefined();

      // Check cookie is set
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');

      // Verify db persistence
      const user = await User.findOne({ email: payload.email });
      expect(user).toBeTruthy();
      expect(user.name).toBe(payload.name);
    });

    it('Should return 400 for duplicate email', async () => {
      const payload = {
        name: 'John Doe',
        email: 'duplicate@example.com',
        password: 'password123',
      };

      // Pre-create user in database
      await User.create(payload);

      const res = await request(app)
        .post('/api/auth/register')
        .send(payload)
        .expect('Content-Type', /json/)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Email already registered');
    });

    it('Should return 400 for missing name', async () => {
      const payload = {
        email: 'john@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(payload)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please enter all required fields');
    });

    it('Should return 400 for invalid email', async () => {
      const payload = {
        name: 'John Doe',
        email: 'invalid-email-format',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(payload)
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('Should return 400 for short password', async () => {
      const payload = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123', // less than 8 chars
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(payload)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ── TEST 2: POST /api/auth/login ───────────────────────────
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create user template to log in with
      await User.create({
        name: 'Alice Smith',
        email: 'alice@example.com',
        password: 'password123',
      });
    });

    it('Should login with correct credentials', async () => {
      const payload = {
        email: 'alice@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(payload)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.data.user.email).toBe(payload.email);
      expect(res.body.data.token).toBeDefined();

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=');
    });

    it('Should return 401 for wrong password', async () => {
      const payload = {
        email: 'alice@example.com',
        password: 'wrongpassword',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(payload)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('Should return 401 for wrong email', async () => {
      const payload = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      const res = await request(app)
        .post('/api/auth/login')
        .send(payload)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('Should return 400 for missing fields', async () => {
      const payload = { email: 'alice@example.com' };

      const res = await request(app)
        .post('/api/auth/login')
        .send(payload)
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please provide email and password');
    });
  });

  // ── TEST 3: GET /api/auth/me ───────────────────────────────
  describe('GET /api/auth/me', () => {
    it('Should return user data when logged in', async () => {
      const user = await User.create({
        name: 'Bob Jones',
        email: 'bob@example.com',
        password: 'password123',
      });
      const token = user.getJwtToken();

      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', [`token=${token}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(user.email);
      expect(res.body.data.user.name).toBe(user.name);
    });

    it('Should return 401 when not logged in', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Please login to access this');
    });
  });

  // ── TEST 4: POST /api/auth/logout ──────────────────────────
  describe('POST /api/auth/logout', () => {
    it('Should logout and clear cookie', async () => {
      const user = await User.create({
        name: 'Logout Test',
        email: 'logout@example.com',
        password: 'password123',
      });
      const token = user.getJwtToken();

      const res = await request(app)
        .post('/api/auth/logout')
        .set('Cookie', [`token=${token}`])
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Logged out successfully');

      // Cookie should be expired
      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('token=;');
    });
  });

  // ── TEST 5: URL OWNERSHIP AND GUEST SEPARATION ───────────────
  describe('URL Ownership and Access Scope', () => {
    let userA, userB, tokenA, tokenB;

    beforeEach(async () => {
      // Create user A
      userA = await User.create({
        name: 'User A',
        email: 'usera@example.com',
        password: 'password123',
      });
      tokenA = userA.getJwtToken();

      // Create user B
      userB = await User.create({
        name: 'User B',
        email: 'userb@example.com',
        password: 'password123',
      });
      tokenB = userB.getJwtToken();
    });

    it('User can delete their own URL', async () => {
      // User A creates a URL
      const resShort = await request(app)
        .post('/api/shorten')
        .set('Cookie', [`token=${tokenA}`])
        .send({ longUrl: 'https://www.usera.com' })
        .expect(201);

      const shortCode = resShort.body.data.shortCode;

      // User A deletes their URL
      const resDelete = await request(app)
        .delete(`/api/urls/${shortCode}`)
        .set('Cookie', [`token=${tokenA}`])
        .expect(200);

      expect(resDelete.body.success).toBe(true);
      expect(resDelete.body.message).toBe('Short URL deleted successfully');

      // Verify gone
      const dbUrl = await Url.findOne({ shortCode });
      expect(dbUrl).toBeNull();
    });

    it('User cannot delete another user\'s URL', async () => {
      // User A creates a URL
      const resShort = await request(app)
        .post('/api/shorten')
        .set('Cookie', [`token=${tokenA}`])
        .send({ longUrl: 'https://www.usera.com' })
        .expect(201);

      const shortCode = resShort.body.data.shortCode;

      // User B tries to delete User A's URL
      const resDelete = await request(app)
        .delete(`/api/urls/${shortCode}`)
        .set('Cookie', [`token=${tokenB}`])
        .expect(403);

      expect(resDelete.body.success).toBe(false);
      expect(resDelete.body.message).toBe('You can only delete your own URLs');

      // Verify still exists
      const dbUrl = await Url.findOne({ shortCode });
      expect(dbUrl).toBeTruthy();
    });

    it('Guest user gets empty URL history', async () => {
      // User A creates a URL
      await request(app)
        .post('/api/shorten')
        .set('Cookie', [`token=${tokenA}`])
        .send({ longUrl: 'https://www.usera.com' });

      // Request as Guest (no cookie)
      const resHistory = await request(app)
        .get('/api/urls')
        .expect(200);

      expect(resHistory.body.success).toBe(true);
      expect(resHistory.body.count).toBe(0);
      expect(resHistory.body.data).toEqual([]);
    });
  });
});
