import React, { useState } from 'react';
import { CLUSTERS, TOOLS, ToolDef } from '../../utils/toolsData';
import * as Icons from 'lucide-react';
import '../../styles/tokens.css';

export default function Popup() {
  const [selectedCluster, setSelectedCluster] = useState<string>('convert');

  const getBrowser = () => {
    if (typeof browser !== 'undefined') return browser;
    if (typeof chrome !== 'undefined') return chrome;
    return null;
  };

  const openTool = (path: string) => {
    const b = getBrowser();
    if (b && b.runtime && b.tabs) {
      const fullUrl = b.runtime.getURL(`app.html#${path}`);
      b.tabs.create({ url: fullUrl });
    } else {
      window.location.hash = path;
    }
  };

  const openMainApp = () => {
    const b = getBrowser();
    if (b && b.runtime && b.tabs) {
      const fullUrl = b.runtime.getURL('app.html');
      b.tabs.create({ url: fullUrl });
    } else {
      window.open('/app.html', '_blank');
    }
  };

  const currentTools = TOOLS.filter((t: ToolDef) => t.cluster === selectedCluster);

  // Helper to render Lucide icons dynamically
  const renderIcon = (iconName: string, color: string, size: number = 18) => {
    const IconComponent = (Icons as any)[iconName] || Icons.Code;
    return <IconComponent size={size} color={color} strokeWidth={2} />;
  };

  return (
    <div style={{
      width: '380px',
      height: '560px',
      display: 'flex',
      flexDirection: 'column',
      background: '#000000', // Apple deep dark background
      color: '#ffffff',
      direction: 'ltr',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      margin: 0,
      padding: 0,
      overflow: 'hidden'
    }}>
      {/* Sleek Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        background: 'rgba(28, 28, 30, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/icon/logo_transparent.png"
            alt="AirGapKit Logo"
            style={{ height: '28px', width: 'auto' }}
          />
          <div>
            <div style={{ fontSize: '15px', fontWeight: '600', letterSpacing: '-0.3px', color: '#ffffff' }}>
              AirGapKit
            </div>
            <div style={{ fontSize: '10px', color: '#06b6d4', fontWeight: '600', letterSpacing: '0.2px', textTransform: 'uppercase' }}>
              100% Offline
            </div>
          </div>
        </div>

        <button
          onClick={openMainApp}
          style={{
            padding: '6px 14px',
            borderRadius: '20px',
            background: 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            border: 'none',
            fontSize: '12px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
        >
          Open App ↗
        </button>
      </div>

      {/* Segmented Control for Categories */}
      <div style={{ padding: '16px 16px 8px 16px' }}>
        <div style={{
          display: 'flex',
          gap: '4px',
          background: '#1c1c1e',
          padding: '4px',
          borderRadius: '10px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none',  // IE and Edge
        }}>
          <style>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {CLUSTERS.map(c => {
            const isActive = selectedCluster === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setSelectedCluster(c.id)}
                style={{
                  flex: '0 0 auto',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  background: isActive ? '#3a3a3c' : 'transparent',
                  color: isActive ? '#ffffff' : '#8e8e93',
                  fontSize: '13px',
                  fontWeight: isActive ? '600' : '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                {c.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings-style List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px 16px 20px 16px',
      }}>
        <div style={{
          background: '#1c1c1e',
          borderRadius: '12px',
          overflow: 'hidden'
        }}>
          {currentTools.map((tool, index) => {
            const clusterDef = CLUSTERS.find(c => c.id === selectedCluster);
            const iconColor = clusterDef ? clusterDef.color : '#06b6d4';
            
            return (
              <div key={tool.id}>
                <button
                  onClick={() => openTool(tool.path)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#2c2c2e'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  {/* Icon Square */}
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: `${iconColor}25`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '14px',
                    flexShrink: 0
                  }}>
                    {renderIcon(tool.icon, iconColor, 18)}
                  </div>
                  
                  {/* Title & Description */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: '15px', 
                      fontWeight: '500', 
                      color: '#ffffff',
                      marginBottom: '2px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {tool.name}
                    </div>
                    <div style={{ 
                      fontSize: '12px', 
                      color: '#8e8e93',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {tool.description}
                    </div>
                  </div>

                  {/* Chevron */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icons.ChevronRight size={16} color="#8e8e93" />
                  </div>
                </button>
                
                {/* Separator Line */}
                {index < currentTools.length - 1 && (
                  <div style={{
                    height: '1px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    marginLeft: '62px' // Align with text
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
