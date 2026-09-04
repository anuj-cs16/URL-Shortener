import React from 'react';
import { getRoleColor, getRoleLabel } from '../../config/roles';

export const RoleBadge = ({ role = 'viewer', size = 'md' }) => {
  const color = getRoleColor(role);
  const label = getRoleLabel(role);

  const styleMap = {
    sm: { padding: '2px 6px', fontSize: '11px' },
    md: { padding: '4px 10px', fontSize: '12px' },
    lg: { padding: '6px 14px', fontSize: '14px' },
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: '600',
        borderRadius: '12px',
        backgroundColor: `${color}20`,
        color: color,
        border: `1px solid ${color}40`,
        textTransform: 'capitalize',
        ...styleMap[size] || styleMap.md,
      }}
    >
      {label}
    </span>
  );
};

export default RoleBadge;
