/**
 * @file       TeamContext.js
 * @description React Context for Team Workspace state & RBAC permission checks.
 * @module     context/TeamContext
 */

import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import * as teamApi from '../api/teamApi';
import { ROLE_PERMISSIONS } from '../config/roles';

export const TeamContext = createContext(null);

export const TeamProvider = ({ children }) => {
  const { user, refreshUser } = useContext(AuthContext) || {};
  const [activeTeam, setActiveTeam] = useState(null);
  const [teams, setTeams] = useState([]);
  const [userRole, setUserRole] = useState('viewer');
  const [permissions, setPermissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const syncTeamState = useCallback((activeTeamData, teamList = []) => {
    setTeams(teamList);
    if (activeTeamData) {
      setActiveTeam(activeTeamData);
      const role = activeTeamData.role || activeTeamData.yourRole || 'viewer';
      setUserRole(role);
      setPermissions(ROLE_PERMISSIONS[role] || []);
    } else {
      setActiveTeam(null);
      setUserRole('viewer');
      setPermissions([]);
    }
  }, []);

  useEffect(() => {
    if (user && user.teams) {
      setTeams(user.teams);
      if (user.activeTeam) {
        setActiveTeam(user.activeTeam);
        const role = user.activeTeam.role || 'viewer';
        setUserRole(role);
        setPermissions(ROLE_PERMISSIONS[role] || []);
      } else if (user.teams.length > 0) {
        setActiveTeam(user.teams[0]);
        const role = user.teams[0].role || 'viewer';
        setUserRole(role);
        setPermissions(ROLE_PERMISSIONS[role] || []);
      } else {
        setActiveTeam(null);
        setUserRole('viewer');
        setPermissions([]);
      }
    } else {
      setTeams([]);
      setActiveTeam(null);
      setUserRole('viewer');
      setPermissions([]);
    }
  }, [user]);

  const switchTeam = async (teamId) => {
    setIsLoading(true);
    try {
      const response = await teamApi.switchActiveTeam(teamId);
      if (response.success && response.data?.activeTeam) {
        setActiveTeam(response.data.activeTeam);
        if (refreshUser) await refreshUser();
      }
      return response;
    } catch (err) {
      console.error('Failed to switch active team:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const hasPermission = (permission) => {
    if (!userRole) return false;
    const perms = ROLE_PERMISSIONS[userRole] || [];
    return perms.includes(permission);
  };

  const isOwner = () => userRole === 'owner';
  const isAdmin = () => userRole === 'admin' || userRole === 'owner';

  return (
    <TeamContext.Provider
      value={{
        activeTeam,
        teams,
        userRole,
        permissions,
        isLoading,
        setActiveTeam,
        switchTeam,
        syncTeamState,
        hasPermission,
        isOwner,
        isAdmin,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};

export const useTeamContext = () => {
  const context = useContext(TeamContext);
  if (!context) {
    throw new Error('useTeamContext must be used within a TeamProvider');
  }
  return context;
};
