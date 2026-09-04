/**
 * @file       teamApi.js
 * @description API module for Team Workspace operations.
 * @module     api/teamApi
 */

import axiosInstance from './axiosConfig';

export const createTeam = async (name, description) => {
  const response = await axiosInstance.post('/api/teams', { name, description });
  return response.data;
};

export const getTeam = async (teamId) => {
  const response = await axiosInstance.get(`/api/teams/${teamId}`);
  return response.data;
};

export const updateTeam = async (teamId, data) => {
  const response = await axiosInstance.put(`/api/teams/${teamId}`, data);
  return response.data;
};

export const inviteMember = async (teamId, email, role) => {
  const response = await axiosInstance.post(`/api/teams/${teamId}/invite`, { email, role });
  return response.data;
};

export const acceptInvite = async (inviteCode) => {
  const response = await axiosInstance.post(`/api/teams/invite/${inviteCode}/accept`);
  return response.data;
};

export const revokeInvite = async (teamId, inviteId) => {
  const response = await axiosInstance.delete(`/api/teams/${teamId}/invite/${inviteId}`);
  return response.data;
};

export const getPendingInvites = async (teamId) => {
  const response = await axiosInstance.get(`/api/teams/${teamId}/invites`);
  return response.data;
};

export const removeMember = async (teamId, userId) => {
  const response = await axiosInstance.delete(`/api/teams/${teamId}/members/${userId}`);
  return response.data;
};

export const changeMemberRole = async (teamId, userId, role) => {
  const response = await axiosInstance.put(`/api/teams/${teamId}/members/${userId}/role`, { newRole: role });
  return response.data;
};

export const leaveTeam = async (teamId) => {
  const response = await axiosInstance.post(`/api/teams/${teamId}/leave`);
  return response.data;
};

export const transferOwnership = async (teamId, newOwnerId) => {
  const response = await axiosInstance.post(`/api/teams/${teamId}/transfer`, { newOwnerId });
  return response.data;
};

export const getTeamUrls = async (teamId, filters = {}) => {
  const response = await axiosInstance.get(`/api/teams/${teamId}/urls`, { params: filters });
  return response.data;
};

export const createTeamUrl = async (teamId, urlData) => {
  const response = await axiosInstance.post(`/api/teams/${teamId}/urls`, urlData);
  return response.data;
};

export const deleteTeamUrl = async (teamId, urlId) => {
  const response = await axiosInstance.delete(`/api/teams/${teamId}/urls/${urlId}`);
  return response.data;
};

export const getCollections = async (teamId) => {
  const response = await axiosInstance.get(`/api/teams/${teamId}/collections`);
  return response.data;
};

export const createCollection = async (teamId, data) => {
  const response = await axiosInstance.post(`/api/teams/${teamId}/collections`, data);
  return response.data;
};

export const deleteCollection = async (teamId, collectionId) => {
  const response = await axiosInstance.delete(`/api/teams/${teamId}/collections/${collectionId}`);
  return response.data;
};

export const getTeamAnalytics = async (teamId) => {
  const response = await axiosInstance.get(`/api/teams/${teamId}/analytics`);
  return response.data;
};

export const getAuditLog = async (teamId, filters = {}) => {
  const response = await axiosInstance.get(`/api/teams/${teamId}/audit-log`, { params: filters });
  return response.data;
};

export const switchActiveTeam = async (teamId) => {
  const response = await axiosInstance.put(`/api/teams/switch/${teamId}`);
  return response.data;
};
