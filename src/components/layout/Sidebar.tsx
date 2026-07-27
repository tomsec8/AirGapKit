import React from 'react';
import { NavLink } from 'react-router-dom';
import { TOOLS, CLUSTERS } from '../../utils/toolsData';
import * as Icons from 'lucide-react';

interface SidebarProps {
  selectedCategory: string;
}

export function Sidebar({ selectedCategory }: SidebarProps) {
  // Helper to render Lucide icons dynamically
  const renderIcon = (iconName: string, size: number = 16, color: string = 'currentColor') => {
    const IconComponent = (Icons as any)[iconName] || Icons.Code;
    return <IconComponent size={size} color={color} strokeWidth={2.5} />;
  };

  const navLinkStyle = (isActive: boolean, clusterColor: string = '#06b6d4') => ({
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px 14px',
    borderRadius: '10px',
    color: isActive ? '#ffffff' : '#8e8e93',
    background: isActive ? `${clusterColor}30` : 'transparent',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: isActive ? '600' : '500',
    transition: 'all 0.15s ease',
    marginBottom: '4px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
  });

  if (selectedCategory === 'all') {
    return (
      <aside style={{
        width: '260px',
        background: '#121214',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        userSelect: 'none',
        direction: 'ltr',
        padding: '20px 16px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      }}>
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
          <style>{`
            div::-webkit-scrollbar {
              width: 4px;
            }
            div::-webkit-scrollbar-track {
              background: transparent;
            }
            div::-webkit-scrollbar-thumb {
              background: rgba(255, 255, 255, 0.1);
              borderRadius: 4px;
            }
          `}</style>
          
          {CLUSTERS.map(cluster => {
            const clusterTools = TOOLS.filter(t => t.cluster === cluster.id);
            return (
              <div key={cluster.id} style={{ marginBottom: '24px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: cluster.color,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  padding: '0 8px',
                  marginBottom: '10px'
                }}>
                  {renderIcon(cluster.icon, 14, cluster.color)}
                  {cluster.name}
                </div>
                
                {clusterTools.map(tool => (
                  <NavLink
                    key={tool.id}
                    to={tool.path}
                    style={({ isActive }) => navLinkStyle(isActive, cluster.color)}
                    className="sidebar-link"
                  >
                    {({ isActive }) => (
                      <>
                        <div style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          opacity: isActive ? 1 : 0.7 
                        }}>
                          {renderIcon(tool.icon, 16, isActive ? cluster.color : '#8e8e93')}
                        </div>
                        <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {tool.name}
                        </span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </div>
      </aside>
    );
  }

  const visibleTools = TOOLS.filter(t => t.cluster === selectedCategory);
  const currentCluster = CLUSTERS.find(c => c.id === selectedCategory);
  const clusterColor = currentCluster ? currentCluster.color : '#06b6d4';

  return (
    <aside style={{
      width: '260px',
      background: '#121214',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      userSelect: 'none',
      direction: 'ltr',
      padding: '20px 16px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '0 8px 16px 8px',
        marginBottom: '16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        fontSize: '13px',
        fontWeight: '700',
        color: clusterColor,
        textTransform: 'uppercase',
        letterSpacing: '0.8px'
      }}>
        {currentCluster && renderIcon(currentCluster.icon, 16, clusterColor)}
        {currentCluster ? `${currentCluster.name} Tools` : 'Tools'}
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px' }}>
        <style>{`
          div::-webkit-scrollbar {
            width: 4px;
          }
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          div::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            borderRadius: 4px;
          }
        `}</style>
        
        {visibleTools.map(tool => (
          <NavLink
            key={tool.id}
            to={tool.path}
            style={({ isActive }) => navLinkStyle(isActive, clusterColor)}
          >
            {({ isActive }) => (
              <>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  opacity: isActive ? 1 : 0.7 
                }}>
                  {renderIcon(tool.icon, 16, isActive ? clusterColor : '#8e8e93')}
                </div>
                <span>{tool.name}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
