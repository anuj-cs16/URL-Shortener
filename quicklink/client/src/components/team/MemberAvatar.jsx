import React from 'react';
import Avatar from 'react-avatar';
import RoleBadge from './RoleBadge';

export const MemberAvatar = ({ user = {}, size = 36, showRole = false }) => {
  const name = user.name || user.email || 'User';
  const role = user.role || 'viewer';

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <Avatar
          name={name}
          src={user.avatar}
          size={size}
          round={true}
          color="#6C63FF"
          fgColor="#FFFFFF"
        />
      </div>
      {showRole && <RoleBadge role={role} size="sm" />}
    </div>
  );
};

export default MemberAvatar;
