/**
 * @file       useTeam.js
 * @description Custom hook for managing Team Workspace operations and state.
 * @module     hooks/useTeam
 */

import { useState, useCallback, useContext } from 'react';
import { TeamContext } from '../context/TeamContext';
import * as teamApi from '../api/teamApi';

export const useTeam = (teamIdParam = null) => {
  const teamCtx = useContext(TeamContext) || {};
  const [teamDetails, setTeamDetails] = useState(null);
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [teamUrls, setTeamUrls] = useState([]);
  const [collections, setCollections] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentTeamId = teamIdParam || (teamCtx.activeTeam ? teamCtx.activeTeam.id || teamCtx.activeTeam._id : null);

  const fetchTeamDetails = useCallback(async (tId = currentTeamId) => {
    if (!tId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await teamApi.getTeam(tId);
      if (res.success && res.data) {
        setTeamDetails(res.data.team);
        setMembers(res.data.members || []);
      }
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentTeamId]);

  const createNewTeam = async (name, description) => {
    setIsLoading(true);
    try {
      const res = await teamApi.createTeam(name, description);
      return res;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const inviteNewMember = async (email, role) => {
    if (!currentTeamId) return;
    try {
      const res = await teamApi.inviteMember(currentTeamId, email, role);
      await fetchPendingInvites();
      return res;
    } catch (err) {
      throw err;
    }
  };

  const fetchPendingInvites = useCallback(async () => {
    if (!currentTeamId) return;
    try {
      const res = await teamApi.getPendingInvites(currentTeamId);
      if (res.success && res.data) {
        setInvites(res.data.invites || []);
      }
    } catch (err) {
      console.error('Error fetching invites:', err);
    }
  }, [currentTeamId]);

  const removeTeamMember = async (userId) => {
    if (!currentTeamId) return;
    try {
      const res = await teamApi.removeMember(currentTeamId, userId);
      await fetchTeamDetails(currentTeamId);
      return res;
    } catch (err) {
      throw err;
    }
  };

  const changeRole = async (userId, role) => {
    if (!currentTeamId) return;
    try {
      const res = await teamApi.changeMemberRole(currentTeamId, userId, role);
      await fetchTeamDetails(currentTeamId);
      return res;
    } catch (err) {
      throw err;
    }
  };

  const leaveCurrentTeam = async () => {
    if (!currentTeamId) return;
    try {
      const res = await teamApi.leaveTeam(currentTeamId);
      return res;
    } catch (err) {
      throw err;
    }
  };

  const fetchTeamUrls = useCallback(async (filters = {}) => {
    if (!currentTeamId) return;
    setIsLoading(true);
    try {
      const res = await teamApi.getTeamUrls(currentTeamId, filters);
      if (res.success && res.data) {
        setTeamUrls(res.data.urls || []);
      }
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentTeamId]);

  const createNewTeamUrl = async (urlData) => {
    if (!currentTeamId) return;
    try {
      const res = await teamApi.createTeamUrl(currentTeamId, urlData);
      await fetchTeamUrls();
      return res;
    } catch (err) {
      throw err;
    }
  };

  const deleteUrl = async (urlId) => {
    if (!currentTeamId) return;
    try {
      const res = await teamApi.deleteTeamUrl(currentTeamId, urlId);
      await fetchTeamUrls();
      return res;
    } catch (err) {
      throw err;
    }
  };

  const fetchCollections = useCallback(async () => {
    if (!currentTeamId) return;
    try {
      const res = await teamApi.getCollections(currentTeamId);
      if (res.success && res.data) {
        setCollections(res.data.collections || []);
      }
      return res.data;
    } catch (err) {
      console.error('Error fetching collections:', err);
    }
  }, [currentTeamId]);

  const createNewUrlCollection = async (data) => {
    if (!currentTeamId) return;
    try {
      const res = await teamApi.createCollection(currentTeamId, data);
      await fetchCollections();
      return res;
    } catch (err) {
      throw err;
    }
  };

  const deleteUrlCollection = async (id) => {
    if (!currentTeamId) return;
    try {
      const res = await teamApi.deleteCollection(currentTeamId, id);
      await fetchCollections();
      return res;
    } catch (err) {
      throw err;
    }
  };

  const fetchAuditLogs = useCallback(async (filters = {}) => {
    if (!currentTeamId) return;
    setIsLoading(true);
    try {
      const res = await teamApi.getAuditLog(currentTeamId, filters);
      if (res.success && res.data) {
        setAuditLogs(res.data.logs || []);
      }
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentTeamId]);

  const fetchAnalytics = useCallback(async () => {
    if (!currentTeamId) return;
    setIsLoading(true);
    try {
      const res = await teamApi.getTeamAnalytics(currentTeamId);
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentTeamId]);

  return {
    teamDetails,
    members,
    invites,
    teamUrls,
    collections,
    auditLogs,
    analytics,
    isLoading,
    error,
    currentTeamId,
    activeTeam: teamCtx.activeTeam,
    teams: teamCtx.teams || [],
    hasTeam: (teamCtx.teams || []).length > 0,
    userRole: teamCtx.userRole || 'viewer',
    isOwner: teamCtx.isOwner ? teamCtx.isOwner() : false,
    isAdmin: teamCtx.isAdmin ? teamCtx.isAdmin() : false,
    fetchTeamDetails,
    createNewTeam,
    inviteNewMember,
    fetchPendingInvites,
    removeTeamMember,
    changeRole,
    leaveCurrentTeam,
    fetchTeamUrls,
    createNewTeamUrl,
    deleteUrl,
    fetchCollections,
    createNewUrlCollection,
    deleteUrlCollection,
    fetchAuditLogs,
    fetchAnalytics,
    switchTeam: teamCtx.switchTeam,
  };
};
