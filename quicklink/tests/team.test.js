/**
 * @file       team.test.js
 * @description Integration and unit tests for Team Workspace System, RBAC, invites, URLs, collections & audit logs.
 */

'use strict';

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Team = require('../models/Team');
const TeamInvite = require('../models/TeamInvite');
const TeamUrl = require('../models/TeamUrl');
const UrlCollection = require('../models/UrlCollection');
const AuditLog = require('../models/AuditLog');
const Url = require('../models/Url');

const TEST_MONGO_URI = 'mongodb://127.0.0.1:27017/quicklink_test';

describe('Team Workspace & Collaboration Suite', () => {
  let businessUser, proUser, freeUser;
  let businessToken, proToken, freeToken;

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
    await User.deleteMany({});
    await Team.deleteMany({});
    await TeamInvite.deleteMany({});
    await TeamUrl.deleteMany({});
    await UrlCollection.deleteMany({});
    await AuditLog.deleteMany({});
    await Url.deleteMany({});

    // Create Business User
    businessUser = await User.create({
      name: 'Business Owner',
      email: 'business@example.com',
      password: 'password123',
      planId: 'business',
    });
    businessToken = businessUser.getJwtToken();

    // Create Pro User
    proUser = await User.create({
      name: 'Pro User',
      email: 'pro@example.com',
      password: 'password123',
      planId: 'pro',
    });
    proToken = proUser.getJwtToken();

    // Create Free User
    freeUser = await User.create({
      name: 'Free User',
      email: 'free@example.com',
      password: 'password123',
      planId: 'free',
    });
    freeToken = freeUser.getJwtToken();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Team.deleteMany({});
    await TeamInvite.deleteMany({});
    await TeamUrl.deleteMany({});
    await UrlCollection.deleteMany({});
    await AuditLog.deleteMany({});
    await Url.deleteMany({});
    await mongoose.connection.close();
  });

  // ── TEST GROUP 1: Team Creation ────────────────────────────
  describe('GROUP 1: Team Creation & Plan Gates', () => {
    it('Should create team for Business plan user', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${businessToken}`)
        .send({ name: 'Marketing Team', description: 'Acme marketing links' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.team.name).toBe('Marketing Team');

      // Verify owner is added as member
      const team = await Team.findById(res.body.data.team.id);
      expect(team.members.length).toBe(1);
      expect(team.members[0].role).toBe('owner');
    });

    it('Should reject team creation for Free user', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${freeToken}`)
        .send({ name: 'Free Team' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Business plan');
    });

    it('Should reject team creation for Pro user', async () => {
      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${proToken}`)
        .send({ name: 'Pro Team' });

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  // ── TEST GROUP 2: Member Management & Invites ─────────────
  describe('GROUP 2: Member Management', () => {
    let team;

    beforeEach(async () => {
      team = await Team.create({
        name: 'Dev Team',
        slug: 'dev-team-1234',
        ownerId: businessUser._id,
        members: [{ userId: businessUser._id, role: 'owner' }],
      });
      businessUser.teamIds = [team._id];
      businessUser.activeTeamId = team._id;
      await businessUser.save();
    });

    it('Should invite a member with valid email', async () => {
      const res = await request(app)
        .post(`/api/teams/${team._id}/invite`)
        .set('Authorization', `Bearer ${businessToken}`)
        .send({ email: 'developer@example.com', role: 'editor' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invite.email).toBe('developer@example.com');
    });

    it('Should accept invitation and add user to team', async () => {
      const invite = await TeamInvite.create({
        teamId: team._id,
        email: freeUser.email,
        role: 'editor',
        inviteCode: 'testcode12345',
        invitedBy: businessUser._id,
      });

    const res = await request(app)
      .post(`/api/teams/invite/${invite.inviteCode}/accept`)
      .set('Authorization', `Bearer ${freeToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedTeam = await Team.findById(team._id);
    expect(updatedTeam.isMember(freeUser._id)).toBe(true);
  });

    it('Should remove a member from team', async () => {
      await team.addMember(proUser._id, 'editor');

      const res = await request(app)
        .delete(`/api/teams/${team._id}/members/${proUser._id}`)
        .set('Authorization', `Bearer ${businessToken}`);

      expect(res.statusCode).toBe(200);
      const updatedTeam = await Team.findById(team._id);
      expect(updatedTeam.isMember(proUser._id)).toBe(false);
    });

    it('Should not allow removing team owner', async () => {
      const res = await request(app)
        .delete(`/api/teams/${team._id}/members/${businessUser._id}`)
        .set('Authorization', `Bearer ${businessToken}`);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('owner');
    });
  });

  // ── TEST GROUP 3: Permissions ──────────────────────────────
  describe('GROUP 3: Role Based Access Control', () => {
    let team, editorUser, viewerUser, editorToken, viewerToken;

    beforeEach(async () => {
      editorUser = await User.create({ name: 'Editor User', email: 'editor@example.com', password: 'password123', planId: 'business' });
      editorToken = editorUser.getJwtToken();

      viewerUser = await User.create({ name: 'Viewer User', email: 'viewer@example.com', password: 'password123', planId: 'business' });
      viewerToken = viewerUser.getJwtToken();

      team = await Team.create({
        name: 'Design Team',
        slug: 'design-team-5678',
        ownerId: businessUser._id,
        members: [
          { userId: businessUser._id, role: 'owner' },
          { userId: editorUser._id, role: 'editor' },
          { userId: viewerUser._id, role: 'viewer' },
        ],
      });
    });

    it('Editor can create URLs in team', async () => {
      const res = await request(app)
        .post(`/api/teams/${team._id}/urls`)
        .set('Authorization', `Bearer ${editorToken}`)
        .send({ longUrl: 'https://example.com/editor-link' });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
    });

    it('Viewer CANNOT create URLs in team', async () => {
      const res = await request(app)
        .post(`/api/teams/${team._id}/urls`)
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ longUrl: 'https://example.com/viewer-link' });

      expect(res.statusCode).toBe(403);
      expect(res.body.message).toContain('permission');
    });

    it('Viewer can view team URLs', async () => {
      const res = await request(app)
        .get(`/api/teams/${team._id}/urls`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ── TEST GROUP 4: Team URLs & Collections ────────────────
  describe('GROUP 4: Team URLs & Collections', () => {
    let team;

    beforeEach(async () => {
      team = await Team.create({
        name: 'Product Team',
        slug: 'prod-team-9999',
        ownerId: businessUser._id,
        members: [{ userId: businessUser._id, role: 'owner' }],
      });
    });

    it('Should create a collection and assign URLs', async () => {
      const colRes = await request(app)
        .post(`/api/teams/${team._id}/collections`)
        .set('Authorization', `Bearer ${businessToken}`)
        .send({ name: 'Sprint 1', color: '#6C63FF' });

      expect(colRes.statusCode).toBe(201);
      const collectionId = colRes.body.data.collection._id;

      const urlRes = await request(app)
        .post(`/api/teams/${team._id}/urls`)
        .set('Authorization', `Bearer ${businessToken}`)
        .send({ longUrl: 'https://example.com/sprint1', collectionId });

      expect(urlRes.statusCode).toBe(201);
      expect(urlRes.body.data.teamUrl.collectionId.toString()).toBe(collectionId.toString());
    });
  });

  // ── TEST GROUP 5: Audit Log ───────────────────────────────
  describe('GROUP 5: Audit Log', () => {
    it('Should log actions to audit log', async () => {
      const teamRes = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${businessToken}`)
        .send({ name: 'Audit Team' });

      const teamId = teamRes.body.data.team.id;

      const logsRes = await request(app)
        .get(`/api/teams/${teamId}/audit-log`)
        .set('Authorization', `Bearer ${businessToken}`);

      expect(logsRes.statusCode).toBe(200);
      expect(logsRes.body.data.logs.length).toBeGreaterThan(0);
      expect(logsRes.body.data.logs[0].action).toBe('team_created');
    });
  });
});
