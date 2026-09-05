/**
 * @file       Team.js
 * @description Mongoose schema and model definition for Team Workspaces.
 * @module     models/Team
 */

'use strict';

const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Team name is required'],
    trim: true,
    maxlength: [50, 'Team name max 50 characters'],
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
    maxlength: [200, 'Description max 200 chars'],
  },
  logo: {
    type: String,
    default: null,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'editor', 'viewer'],
      default: 'viewer',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  }],
  settings: {
    defaultUrlExpiry: {
      type: Number,
      default: 365,
    },
    requireApproval: {
      type: Boolean,
      default: false,
    },
    allowCustomCodes: {
      type: Boolean,
      default: true,
    },
    urlPrefix: {
      type: String,
      default: '',
    },
    branding: {
      primaryColor: {
        type: String,
        default: '#6C63FF',
      },
      logoUrl: {
        type: String,
        default: null,
      },
    },
  },
  stats: {
    totalUrls: {
      type: Number,
      default: 0,
    },
    totalClicks: {
      type: Number,
      default: 0,
    },
    totalMembers: {
      type: Number,
      default: 1,
    },
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
teamSchema.index({ ownerId: 1 });
teamSchema.index({ 'members.userId': 1 });

/**
 * Pre-save hook: Generate slug if not provided & update timestamps and member count
 */
teamSchema.pre('save', function () {
  this.updatedAt = new Date();
  if (this.members && Array.isArray(this.members)) {
    this.stats.totalMembers = this.members.length;
  }
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
  }
});

/**
 * Add member to team
 */
teamSchema.methods.addMember = async function (userId, role = 'viewer', invitedBy = null) {
  const exists = this.members.some((m) => m.userId.toString() === userId.toString());
  if (exists) {
    throw new Error('User is already a team member');
  }

  this.members.push({
    userId,
    role,
    joinedAt: new Date(),
    invitedBy,
  });

  this.stats.totalMembers = this.members.length;
  return await this.save();
};

/**
 * Remove member from team
 */
teamSchema.methods.removeMember = async function (userId) {
  if (this.ownerId.toString() === userId.toString()) {
    throw new Error('Cannot remove team owner');
  }

  this.members = this.members.filter((m) => m.userId.toString() !== userId.toString());
  this.stats.totalMembers = this.members.length;
  return await this.save();
};

/**
 * Change member role
 */
teamSchema.methods.changeMemberRole = async function (userId, newRole) {
  if (this.ownerId.toString() === userId.toString()) {
    throw new Error('Cannot change owner role');
  }

  const member = this.members.find((m) => m.userId.toString() === userId.toString());
  if (!member) {
    throw new Error('User is not a member of this team');
  }

  member.role = newRole;
  return await this.save();
};

/**
 * Check if user is a member
 */
teamSchema.methods.isMember = function (userId) {
  if (!userId) return false;
  return this.members.some((m) => m.userId.toString() === userId.toString());
};

/**
 * Get member's role
 */
teamSchema.methods.getMemberRole = function (userId) {
  if (!userId) return null;
  const member = this.members.find((m) => m.userId.toString() === userId.toString());
  return member ? member.role : null;
};

/**
 * Get member count
 */
teamSchema.methods.getMemberCount = function () {
  return this.members ? this.members.length : 0;
};

module.exports = mongoose.model('Team', teamSchema);
