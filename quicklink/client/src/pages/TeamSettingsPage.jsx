import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTeam } from '../hooks/useTeam';
import ActivityFeed from '../components/team/ActivityFeed';

export const TeamSettingsPage = () => {
  const { teamId } = useParams();
  const { teamDetails, auditLogs, fetchTeamDetails, fetchAuditLogs } = useTeam(teamId);

  const [activeTab, setActiveTab] = useState('general');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#6C63FF');
  const [logoUrl, setLogoUrl] = useState('');
  const [requireApproval, setRequireApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (teamId) {
      fetchTeamDetails(teamId);
      fetchAuditLogs();
    }
  }, [teamId, fetchTeamDetails, fetchAuditLogs]);

  useEffect(() => {
    if (teamDetails) {
      setName(teamDetails.name || '');
      setDescription(teamDetails.description || '');
      setRequireApproval(teamDetails.settings?.requireApproval || false);
      setPrimaryColor(teamDetails.settings?.branding?.primaryColor || '#6C63FF');
      setLogoUrl(teamDetails.settings?.branding?.logoUrl || '');
    }
  }, [teamDetails]);

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const teamApi = require('../api/teamApi');
      await teamApi.updateTeam(teamId, {
        name,
        description,
        settings: { requireApproval },
      });
      setMessage('Team settings saved successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating team settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBranding = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      const teamApi = require('../api/teamApi');
      await teamApi.updateTeam(teamId, {
        logo: logoUrl,
        settings: { branding: { primaryColor, logoUrl } },
      });
      setMessage('Branding settings saved successfully');
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating branding');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 20px', color: '#f8fafc' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>Team Workspace Settings ⚙️</h1>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid #334155', marginBottom: '24px' }}>
        {['general', 'branding', 'permissions', 'audit'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 18px',
              background: activeTab === tab ? '#334155' : 'transparent',
              color: activeTab === tab ? '#ffffff' : '#94a3b8',
              border: 'none',
              borderBottom: activeTab === tab ? '2px solid #6C63FF' : '2px solid transparent',
              fontWeight: '600',
              cursor: 'pointer',
              textTransform: 'capitalize',
              fontSize: '14px',
            }}
          >
            {tab === 'audit' ? 'Audit Log' : tab}
          </button>
        ))}
      </div>

      {message && (
        <div style={{ background: '#10b98120', border: '1px solid #10b981', color: '#10b981', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
          {message}
        </div>
      )}

      {/* GENERAL TAB */}
      {activeTab === 'general' && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
          <form onSubmit={handleSaveGeneral}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Team Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input type="checkbox" id="approval" checked={requireApproval} onChange={(e) => setRequireApproval(e.target.checked)} />
              <label htmlFor="approval" style={{ fontSize: '14px', cursor: 'pointer' }}>Require Admin Approval for new Team URLs</label>
            </div>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#6C63FF', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save Settings</button>
          </form>
        </div>
      )}

      {/* BRANDING TAB */}
      {activeTab === 'branding' && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
          <form onSubmit={handleSaveBranding}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Team Logo URL</label>
              <input type="url" placeholder="https://example.com/logo.png" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} style={{ width: '100%', padding: '10px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#94a3b8', marginBottom: '6px' }}>Primary Theme Color</label>
              <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} style={{ width: '60px', height: '40px', background: 'none', border: 'none', cursor: 'pointer' }} />
            </div>
            <button type="submit" disabled={loading} style={{ padding: '10px 20px', background: '#6C63FF', color: '#ffffff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>Save Branding</button>
          </form>
        </div>
      )}

      {/* PERMISSIONS MATRIX TAB */}
      {activeTab === 'permissions' && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Role Permission Matrix</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8', textAlign: 'left' }}>
                <th style={{ padding: '10px' }}>Permission</th>
                <th style={{ padding: '10px' }}>Owner</th>
                <th style={{ padding: '10px' }}>Admin</th>
                <th style={{ padding: '10px' }}>Editor</th>
                <th style={{ padding: '10px' }}>Viewer</th>
              </tr>
            </thead>
            <tbody>
              {[
                { perm: 'Create / Shorten URLs', owner: true, admin: true, editor: true, viewer: false },
                { perm: 'Edit & Delete Team URLs', owner: true, admin: true, editor: false, viewer: false },
                { perm: 'View Analytics', owner: true, admin: true, editor: true, viewer: true },
                { perm: 'Invite & Remove Members', owner: true, admin: true, editor: false, viewer: false },
                { perm: 'Manage Team Settings', owner: true, admin: true, editor: false, viewer: false },
                { perm: 'Transfer Ownership / Delete Team', owner: true, admin: false, editor: false, viewer: false },
              ].map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '10px', fontWeight: '500' }}>{row.perm}</td>
                  <td style={{ padding: '10px' }}>{row.owner ? '✅' : '❌'}</td>
                  <td style={{ padding: '10px' }}>{row.admin ? '✅' : '❌'}</td>
                  <td style={{ padding: '10px' }}>{row.editor ? '✅' : '❌'}</td>
                  <td style={{ padding: '10px' }}>{row.viewer ? '✅' : '❌'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* AUDIT LOG TAB */}
      {activeTab === 'audit' && (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Team Action Audit Log</h3>
          <ActivityFeed activities={auditLogs} />
        </div>
      )}
    </div>
  );
};

export default TeamSettingsPage;
