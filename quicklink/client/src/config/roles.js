/**
 * @file       roles.js
 * @description Frontend definition of team roles, granular permissions, and helpers.
 * @module     config/roles
 */

export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
};

export const PERMISSIONS = {
  CREATE_URL: 'create_url',
  EDIT_URL: 'edit_url',
  DELETE_URL: 'delete_url',
  VIEW_URLS: 'view_urls',
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_ANALYTICS: 'export_analytics',
  INVITE_MEMBER: 'invite_member',
  REMOVE_MEMBER: 'remove_member',
  CHANGE_ROLE: 'change_role',
  MANAGE_SETTINGS: 'manage_settings',
  VIEW_BILLING: 'view_billing',
  MANAGE_BILLING: 'manage_billing',
  MANAGE_DOMAIN: 'manage_domain',
  DELETE_TEAM: 'delete_team',
  TRANSFER_OWNERSHIP: 'transfer_ownership',
};

export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: Object.values(PERMISSIONS),
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

export function hasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function getRoleLabel(role) {
  const labels = {
    owner: 'Owner',
    admin: 'Admin',
    editor: 'Editor',
    viewer: 'Viewer',
  };
  return labels[role] || role;
}

export function getRoleColor(role) {
  const colors = {
    owner: '#FFD700',
    admin: '#6C63FF',
    editor: '#3ECFCF',
    viewer: '#A0A0B0',
  };
  return colors[role] || '#A0A0B0';
}
