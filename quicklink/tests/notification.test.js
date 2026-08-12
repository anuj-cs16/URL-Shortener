/**
 * @file       notification.test.js
 * @description Integration tests for Notification API routes, settings updates,
 *              in-app alerts, read status toggling, and deletes.
 * @requires   supertest
 * @requires   mongoose
 * @requires   server
 * @requires   models/Notification
 * @requires   models/EmailSettings
 * @requires   models/User
 * @created    2026-08-12
 */

'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const Notification = require('../models/Notification');
const EmailSettings = require('../models/EmailSettings');
const User = require('../models/User');

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/quicklink_test';

describe('Notification API Endpoints Suite', () => {
  let testUser;
  let testToken;

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
    await Notification.deleteMany({});
    await EmailSettings.deleteMany({});
    await User.deleteMany({});

    testUser = await User.create({
      name: 'Tester User',
      email: 'tester@example.com',
      password: 'password123',
    });
    testToken = testUser.getJwtToken();

    // Lazy load or pre-create email settings preferences
    await EmailSettings.create({
      userId: testUser._id,
      weeklyReport: true,
      urlCreated: false,
      clickMilestone: true,
      urlExpiring: true,
      urlExpired: false,
      loginAlert: true,
      milestoneValues: [10, 50, 100],
    });
  });

  afterAll(async () => {
    await Notification.deleteMany({});
    await EmailSettings.deleteMany({});
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  // ── TEST 1: GET /api/notifications ───────────────────────────
  describe('GET /api/notifications', () => {
    it('should retrieve list of notifications and unread count', async () => {
      // Seed some test notifications
      await Notification.create([
        { userId: testUser._id, type: 'welcome', title: 'Welcome Title', message: 'Message details', isRead: false },
        { userId: testUser._id, type: 'url_created', title: 'URL Created', message: 'Message details', isRead: true },
      ]);

      const res = await request(app)
        .get('/api/notifications')
        .set('Cookie', `token=${testToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toHaveLength(2);
      expect(res.body.data.unreadCount).toBe(1);
    });

    it('should block requests without authentication', async () => {
      await request(app)
        .get('/api/notifications')
        .expect(401);
    });
  });

  // ── TEST 2: PUT /api/notifications/:id/read ──────────────────
  describe('PUT /api/notifications/:id/read', () => {
    it('should mark a specific notification as read', async () => {
      const notif = await Notification.create({
        userId: testUser._id,
        type: 'login_alert',
        title: 'Security Alert',
        message: 'A new login occurred',
        isRead: false,
      });

      const res = await request(app)
        .put(`/api/notifications/${notif._id}/read`)
        .set('Cookie', `token=${testToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isRead).toBe(true);

      const dbNotif = await Notification.findById(notif._id);
      expect(dbNotif.isRead).toBe(true);
    });
  });

  // ── TEST 3: PUT /api/notifications/read-all ──────────────────
  describe('PUT /api/notifications/read-all', () => {
    it('should mark all notifications for the user as read', async () => {
      await Notification.create([
        { userId: testUser._id, type: 'welcome', title: 'Welcome', message: 'Hi', isRead: false },
        { userId: testUser._id, type: 'login_alert', title: 'Login', message: 'Hi', isRead: false },
      ]);

      const res = await request(app)
        .put('/api/notifications/read-all')
        .set('Cookie', `token=${testToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('All notifications marked as read');

      const unreadCount = await Notification.countDocuments({ userId: testUser._id, isRead: false });
      expect(unreadCount).toBe(0);
    });
  });

  // ── TEST 4: DELETE /api/notifications/:id ─────────────────────
  describe('DELETE /api/notifications/:id', () => {
    it('should delete a specific notification from the database', async () => {
      const notif = await Notification.create({
        userId: testUser._id,
        type: 'welcome',
        title: 'Deletable notification',
        message: 'Delete me',
      });

      const res = await request(app)
        .delete(`/api/notifications/${notif._id}`)
        .set('Cookie', `token=${testToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Notification deleted successfully');

      const dbNotif = await Notification.findById(notif._id);
      expect(dbNotif).toBeNull();
    });
  });

  // ── TEST 5: GET /api/notifications/email-settings ────────────
  describe('GET /api/notifications/email-settings', () => {
    it('should retrieve email settings options', async () => {
      const res = await request(app)
        .get('/api/notifications/email-settings')
        .set('Cookie', `token=${testToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.weeklyReport).toBe(true);
      expect(res.body.data.urlCreated).toBe(false);
      expect(res.body.data.milestoneValues).toEqual([10, 50, 100]);
    });
  });

  // ── TEST 6: PUT /api/notifications/email-settings ────────────
  describe('PUT /api/notifications/email-settings', () => {
    it('should update email settings toggles', async () => {
      const payload = {
        weeklyReport: false,
        urlCreated: true,
        milestoneValues: [100, 500],
      };

      const res = await request(app)
        .put('/api/notifications/email-settings')
        .set('Cookie', `token=${testToken}`)
        .send(payload)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.weeklyReport).toBe(false);
      expect(res.body.data.urlCreated).toBe(true);
      expect(res.body.data.milestoneValues).toEqual([100, 500]);
    });
  });
});
