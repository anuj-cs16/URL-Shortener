/**
 * @file       teamRoutes.js
 * @description Express routes for Team Workspace operations.
 * @module     routes/teamRoutes
 */

'use strict';

const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');
const { isAuthenticated } = require('../middleware/auth');
const {
  requireTeam,
  requirePermission,
  requireBusinessPlan,
  checkTeamMemberLimit,
} = require('../middleware/teamAuth');
const { PERMISSIONS } = require('../config/roles');

// Apply authentication middleware to all team endpoints
router.use(isAuthenticated);

// --- TEAM MANAGEMENT ROUTES ---
router.post(
  '/',
  requireBusinessPlan,
  teamController.createTeam
);

router.put(
  '/switch/:teamId',
  teamController.switchActiveTeam
);

router.get(
  '/:teamId',
  requireTeam,
  teamController.getTeam
);

router.put(
  '/:teamId',
  requireTeam,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  teamController.updateTeam
);

// --- MEMBER MANAGEMENT & INVITES ---
router.post(
  '/:teamId/invite',
  requireTeam,
  requirePermission(PERMISSIONS.INVITE_MEMBER),
  checkTeamMemberLimit,
  teamController.inviteMember
);

router.get(
  '/:teamId/invites',
  requireTeam,
  requirePermission(PERMISSIONS.INVITE_MEMBER),
  teamController.getPendingInvites
);

router.delete(
  '/:teamId/invite/:inviteId',
  requireTeam,
  requirePermission(PERMISSIONS.INVITE_MEMBER),
  teamController.revokeInvite
);

router.post(
  '/invite/:inviteCode/accept',
  teamController.acceptInvite
);

router.delete(
  '/:teamId/members/:userId',
  requireTeam,
  requirePermission(PERMISSIONS.REMOVE_MEMBER),
  teamController.removeMember
);

router.put(
  '/:teamId/members/:userId/role',
  requireTeam,
  requirePermission(PERMISSIONS.CHANGE_ROLE),
  teamController.changeMemberRole
);

router.post(
  '/:teamId/leave',
  requireTeam,
  teamController.leaveTeam
);

router.post(
  '/:teamId/transfer',
  requireTeam,
  requirePermission(PERMISSIONS.TRANSFER_OWNERSHIP),
  teamController.transferOwnership
);

// --- TEAM URLS ---
router.get(
  '/:teamId/urls',
  requireTeam,
  requirePermission(PERMISSIONS.VIEW_URLS),
  teamController.getTeamUrls
);

router.post(
  '/:teamId/urls',
  requireTeam,
  requirePermission(PERMISSIONS.CREATE_URL),
  teamController.createTeamUrl
);

router.delete(
  '/:teamId/urls/:urlId',
  requireTeam,
  requirePermission(PERMISSIONS.DELETE_URL),
  teamController.deleteTeamUrl
);

// --- URL COLLECTIONS ---
router.get(
  '/:teamId/collections',
  requireTeam,
  requirePermission(PERMISSIONS.VIEW_URLS),
  teamController.getCollections
);

router.post(
  '/:teamId/collections',
  requireTeam,
  requirePermission(PERMISSIONS.CREATE_URL),
  teamController.createCollection
);

router.delete(
  '/:teamId/collections/:id',
  requireTeam,
  requirePermission(PERMISSIONS.DELETE_URL),
  teamController.deleteCollection
);

// --- ANALYTICS & AUDIT LOG ---
router.get(
  '/:teamId/analytics',
  requireTeam,
  requirePermission(PERMISSIONS.VIEW_ANALYTICS),
  teamController.getTeamAnalytics
);

router.get(
  '/:teamId/audit-log',
  requireTeam,
  requirePermission(PERMISSIONS.MANAGE_SETTINGS),
  teamController.getAuditLog
);

module.exports = router;
