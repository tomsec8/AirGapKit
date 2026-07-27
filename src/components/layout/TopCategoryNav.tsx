import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CLUSTERS, TOOLS } from '../../utils/toolsData';
import * as Icons from 'lucide-react';

interface TopCategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (catId: string) => void;
}

export function TopCategoryNav({ selectedCategory, onSelectCategory }: TopCategoryNavProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const filteredTools = searchQuery.trim()
    ? TOOLS.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.description.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <header style={{
      height: '72px',
      background: 'rgba(28, 28, 30, 0.8)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      direction: 'ltr',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      {/* Brand Logo */}
      <div 
        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} 
        onClick={() => { onSelectCategory('all'); navigate('/'); }}
      >
        <img
          src="/icon/logo_transparent.png"
          alt="AirGapKit Logo"
          style={{ height: '36px', width: 'auto', objectFit: 'contain' }}
        />
        <div>
          <div style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '-0.4px', color: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
            AirGapKit
          </div>
          <div style={{ fontSize: '10px', color: '#06b6d4', fontWeight: '600', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
            100% Offline
          </div>
        </div>
      </div>

      {/* Segmented Control for Categories (Apple Style) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#1c1c1e', padding: '4px', borderRadius: '12px' }}>
        <button
          onClick={() => { onSelectCategory('all'); navigate('/'); }}
          style={{
            padding: '8px 16px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '13px',
            fontWeight: selectedCategory === 'all' ? '600' : '500',
            cursor: 'pointer',
            background: selectedCategory === 'all' ? '#3a3a3c' : 'transparent',
            color: selectedCategory === 'all' ? '#ffffff' : '#8e8e93',
            transition: 'all 0.2s ease',
            boxShadow: selectedCategory === 'all' ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
          }}
        >
          Home
        </button>
        {CLUSTERS.map(cluster => (
          <button
            key={cluster.id}
            onClick={() => {
              onSelectCategory(cluster.id);
              navigate('/');
            }}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '13px',
              fontWeight: selectedCategory === cluster.id ? '600' : '500',
              cursor: 'pointer',
              background: selectedCategory === cluster.id ? '#3a3a3c' : 'transparent',
              color: selectedCategory === cluster.id ? '#ffffff' : '#8e8e93',
              transition: 'all 0.2s ease',
              boxShadow: selectedCategory === cluster.id ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}
          >
            {cluster.name}
          </button>
        ))}
      </div>

      {/* Apple Style Quick Search */}
      <div style={{ position: 'relative', width: '260px' }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: '#1c1c1e',
          borderRadius: '10px',
          padding: '0 12px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'all 0.2s ease'
        }}>
          <Icons.Search size={16} color="#8e8e93" />
          <input
            type="text"
            placeholder="Search tools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 10px',
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '14px',
              outline: 'none',
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
            }}
          />
        </div>

        {filteredTools.length > 0 && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: '#2c2c2e',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            zIndex: 100,
            maxHeight: '300px',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
            padding: '8px'
          }}>
            {filteredTools.map((t, index) => {
              const IconComponent = (Icons as any)[t.icon] || Icons.Code;
              return (
                <div
                  key={t.id}
                  onClick={() => { navigate(t.path); setSearchQuery(''); }}
                  style={{ 
                    padding: '10px 12px', 
                    cursor: 'pointer', 
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    borderBottom: index < filteredTools.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#3a3a3c'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <IconComponent size={14} color="#ffffff" />
                  </div>
                  <div>
                    <div style={{ fontWeight: '600', fontSize: '13px', color: '#ffffff', marginBottom: '2px' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: '#8e8e93' }}>{t.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
