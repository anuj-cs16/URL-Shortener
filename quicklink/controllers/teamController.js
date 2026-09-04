/**
 * @file       teamController.js
 * @description Controllers managing Team Workspaces, Members, Invites, URLs, Collections, Analytics & Audit Logs.
 * @module     controllers/teamController
 */

'use strict';

const crypto = require('crypto');
const Team = require('../models/Team');
const TeamInvite = require('../models/TeamInvite');
const TeamUrl = require('../models/TeamUrl');
const UrlCollection = require('../models/UrlCollection');
const AuditLog = require('../models/AuditLog');
const Url = require('../models/Url');
const Click = require('../models/Click');
const User = require('../models/User');
const { logAudit } = require('../middleware/teamAuth');
const emailService = require('../utils/emailService');

// Helper to generate 12-character unique invite code
function generateInviteCode() {
  return crypto.randomBytes(6).toString('hex');
}

/**
 * 1. Create Team Workspace
 */
exports.createTeam = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Team name is required' });
    }

    // Check if user already owns a team
    const existingOwnedTeam = await Team.findOne({ ownerId: req.user._id, isActive: true });
    if (existingOwnedTeam) {
      return res.status(400).json({
        success: false,
        message: 'Business plan limit: You already own a team workspace.',
      });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);

    const team = await Team.create({
      name,
      description: description || '',
      slug,
      ownerId: req.user._id,
      members: [{
        userId: req.user._id,
        role: 'owner',
        joinedAt: new Date(),
      }],
      stats: {
        totalUrls: 0,
        totalClicks: 0,
        totalMembers: 1,
      },
    });

    // Update user references
    if (!req.user.teamIds.includes(team._id)) {
      req.user.teamIds.push(team._id);
    }
    req.user.activeTeamId = team._id;
    await req.user.save();

    // Audit log
    await logAudit({
      teamId: team._id,
      userId: req.user._id,
      action: 'team_created',
      resourceType: 'team',
      resourceId: team._id,
      details: { name: team.name, slug: team.slug },
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: {
        team: {
          id: team._id,
          name: team.name,
          slug: team.slug,
          description: team.description,
          members: 1,
          createdAt: team.createdAt,
        },
      },
      message: 'Team created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Get Team Details & Members
 */
exports.getTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.team._id).populate('members.userId', 'name email role lastLoginAt');
    if (!team) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    const members = team.members.map((m) => {
      const u = m.userId || {};
      return {
        userId: u._id || m.userId,
        name: u.name || 'Member',
        email: u.email || '',
        avatar: u.email ? `https://www.gravatar.com/avatar/${crypto.createHash('md5').update(u.email.toLowerCase().trim()).digest('hex')}?d=mp` : null,
        role: m.role,
        joinedAt: m.joinedAt,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        team: {
          id: team._id,
          name: team.name,
          slug: team.slug,
          description: team.description,
          logo: team.logo,
          settings: team.settings,
          stats: team.stats,
          createdAt: team.createdAt,
          ownerId: team.ownerId,
        },
        members,
        yourRole: req.teamRole,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Update Team Settings
 */
exports.updateTeam = async (req, res, next) => {
  try {
    const { name, description, settings, logo } = req.body;
    const team = req.team;

    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    if (logo !== undefined) team.logo = logo;
    if (settings) {
      team.settings = { ...team.settings.toObject(), ...settings };
    }

    await team.save();

    await logAudit({
      teamId: team._id,
      userId: req.user._id,
      action: 'settings_changed',
      resourceType: 'settings',
      resourceId: team._id,
      details: { name: team.name, settings: team.settings },
      ipAddress: req.ip || 'unknown',
    });

    res.status(200).json({
      success: true,
      data: { team },
      message: 'Team updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. Invite Team Member
 */
exports.inviteMember = async (req, res, next) => {
  try {
    const { email, role } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid email is required' });
    }

    const assignedRole = role && ['admin', 'editor', 'viewer'].includes(role) ? role : 'viewer';

    // Check if user is already a member
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser && req.team.isMember(existingUser._id)) {
      return res.status(400).json({ success: false, message: 'User is already a member of this team' });
    }

    // Check if invite is already pending
    const existingInvite = await TeamInvite.findOne({ teamId: req.team._id, email: email.toLowerCase().trim(), status: 'pending' });
    if (existingInvite && !existingInvite.isExpired()) {
      return res.status(400).json({ success: false, message: 'An active invitation has already been sent to this email' });
    }

    const inviteCode = generateInviteCode();
    const invite = await TeamInvite.create({
      teamId: req.team._id,
      email: email.toLowerCase().trim(),
      role: assignedRole,
      inviteCode,
      invitedBy: req.user._id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Send Email
    try {
      if (emailService.sendTeamInviteEmail) {
        await emailService.sendTeamInviteEmail({ email, inviteCode }, req.team, req.user);
      }
    } catch (e) {
      console.error(`Invite email send error: ${e.message}`);
    }

    await logAudit({
      teamId: req.team._id,
      userId: req.user._id,
      action: 'member_invited',
      resourceType: 'member',
      resourceId: invite._id,
      details: { email: invite.email, role: invite.role },
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: {
        invite: {
          id: invite._id,
          email: invite.email,
          role: invite.role,
          inviteCode: invite.inviteCode,
          status: invite.status,
          expiresAt: invite.expiresAt,
        },
      },
      message: 'Invitation sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. Accept Invitation
 */
exports.acceptInvite = async (req, res, next) => {
  try {
    const { inviteCode } = req.params;

    const invite = await TeamInvite.findOne({ inviteCode });
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invalid invitation code' });
    }

    if (!invite.isPending()) {
      return res.status(400).json({ success: false, message: 'Invitation is expired or no longer valid' });
    }

    if (invite.email.toLowerCase().trim() !== req.user.email.toLowerCase().trim()) {
      return res.status(403).json({
        success: false,
        message: 'This invitation was issued for a different email address',
      });
    }

    const team = await Team.findById(invite.teamId);
    if (!team || !team.isActive) {
      return res.status(404).json({ success: false, message: 'Team no longer exists' });
    }

    // Add member to team
    if (!team.isMember(req.user._id)) {
      await team.addMember(req.user._id, invite.role, invite.invitedBy);
    }

    // Mark invite accepted
    invite.status = 'accepted';
    invite.acceptedAt = new Date();
    await invite.save();

    // Update user team lists
    if (!req.user.teamIds.includes(team._id)) {
      req.user.teamIds.push(team._id);
    }
    req.user.activeTeamId = team._id;
    await req.user.save();

    await logAudit({
      teamId: team._id,
      userId: req.user._id,
      action: 'member_joined',
      resourceType: 'member',
      resourceId: req.user._id,
      details: { role: invite.role, email: req.user.email },
      ipAddress: req.ip || 'unknown',
    });

    // Send Welcome Email
    try {
      if (emailService.sendTeamWelcomeEmail) {
        await emailService.sendTeamWelcomeEmail(req.user, team);
      }
    } catch (e) {
      console.error(`Welcome email send error: ${e.message}`);
    }

    res.status(200).json({
      success: true,
      data: {
        team: { id: team._id, name: team.name, slug: team.slug },
        role: invite.role,
      },
      message: 'You have joined the team!',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 6. Revoke Invite
 */
exports.revokeInvite = async (req, res, next) => {
  try {
    const invite = await TeamInvite.findOne({ _id: req.params.inviteId, teamId: req.team._id });
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invite not found' });
    }

    invite.status = 'revoked';
    await invite.save();

    res.status(200).json({ success: true, message: 'Invitation revoked successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * 7. Get Pending Invites
 */
exports.getPendingInvites = async (req, res, next) => {
  try {
    const invites = await TeamInvite.find({
      teamId: req.team._id,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { invites },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 8. Remove Member
 */
exports.removeMember = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const team = req.team;

    if (team.ownerId.toString() === targetUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot remove team owner' });
    }

    if (req.user._id.toString() === targetUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Use leave team endpoint to leave team' });
    }

    await team.removeMember(targetUserId);

    // Update target user
    const targetUser = await User.findById(targetUserId);
    if (targetUser) {
      targetUser.teamIds = targetUser.teamIds.filter((id) => id.toString() !== team._id.toString());
      if (targetUser.activeTeamId && targetUser.activeTeamId.toString() === team._id.toString()) {
        targetUser.activeTeamId = targetUser.teamIds.length > 0 ? targetUser.teamIds[0] : null;
      }
      await targetUser.save();

      try {
        if (emailService.sendTeamRemovedEmail) {
          await emailService.sendTeamRemovedEmail(targetUser, team);
        }
      } catch (e) {
        console.error(`Removed email send error: ${e.message}`);
      }
    }

    await logAudit({
      teamId: team._id,
      userId: req.user._id,
      action: 'member_removed',
      resourceType: 'member',
      resourceId: targetUserId,
      details: { removedUser: targetUserId },
      ipAddress: req.ip || 'unknown',
    });

    res.status(200).json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * 9. Change Member Role
 */
exports.changeMemberRole = async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const { newRole } = req.body;

    if (!['admin', 'editor', 'viewer'].includes(newRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role provided' });
    }

    const team = req.team;
    if (team.ownerId.toString() === targetUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot change owner role' });
    }

    const oldRole = team.getMemberRole(targetUserId);
    await team.changeMemberRole(targetUserId, newRole);

    const targetUser = await User.findById(targetUserId);
    if (targetUser && emailService.sendTeamRoleChangedEmail) {
      try {
        await emailService.sendTeamRoleChangedEmail(targetUser, team, oldRole, newRole);
      } catch (e) {
        console.error(`Role change email error: ${e.message}`);
      }
    }

    await logAudit({
      teamId: team._id,
      userId: req.user._id,
      action: 'member_role_changed',
      resourceType: 'member',
      resourceId: targetUserId,
      details: { oldRole, newRole },
      ipAddress: req.ip || 'unknown',
    });

    res.status(200).json({
      success: true,
      message: 'Member role updated successfully',
      data: { userId: targetUserId, newRole },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 10. Leave Team
 */
exports.leaveTeam = async (req, res, next) => {
  try {
    const team = req.team;
    if (team.ownerId.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Owner cannot leave team. Transfer ownership first.',
      });
    }

    await team.removeMember(req.user._id);

    req.user.teamIds = req.user.teamIds.filter((id) => id.toString() !== team._id.toString());
    if (req.user.activeTeamId && req.user.activeTeamId.toString() === team._id.toString()) {
      req.user.activeTeamId = req.user.teamIds.length > 0 ? req.user.teamIds[0] : null;
    }
    await req.user.save();

    await logAudit({
      teamId: team._id,
      userId: req.user._id,
      action: 'member_removed',
      resourceType: 'member',
      resourceId: req.user._id,
      details: { self: true },
      ipAddress: req.ip || 'unknown',
    });

    res.status(200).json({ success: true, message: 'You have left the team' });
  } catch (error) {
    next(error);
  }
};

/**
 * 11. Transfer Ownership
 */
exports.transferOwnership = async (req, res, next) => {
  try {
    const { newOwnerId } = req.body;
    const team = req.team;

    if (!team.isMember(newOwnerId)) {
      return res.status(400).json({ success: false, message: 'Target user is not a team member' });
    }

    const currentOwnerId = team.ownerId;
    team.ownerId = newOwnerId;

    // Change current owner to admin & new owner to owner
    const currentMember = team.members.find((m) => m.userId.toString() === currentOwnerId.toString());
    if (currentMember) currentMember.role = 'admin';

    const newOwnerMember = team.members.find((m) => m.userId.toString() === newOwnerId.toString());
    if (newOwnerMember) newOwnerMember.role = 'owner';

    await team.save();

    await logAudit({
      teamId: team._id,
      userId: req.user._id,
      action: 'transfer_ownership',
      resourceType: 'team',
      resourceId: team._id,
      details: { previousOwner: currentOwnerId, newOwner: newOwnerId },
      ipAddress: req.ip || 'unknown',
    });

    res.status(200).json({ success: true, message: 'Team ownership transferred successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * 12. Get Team URLs
 */
exports.getTeamUrls = async (req, res, next) => {
  try {
    const { collectionId, tags, createdBy, isPinned, isArchived, search, sort = '-createdAt', page = 1, limit = 10 } = req.query;

    const query = { teamId: req.team._id };
    if (collectionId) query.collectionId = collectionId;
    if (tags) query.tags = { $in: Array.isArray(tags) ? tags : [tags] };
    if (createdBy) query.createdBy = createdBy;
    if (isPinned !== undefined) query.isPinned = isPinned === 'true';
    if (isArchived !== undefined) query.isArchived = isArchived === 'true';

    let teamUrls = await TeamUrl.find(query)
      .populate('urlId')
      .populate('createdBy', 'name email')
      .populate('lastEditedBy', 'name email')
      .populate('collectionId', 'name color icon')
      .sort(sort)
      .lean();

    if (search) {
      const q = search.toLowerCase();
      teamUrls = teamUrls.filter((tu) => {
        const u = tu.urlId || {};
        return (
          (u.longUrl && u.longUrl.toLowerCase().includes(q)) ||
          (u.shortCode && u.shortCode.toLowerCase().includes(q)) ||
          (u.title && u.title.toLowerCase().includes(q)) ||
          (tu.notes && tu.notes.toLowerCase().includes(q))
        );
      });
    }

    const total = teamUrls.length;
    const p = parseInt(page, 10);
    const l = parseInt(limit, 10);
    const paginated = teamUrls.slice((p - 1) * l, p * l);

    res.status(200).json({
      success: true,
      data: {
        urls: paginated,
        total,
        page: p,
        pages: Math.ceil(total / l) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 13. Create Team URL
 */
exports.createTeamUrl = async (req, res, next) => {
  try {
    const { longUrl, customCode, collectionId, tags, notes, title, description } = req.body;

    if (!longUrl) {
      return res.status(400).json({ success: false, message: 'Original URL is required' });
    }

    let shortCode = customCode;
    if (shortCode) {
      const existing = await Url.findOne({ shortCode });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Custom code already taken' });
      }
    } else {
      shortCode = Math.random().toString(36).substring(2, 8);
    }

    // Create Url document
    const urlDoc = await Url.create({
      longUrl,
      shortCode,
      title: title || '',
      description: description || '',
      user: req.user._id,
      isTeamUrl: true,
    });

    const approvalStatus = req.team.settings && req.team.settings.requireApproval ? 'pending' : 'approved';

    const teamUrl = await TeamUrl.create({
      teamId: req.team._id,
      urlId: urlDoc._id,
      createdBy: req.user._id,
      collectionId: collectionId || null,
      tags: tags || [],
      notes: notes || '',
      approvalStatus,
    });

    // Increment stats
    req.team.stats.totalUrls += 1;
    await req.team.save();

    if (collectionId) {
      await UrlCollection.findByIdAndUpdate(collectionId, { $inc: { urlCount: 1 } });
    }

    await logAudit({
      teamId: req.team._id,
      userId: req.user._id,
      action: 'url_created',
      resourceType: 'url',
      resourceId: urlDoc._id,
      details: { shortCode: urlDoc.shortCode, longUrl: urlDoc.longUrl },
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: {
        teamUrl,
        url: urlDoc,
      },
      message: 'Team URL created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 14. Delete Team URL
 */
exports.deleteTeamUrl = async (req, res, next) => {
  try {
    const { urlId } = req.params;
    const teamUrl = await TeamUrl.findOne({ teamId: req.team._id, $or: [{ _id: urlId }, { urlId }] });

    if (!teamUrl) {
      return res.status(404).json({ success: false, message: 'Team URL not found' });
    }

    // Permission check: createdBy OR DELETE_URL permission
    if (teamUrl.createdBy.toString() !== req.user._id.toString() && req.teamRole !== 'owner' && req.teamRole !== 'admin') {
      return res.status(403).json({ success: false, message: 'You cannot delete this team URL' });
    }

    await TeamUrl.deleteOne({ _id: teamUrl._id });
    await Url.deleteOne({ _id: teamUrl.urlId });

    req.team.stats.totalUrls = Math.max(0, req.team.stats.totalUrls - 1);
    await req.team.save();

    if (teamUrl.collectionId) {
      await UrlCollection.findByIdAndUpdate(teamUrl.collectionId, { $inc: { urlCount: -1 } });
    }

    await logAudit({
      teamId: req.team._id,
      userId: req.user._id,
      action: 'url_deleted',
      resourceType: 'url',
      resourceId: teamUrl.urlId,
      details: { teamUrlId: teamUrl._id },
      ipAddress: req.ip || 'unknown',
    });

    res.status(200).json({ success: true, message: 'Team URL deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * 15. Get Collections
 */
exports.getCollections = async (req, res, next) => {
  try {
    const collections = await UrlCollection.find({ teamId: req.team._id }).sort({ order: 1, createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { collections },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 16. Create Collection
 */
exports.createCollection = async (req, res, next) => {
  try {
    const { name, description, color, icon } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Collection name is required' });
    }

    const collection = await UrlCollection.create({
      teamId: req.team._id,
      name: name.trim(),
      description: description || '',
      color: color || '#6C63FF',
      icon: icon || '📁',
      createdBy: req.user._id,
    });

    await logAudit({
      teamId: req.team._id,
      userId: req.user._id,
      action: 'collection_created',
      resourceType: 'collection',
      resourceId: collection._id,
      details: { name: collection.name },
      ipAddress: req.ip || 'unknown',
    });

    res.status(201).json({
      success: true,
      data: { collection },
      message: 'Collection created successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 17. Delete Collection
 */
exports.deleteCollection = async (req, res, next) => {
  try {
    const { id } = req.params;
    const collection = await UrlCollection.findOne({ _id: id, teamId: req.team._id });

    if (!collection) {
      return res.status(404).json({ success: false, message: 'Collection not found' });
    }

    // Clear collection reference from TeamUrls
    await TeamUrl.updateMany({ teamId: req.team._id, collectionId: id }, { $set: { collectionId: null } });

    await UrlCollection.deleteOne({ _id: id });

    await logAudit({
      teamId: req.team._id,
      userId: req.user._id,
      action: 'collection_deleted',
      resourceType: 'collection',
      resourceId: id,
      details: { name: collection.name },
      ipAddress: req.ip || 'unknown',
    });

    res.status(200).json({ success: true, message: 'Collection deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * 18. Get Audit Log
 */
exports.getAuditLog = async (req, res, next) => {
  try {
    const { action, userId, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = { teamId: req.team._id };
    if (action) query.action = action;
    if (userId) query.userId = userId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const p = parseInt(page, 10);
    const l = parseInt(limit, 10);

    const logs = await AuditLog.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean();

    const total = await AuditLog.countDocuments(query);

    const formattedLogs = logs.map((log) => ({
      id: log._id,
      action: log.action,
      user: log.userId ? log.userId.name : 'Unknown User',
      userEmail: log.userId ? log.userId.email : '',
      details: typeof log.details === 'string' ? log.details : JSON.stringify(log.details || {}),
      time: log.createdAt,
      ip: log.ipAddress || 'unknown',
    }));

    res.status(200).json({
      success: true,
      data: {
        logs: formattedLogs,
        total,
        page: p,
        pages: Math.ceil(total / l) || 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 19. Get Team Analytics
 */
exports.getTeamAnalytics = async (req, res, next) => {
  try {
    const teamUrls = await TeamUrl.find({ teamId: req.team._id }).select('urlId createdBy');
    const urlIds = teamUrls.map((tu) => tu.urlId);

    const urls = await Url.find({ _id: { $in: urlIds } }).lean();
    const totalClicks = urls.reduce((acc, u) => acc + (u.clicks || 0), 0);

    // Aggregate top performing URLs
    const topUrls = urls
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0))
      .slice(0, 5)
      .map((u) => ({ shortCode: u.shortCode, longUrl: u.longUrl, clicks: u.clicks || 0 }));

    // Aggregate member contributions
    const memberStats = {};
    teamUrls.forEach((tu) => {
      const creatorId = tu.createdBy.toString();
      if (!memberStats[creatorId]) {
        memberStats[creatorId] = { urlCount: 0, clicks: 0 };
      }
      memberStats[creatorId].urlCount += 1;
      const targetUrl = urls.find((u) => u._id.toString() === tu.urlId.toString());
      if (targetUrl) {
        memberStats[creatorId].clicks += targetUrl.clicks || 0;
      }
    });

    const populatedMemberStats = [];
    for (const [uid, stats] of Object.entries(memberStats)) {
      const userDoc = await User.findById(uid).select('name email');
      populatedMemberStats.push({
        userId: uid,
        name: userDoc ? userDoc.name : 'Unknown User',
        email: userDoc ? userDoc.email : '',
        urlCount: stats.urlCount,
        clicks: stats.clicks,
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalUrls: urls.length,
        totalClicks,
        topUrls,
        memberContributions: populatedMemberStats,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 20. Switch Active Team
 */
exports.switchActiveTeam = async (req, res, next) => {
  try {
    const { teamId } = req.params;
    const team = await Team.findById(teamId);

    if (!team || !team.isActive) {
      return res.status(404).json({ success: false, message: 'Team not found' });
    }

    if (!team.isMember(req.user._id)) {
      return res.status(403).json({ success: false, message: 'You are not a member of this team' });
    }

    req.user.activeTeamId = team._id;
    await req.user.save();

    res.status(200).json({
      success: true,
      message: `Switched active team to ${team.name}`,
      data: {
        activeTeam: {
          id: team._id,
          name: team.name,
          slug: team.slug,
          role: team.getMemberRole(req.user._id),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
