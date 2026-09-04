import React from 'react';

export const ActivityFeed = ({ activities = [] }) => {
  if (!activities || activities.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
        No recent activity found.
      </div>
    );
  }

  const formatAction = (action) => {
    const map = {
      team_created: 'created the team workspace',
      member_invited: 'invited a new member',
      member_joined: 'joined the team',
      member_removed: 'removed a team member',
      member_role_changed: 'updated a member role',
      url_created: 'shortened a new team link',
      url_edited: 'edited a team link',
      url_deleted: 'deleted a team link',
      collection_created: 'created a new collection folder',
      collection_deleted: 'deleted a collection folder',
      settings_changed: 'updated team settings',
    };
    return map[action] || action.replace(/_/g, ' ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {activities.map((act, index) => (
        <div
          key={act.id || index}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '12px',
            background: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#6C63FF20',
              color: '#6C63FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
              flexShrink: 0,
            }}
          >
            {act.user ? act.user.charAt(0).toUpperCase() : 'U'}
          </div>
          <div style={{ flexGrow: 1 }}>
            <div style={{ fontSize: '13px', color: '#f8fafc' }}>
              <strong>{act.user || 'Member'}</strong> {formatAction(act.action)}
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>
              {new Date(act.time).toLocaleString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityFeed;
