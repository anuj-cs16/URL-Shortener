/**
 * @file       roles.js
 * @description Defines team roles, granular permissions, and role-permission mappings.
 * @module     config/roles
 */

'use strict';

const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

const PERMISSIONS = {
  // URL Permissions
  CREATE_URL: 'create_url',
  EDIT_URL: 'edit_url',
  DELETE_URL: 'delete_url',
  VIEW_URLS: 'view_urls',

  // Analytics Permissions
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_ANALYTICS: 'export_analytics',

  // Team Permissions
  INVITE_MEMBER: 'invite_member',
  REMOVE_MEMBER: 'remove_member',
  CHANGE_ROLE: 'change_role',
  MANAGE_SETTINGS: 'manage_settings',

  // Billing Permissions
  VIEW_BILLING: 'view_billing',
  MANAGE_BILLING: 'manage_billing',

  // Domain Permissions
  MANAGE_DOMAIN: 'manage_domain',

  // Admin Permissions
  DELETE_TEAM: 'delete_team',
  TRANSFER_OWNERSHIP: 'transfer_ownership',
};

const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: [
    ...Object.values(PERMISSIONS),
  ],

  [ROLES.ADMIN]: [
    PERMISSIONS.CREATE_URL,
    PERMISSIONS.EDIT_URL,
    PERMISSIONS.DELETE_URL,
    PERMISSIONS.VIEW_URLS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_ANALYTICS,
    PERMISSIONS.INVITE_MEMBER,
    PERMISSIONS.REMOVE_MEMBER,
    PERMISSIONS.CHANGE_ROLE,
    PERMISSIONS.MANAGE_SETTINGS,
    PERMISSIONS.VIEW_BILLING,
    PERMISSIONS.MANAGE_DOMAIN,
  ],

  [ROLES.EDITOR]: [
    PERMISSIONS.CREATE_URL,
    PERMISSIONS.EDIT_URL,
    PERMISSIONS.VIEW_URLS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_ANALYTICS,
  ],

  [ROLES.VIEWER]: [
    PERMISSIONS.VIEW_URLS,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
};

function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

function getRoleLabel(role) {
  const labels = {
    owner: 'Owner',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer',
  };
  return labels[role] || role;
}

function getRoleColor(role) {
  const colors = {
    owner: '#FFD700',
    admin: '#6C63FF',
    editor: '#3ECFCF',
    viewer: '#A0A0B0',
  };
  return colors[role] || '#A0A0B0';
}

module.exports = {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  getRolePermissions,
  getRoleLabel,
  getRoleColor,
};
