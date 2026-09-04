import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTeam } from '../hooks/useTeam';
import CollectionSidebar from '../components/team/CollectionSidebar';
import ActivityFeed from '../components/team/ActivityFeed';
import RoleBadge from '../components/team/RoleBadge';

export const TeamDashboardPage = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const {
    teamDetails,
    members,
    teamUrls,
    collections,
    auditLogs,
    isLoading,
    userRole,
    fetchTeamDetails,
    fetchTeamUrls,
    fetchCollections,
    fetchAuditLogs,
    createNewTeamUrl,
    createNewUrlCollection,
    deleteUrl,
  } = useTeam(teamId);

  const [activeCollection, setActiveCollection] = useState(null);
  const [search, setSearch] = useState('');
  const [showCreateUrlModal, setShowCreateUrlModal] = useState(false);
  const [longUrl, setLongUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (teamId) {
      fetchTeamDetails(teamId);
      fetchTeamUrls({ collectionId: activeCollection });
      fetchCollections();
      fetchAuditLogs({ limit: 5 });
    }
  }, [teamId, activeCollection, fetchTeamDetails, fetchTeamUrls, fetchCollections, fetchAuditLogs]);

  const handleCreateUrl = async (e) => {
    e.preventDefault();
    if (!longUrl) return;
    try {
      await createNewTeamUrl({
        longUrl,
        customCode: customCode || undefined,
        collectionId: activeCollection || undefined,
        notes,
      });
      setLongUrl('');
      setCustomCode('');
      setNotes('');
      setShowCreateUrlModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating URL');
    }
  };

  const handleDeleteUrl = async (urlId) => {
    if (window.confirm('Are you sure you want to delete this team URL?')) {
      try {
        await deleteUrl(urlId);
      } catch (err) {
        alert(err.response?.data?.message || 'Error deleting URL');
      }
    }
  };

  if (isLoading && !teamDetails) {
    return <div style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>Loading team workspace...</div>;
  }

  const teamName = teamDetails ? teamDetails.name : 'Team Workspace';
  const memberCount = members ? members.length : 1;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 20px', color: '#f8fafc' }}>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
            <h1 style={{ margin: 0, fontSize: '26px' }}>{teamName}</h1>
            <RoleBadge role={userRole} />
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>
            {memberCount} active member{memberCount > 1 ? 's' : ''} • {teamDetails?.description || 'Collaborative URL Shortener Workspace'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate(`/teams/${teamId}/members`)}
            style={{ padding: '8px 16px', background: '#334155', color: '#f8fafc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            👥 Members
          </button>
          <button
            onClick={() => navigate(`/teams/${teamId}/analytics`)}
            style={{ padding: '8px 16px', background: '#334155', color: '#f8fafc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
          >
            📊 Analytics
          </button>
          {(userRole === 'owner' || userRole === 'admin') && (
            <button
              onClick={() => navigate(`/teams/${teamId}/settings`)}
              style={{ padding: '8px 16px', background: '#334155', color: '#f8fafc', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}
            >
              ⚙️ Settings
            </button>
          )}
          {(userRole === 'owner' || userRole === 'admin' || userRole === 'editor') && (
            <button
              onClick={() => setShowCreateUrlModal(true)}
              style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #6C63FF 0%, #3ECFCF 100%)', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              + Shorten Link
            </button>
          )}
        </div>
      </div>

      {/* STATS ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Total Team URLs</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#6C63FF' }}>{teamDetails?.stats?.totalUrls || teamUrls.length}</div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Total Clicks</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3ECFCF' }}>{teamDetails?.stats?.totalClicks || 0}</div>
        </div>
        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '10px', padding: '16px' }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '4px' }}>Active Members</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#FFD700' }}>{memberCount}</div>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '24px' }}>
        {/* COLLECTIONS SIDEBAR */}
        <CollectionSidebar
          collections={collections}
          activeCollection={activeCollection}
          onSelect={(id) => setActiveCollection(id)}
          onCreateCollection={createNewUrlCollection}
        />

        {/* URL LIST & ACTIVITY */}
        <div>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <input
                type="text"
                placeholder="Search team URLs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '8px 14px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  width: '300px',
                }}
              />
            </div>

            {/* URL TABLE */}
            {teamUrls.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                No team URLs found in this collection.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #334155', textAlign: 'left', color: '#94a3b8' }}>
                    <th style={{ padding: '10px' }}>Short Link</th>
                    <th style={{ padding: '10px' }}>Original URL</th>
                    <th style={{ padding: '10px' }}>Created By</th>
                    <th style={{ padding: '10px' }}>Clicks</th>
                    <th style={{ padding: '10px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamUrls
                    .filter((tu) => {
                      if (!search) return true;
                      const q = search.toLowerCase();
                      const u = tu.urlId || {};
                      return (
                        (u.shortCode && u.shortCode.toLowerCase().includes(q)) ||
                        (u.longUrl && u.longUrl.toLowerCase().includes(q))
                      );
                    })
                    .map((tu) => {
                      const u = tu.urlId || {};
                      return (
                        <tr key={tu._id} style={{ borderBottom: '1px solid #334155' }}>
                          <td style={{ padding: '10px', fontWeight: 'bold', color: '#6C63FF' }}>
                            {u.shortCode ? `${window.location.origin}/${u.shortCode}` : 'N/A'}
                          </td>
                          <td style={{ padding: '10px', maxWidth: '250px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#94a3b8' }}>
                            {u.longUrl}
                          </td>
                          <td style={{ padding: '10px' }}>
                            {tu.createdBy?.name || 'Member'}
                          </td>
                          <td style={{ padding: '10px', fontWeight: 'bold' }}>{u.clicks || 0}</td>
                          <td style={{ padding: '10px', textAlign: 'right' }}>
                            {(userRole === 'owner' || userRole === 'admin' || tu.createdBy?._id === teamDetails?.ownerId) && (
                              <button
                                onClick={() => handleDeleteUrl(tu._id)}
                                style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                              >
                                🗑️
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            )}
          </div>

          {/* RECENT ACTIVITY FEED */}
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px' }}>Recent Activity Feed</h3>
            <ActivityFeed activities={auditLogs} />
          </div>
        </div>
      </div>

      {/* CREATE URL MODAL */}
      {showCreateUrlModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100 }}>
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '24px', width: '400px', color: '#f8fafc' }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Shorten New Team Link</h3>
            <form onSubmit={handleCreateUrl}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Destination URL</label>
                <input type="url" placeholder="https://example.com/target-page" value={longUrl} onChange={(e) => setLongUrl(e.target.value)} required style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Custom Alias (Optional)</label>
                <input type="text" placeholder="my-campaign" value={customCode} onChange={(e) => setCustomCode(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>Notes</label>
                <input type="text" placeholder="Campaign notes..." value={notes} onChange={(e) => setNotes(e.target.value)} style={{ width: '100%', padding: '8px', background: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCreateUrlModal(false)} style={{ background: 'none', border: '1px solid #334155', color: '#f8fafc', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ background: '#6C63FF', border: 'none', color: '#ffffff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>Shorten</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamDashboardPage;
