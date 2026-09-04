/**
 * @file       teamAuth.js
 * @description Team authorization and RBAC middleware functions.
 * @module     middleware/teamAuth
 */

'use strict';

const Team = require('../models/Team');
const AuditLog = require('../models/AuditLog');
const { hasPermission } = require('../config/roles');

/**
 * Middleware: Require user to be a valid member of specified team.
 */
const requireTeam = async (req, res, next) => {
  try {
    const teamId = req.params.teamId || req.body.teamId || req.query.teamId || req.headers['x-team-id'];

    if (!teamId) {
      return res.status(400).json({
        success: false,
        message: 'Team ID is required',
      });
    }

    const team = await Team.findById(teamId);
    if (!team || !team.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Team not found',
      });
    }

    if (!req.user || !team.isMember(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'You are not a member of this team',
      });
    }

    req.team = team;
    req.teamRole = team.getMemberRole(req.user._id);
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware: Require specific RBAC permission.
 * @param {string} permission
 */
const requirePermission = (permission) => {
  return (req, res, next) => {
    const role = req.teamRole;
    if (!role || !hasPermission(role, permission)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action',
        requiredPermission: permission,
        yourRole: role || 'none',
      });
    }
    next();
  };
};

/**
 * Middleware: Require Business Plan to access team features.
 */
const requireBusinessPlan = (req, res, next) => {
  if (!req.user || req.user.planId !== 'business') {
    return res.status(403).json({
      success: false,
      message: 'Team features require Business plan',
      currentPlan: req.user ? req.user.planId : 'free',
      requiredPlan: 'business',
      upgradeUrl: '/pricing',
    });
  }
  next();
};

/**
 * Middleware: Enforce maximum member limits per team (Business plan limit: 10).
 */
const checkTeamMemberLimit = async (req, res, next) => {
  try {
    const team = req.team || await Team.findById(req.params.teamId);
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const memberCount = team.getMemberCount();
    const limit = 10;

    if (memberCount >= limit) {
      return res.status(403).json({
        success: false,
        message: `Team member limit reached (${memberCount}/${limit})`,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Helper & Middleware: Log team action to audit log asynchronously.
 */
const logAudit = async ({ teamId, userId, action, resourceType = null, resourceId = null, details = {}, ipAddress = 'unknown' }) => {
  try {
    await AuditLog.create({
      teamId,
      userId,
      action,
      resourceType,
      resourceId: resourceId ? resourceId.toString() : null,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error(`[AuditLog Error]: ${err.message}`);
  }
};

const logTeamAction = (actionType, resourceTypeGetter = null) => {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.team && req.user) {
        let resourceType = null;
        let resourceId = null;
        if (typeof resourceTypeGetter === 'function') {
          const resInfo = resourceTypeGetter(req, res);
          resourceType = resInfo.resourceType;
          resourceId = resInfo.resourceId;
        }

        logAudit({
          teamId: req.team._id,
          userId: req.user._id,
          action: actionType,
          resourceType,
          resourceId,
          details: { body: req.body, params: req.params },
          ipAddress: req.ip || req.connection.remoteAddress || 'unknown',
        });
      }
    });
    next();
  };
};

module.exports = {
  requireTeam,
  requirePermission,
  requireBusinessPlan,
  checkTeamMemberLimit,
  logAudit,
  logTeamAction,
};
