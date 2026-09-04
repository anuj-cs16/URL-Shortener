import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { useTeamContext } from '../context/TeamContext';
import * as teamApi from '../api/teamApi';

export const AcceptInvitePage = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user, refreshUser } = useContext(AuthContext) || {};
  const { switchTeam } = useTeamContext();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  useEffect(() => {
    const processAccept = async () => {
      if (!user) {
        // If not logged in, prompt user to log in or register
        setLoading(false);
        return;
      }
      try {
        const res = await teamApi.acceptInvite(code);
        if (res.success && res.data?.team) {
          setSuccessMsg(res.message || 'You have successfully joined the team!');
          if (refreshUser) await refreshUser();
          await switchTeam(res.data.team.id);
          setTimeout(() => {
            navigate(`/teams/${res.data.team.id}`);
          }, 1500);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to accept invitation. Code may be invalid or expired.');
      } finally {
        setLoading(false);
      }
    };
    processAccept();
  }, [code, user, navigate, refreshUser, switchTeam]);

  if (!user) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto', padding: '32px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', textAlign: 'center', color: '#f8fafc' }}>
        <h2>Team Invitation Received ✉️</h2>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
          Please log in or register an account with your invited email address to join the workspace.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button onClick={() => navigate('/login')} style={{ padding: '10px 20px', background: '#6C63FF', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Log In
          </button>
          <button onClick={() => navigate('/signup')} style={{ padding: '10px 20px', background: '#334155', color: '#f8fafc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Register
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '480px', margin: '60px auto', padding: '32px', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', textAlign: 'center', color: '#f8fafc' }}>
      {loading && <h3>Accepting Invitation...</h3>}
      {error && (
        <div>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>⚠️</div>
          <h3 style={{ color: '#ef4444' }}>Invitation Error</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>{error}</p>
          <button onClick={() => navigate('/dashboard')} style={{ marginTop: '16px', padding: '10px 20px', background: '#334155', color: '#f8fafc', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
            Go to Dashboard
          </button>
        </div>
      )}
      {successMsg && (
        <div>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🎉</div>
          <h3 style={{ color: '#3ECFCF' }}>{successMsg}</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>Redirecting to team workspace...</p>
        </div>
      )}
    </div>
  );
};

export default AcceptInvitePage;
