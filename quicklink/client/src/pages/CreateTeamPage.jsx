import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTeamContext } from '../context/TeamContext';
import * as teamApi from '../api/teamApi';

export const CreateTeamPage = () => {
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext) || {};
  const { switchTeam } = useTeamContext();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isBusinessPlan = user && user.planId === 'business';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    setError(null);

    try {
      const res = await teamApi.createTeam(name, description);
      if (res.success && res.data?.team) {
        if (refreshUser) await refreshUser();
        await switchTeam(res.data.team.id);
        navigate(`/teams/${res.data.team.id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create team');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '0 20px', color: '#f8fafc' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px' }}>Create Your Team Workspace 🏢</h1>
        <p style={{ color: '#94a3b8', fontSize: '15px' }}>
          Collaborate with your organization, manage team URLs, and assign custom roles.
        </p>
      </div>

      {!isBusinessPlan ? (
        <div
          style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid #6C63FF40',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚀</div>
          <h2 style={{ fontSize: '20px', margin: '0 0 12px 0' }}>Business Plan Required</h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
            Team Workspaces are available exclusively on our Business Plan. Upgrade today to unlock team collaboration, custom roles, and unlimited URLs.
          </p>
          <button
            onClick={() => navigate('/pricing')}
            style={{
              background: 'linear-gradient(135deg, #6C63FF 0%, #3ECFCF 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Upgrade to Business Plan
          </button>
        </div>
      ) : (
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '32px' }}>
          {error && (
            <div style={{ background: '#ef444420', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#94a3b8' }}>
                Team Name
              </label>
              <input
                type="text"
                placeholder="e.g. Acme Marketing Team"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={50}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '15px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#94a3b8' }}>
                Description (Optional)
              </label>
              <textarea
                placeholder="What will this team workspace be used for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f8fafc',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #6C63FF 0%, #3ECFCF 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'Creating Workspace...' : 'Create Team Workspace'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default CreateTeamPage;
