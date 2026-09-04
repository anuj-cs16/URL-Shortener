import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTeam } from '../hooks/useTeam';

export const TeamAnalyticsPage = () => {
  const { teamId } = useParams();
  const { analytics, fetchAnalytics, isLoading } = useTeam(teamId);

  useEffect(() => {
    if (teamId) {
      fetchAnalytics();
    }
  }, [teamId, fetchAnalytics]);

  if (isLoading && !analytics) {
    return <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>Loading team analytics...</div>;
  }

  const { totalUrls = 0, totalClicks = 0, topUrls = [], memberContributions = [] } = analytics || {};

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 20px', color: '#f8fafc' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>Team Workspace Analytics 📊</h1>
      <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
        Aggregated click metrics and member performance breakdown across all team URLs.
      </p>

      {/* METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '20px' }}>
          <div style={{ color: '#94a3b8', fontSize: '13px' }}>Total Team Links</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#6C63FF', marginTop: '4px' }}>{totalUrls}</div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '20px' }}>
          <div style={{ color: '#94a3b8', fontSize: '13px' }}>Total Team Clicks</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#3ECFCF', marginTop: '4px' }}>{totalClicks}</div>
        </div>
      </div>

      {/* TOP PERFORMING URLS */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Top Performing Team URLs</h3>
        {topUrls.length === 0 ? (
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>No click data recorded yet.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                <th style={{ padding: '10px' }}>Short Link</th>
                <th style={{ padding: '10px' }}>Destination</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {topUrls.map((u, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '10px', fontWeight: 'bold', color: '#6C63FF' }}>{u.shortCode}</td>
                  <td style={{ padding: '10px', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                    {u.longUrl}
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold' }}>{u.clicks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MEMBER CONTRIBUTION BREAKDOWN */}
      <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Member Contribution Breakdown</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
              <th style={{ padding: '10px' }}>Member</th>
              <th style={{ padding: '10px' }}>Links Shortened</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Total Clicks Received</th>
            </tr>
          </thead>
          <tbody>
            {memberContributions.map((m, i) => (
              <tr key={i} style={{ borderBottom: '1px solid #334155' }}>
                <td style={{ padding: '10px', fontWeight: '500' }}>
                  {m.name} <span style={{ fontSize: '12px', color: '#94a3b8' }}>({m.email})</span>
                </td>
                <td style={{ padding: '10px' }}>{m.urlCount}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 'bold', color: '#3ECFCF' }}>
                  {m.clicks}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TeamAnalyticsPage;
