import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTeam } from '../hooks/useTeam';
import MemberAvatar from '../components/team/MemberAvatar';
import RoleBadge from '../components/team/RoleBadge';
import InviteModal from '../components/team/InviteModal';

export const TeamMembersPage = () => {
  const { teamId } = useParams();
  const {
    members,
    invites,
    userRole,
    fetchTeamDetails,
    fetchPendingInvites,
    removeTeamMember,
    changeRole,
  } = useTeam(teamId);

  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (teamId) {
      fetchTeamDetails(teamId);
      fetchPendingInvites();
    }
  }, [teamId, fetchTeamDetails, fetchPendingInvites]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await changeRole(userId, newRole);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to change role');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (window.confirm('Are you sure you want to remove this member from the team?')) {
      try {
        await removeTeamMember(userId);
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to remove member');
      }
    }
  };

  const canManage = userRole === 'owner' || userRole === 'admin';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px', color: '#f8fafc' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Team Members ({members.length})</h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>
            Manage workspace roles and team access permissions.
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowInviteModal(true)}
            style={{
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #6C63FF 0%, #3ECFCF 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            + Invite Member
          </button>
        )}
      </div>

      {/* MEMBERS TABLE */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
              <th style={{ padding: '12px' }}>Member</th>
              <th style={{ padding: '12px' }}>Role</th>
              <th style={{ padding: '12px' }}>Joined Date</th>
              {canManage && <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const isOwner = m.role === 'owner';
              return (
                <tr key={m.userId} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '12px' }}>
                    <MemberAvatar user={{ name: m.name, email: m.email, avatar: m.avatar }} size={36} />
                    <span style={{ marginLeft: '10px', fontWeight: '500' }}>{m.name}</span>
                    <span style={{ color: '#94a3b8', fontSize: '12px', marginLeft: '6px' }}>({m.email})</span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <RoleBadge role={m.role} />
                  </td>
                  <td style={{ padding: '12px', color: '#94a3b8' }}>
                    {new Date(m.joinedAt).toLocaleDateString()}
                  </td>
                  {canManage && (
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      {!isOwner && (
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <select
                            value={m.role}
                            onChange={(e) => handleRoleChange(m.userId, e.target.value)}
                            style={{ background: '#0f172a', border: '1px solid #334155', color: '#f8fafc', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => handleRemoveMember(m.userId)}
                            style={{ background: '#ef444420', border: '1px solid #ef444440', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PENDING INVITES */}
      {canManage && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Pending Invitations ({invites.length})</h3>
          {invites.length === 0 ? (
            <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>No pending invitations.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {invites.map((inv) => (
                <div key={inv._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#0f172a', borderRadius: '6px', fontSize: '14px' }}>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>{inv.email}</span>
                    <span style={{ marginLeft: '12px', fontSize: '12px', color: '#6C63FF' }}>Role: {inv.role}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Expires: {new Date(inv.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* INVITE MODAL */}
      <InviteModal
        teamId={teamId}
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={fetchPendingInvites}
      />
    </div>
  );
};

export default TeamMembersPage;
