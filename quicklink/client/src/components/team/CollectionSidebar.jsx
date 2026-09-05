import React, { useState } from 'react';

export const CollectionSidebar = ({
  collections = [],
  activeCollection = null,
  onSelect,
  onCreateCollection,
  onDeleteCollection,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const color = '#6C63FF';
  const icon = '📁';

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name) return;
    if (onCreateCollection) {
      await onCreateCollection({ name, color, icon });
    }
    setName('');
    setShowCreateModal(false);
  };

  return (
    <div
      style={{
        width: '240px',
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: '12px',
        padding: '16px',
        color: '#f8fafc',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontSize: '14px', textTransform: 'uppercase', color: '#94a3b8' }}>Collections</h4>
        <button
          onClick={() => setShowCreateModal(true)}
          style={{
            background: '#6C63FF20',
            color: '#6C63FF',
            border: '1px solid #6C63FF40',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '12px',
            fontWeight: 'bold',
            cursor: 'pointer',
          }}
        >
          + New
        </button>
      </div>

      <div
        onClick={() => onSelect(null)}
        style={{
          padding: '8px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          background: activeCollection === null ? '#334155' : 'transparent',
          color: activeCollection === null ? '#ffffff' : '#94a3b8',
          fontWeight: activeCollection === null ? '600' : 'normal',
          marginBottom: '4px',
          fontSize: '14px',
        }}
      >
        📂 All URLs
      </div>

      {collections.map((col) => {
        const isSelected = activeCollection === col._id;
        return (
          <div
            key={col._id}
            onClick={() => onSelect(col._id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              borderRadius: '6px',
              cursor: 'pointer',
              background: isSelected ? '#334155' : 'transparent',
              color: isSelected ? '#ffffff' : '#f8fafc',
              fontWeight: isSelected ? '600' : 'normal',
              marginBottom: '4px',
              fontSize: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: col.color || '#6C63FF' }}>{col.icon || '📁'}</span>
              <span>{col.name}</span>
            </div>
            <span style={{ fontSize: '11px', background: '#0f172a', padding: '2px 6px', borderRadius: '10px', color: '#94a3b8' }}>
              {col.urlCount || 0}
            </span>
          </div>
        );
      })}

      {showCreateModal && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1200,
          }}
        >
          <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '20px', width: '320px', color: '#f8fafc' }}>
            <h4 style={{ margin: '0 0 12px 0' }}>New Collection</h4>
            <form onSubmit={handleCreate}>
              <input
                type="text"
                placeholder="Collection Name (e.g. Marketing)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  background: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#f8fafc',
                  marginBottom: '12px',
                  boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ background: 'none', border: '1px solid #334155', color: '#f8fafc', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ background: '#6C63FF', border: 'none', color: '#ffffff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionSidebar;
