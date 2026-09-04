import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTeamContext } from '../../context/TeamContext';

export const TeamSwitcher = () => {
  const navigate = useNavigate();
  const { activeTeam, teams, switchTeam } = useTeamContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTeam = async (tId) => {
    setIsOpen(false);
    try {
      await switchTeam(tId);
      navigate(`/teams/${tId}`);
    } catch (err) {
      console.error('Failed to switch team:', err);
    }
  };

  if (!teams || teams.length === 0) {
    return (
      <button
        onClick={() => navigate('/teams/create')}
        style={{
          background: 'linear-gradient(135deg, #6C63FF 0%, #3ECFCF 100%)',
          color: '#ffffff',
          border: 'none',
          padding: '6px 14px',
          borderRadius: '6px',
          fontWeight: '600',
          cursor: 'pointer',
          fontSize: '13px',
        }}
      >
        + Create Team
      </button>
    );
  }

  const currentTeamName = activeTeam ? activeTeam.name : 'Personal Workspace';

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#1e293b',
          border: '1px solid #334155',
          color: '#f8fafc',
          padding: '6px 12px',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: '500',
        }}
      >
        <span style={{ fontSize: '16px' }}>🏢</span>
        <span>{currentTeamName}</span>
        <span style={{ fontSize: '10px', color: '#94a3b8' }}>▼</span>
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            left: 0,
            width: '220px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
            zIndex: 1000,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '8px 12px', fontSize: '11px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 'bold' }}>
            Workspaces
          </div>
          {teams.map((t) => (
            <div
              key={t.id || t._id}
              onClick={() => handleSelectTeam(t.id || t._id)}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: (activeTeam && (activeTeam.id === t.id || activeTeam.id === t._id)) ? '#334155' : 'transparent',
                color: '#f8fafc',
                fontSize: '13px',
              }}
            >
              <span style={{ fontWeight: '500' }}>{t.name}</span>
              {t.isOwner && <span style={{ fontSize: '10px', background: '#FFD70020', color: '#FFD700', padding: '2px 6px', borderRadius: '4px' }}>Owner</span>}
            </div>
          ))}
          <div style={{ borderTop: '1px solid #334155' }}>
            <div
              onClick={() => {
                setIsOpen(false);
                navigate('/teams/create');
              }}
              style={{
                padding: '10px 12px',
                cursor: 'pointer',
                color: '#3ECFCF',
                fontSize: '13px',
                fontWeight: '600',
              }}
            >
              + Create New Team
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamSwitcher;
