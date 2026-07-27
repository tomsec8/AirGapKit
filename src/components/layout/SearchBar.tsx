import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TOOLS } from '../../utils/toolsData';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const filtered = query.trim()
    ? TOOLS.filter(t => t.name.toLowerCase().includes(query.toLowerCase()) || t.description.toLowerCase().includes(query.toLowerCase()))
    : [];

  const handleSelect = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <div style={{ position: 'relative', width: '360px' }}>
      <input
        type="text"
        placeholder="🔍 Search tools (e.g., compress, merge, EXIF, Word)..."
        value={query}
        onFocus={() => setIsOpen(true)}
        onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
        style={{
          width: '100%',
          padding: '9px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-input)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-main)',
          fontSize: '13px',
          outline: 'none'
        }}
      />

      {isOpen && filtered.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '115%',
          right: 0,
          left: 0,
          background: '#131b2e',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-card)',
          zIndex: 100,
          maxHeight: '320px',
          overflowY: 'auto'
        }}>
          {filtered.map(tool => (
            <div
              key={tool.id}
              onClick={() => handleSelect(tool.path)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-color)',
                transition: 'background 0.15s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-main)' }}>{tool.name}</div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{tool.description}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
