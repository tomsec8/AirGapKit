import React from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import * as Icons from 'lucide-react';
import { TOOLS, CLUSTERS } from '../../utils/toolsData';

export function HomePage() {
  const { selectedCategory } = useOutletContext<{ selectedCategory: string }>() || { selectedCategory: 'all' };

  const displayedClusters = selectedCategory === 'all' 
    ? CLUSTERS 
    : CLUSTERS.filter(c => c.id === selectedCategory);

  return (
    <div style={{ padding: '24px 32px', maxWidth: '1280px', margin: '0 auto', direction: 'ltr' }}>
      {/* Apple-Style Minimalist Hero Section */}
      <div style={{ marginBottom: '48px', paddingTop: '20px' }}>
        <h1 style={{ 
          fontSize: '44px', 
          fontWeight: '800', 
          color: '#ffffff', 
          letterSpacing: '-1px', 
          marginBottom: '16px', 
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
        }}>
          All-in-One <span style={{ color: '#06b6d4' }}>Offline</span> File Toolkit
        </h1>
        <p style={{ 
          color: '#8e8e93', 
          fontSize: '18px', 
          lineHeight: '1.5', 
          maxWidth: '640px', 
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
        }}>
          Process, convert, compress and sanitize your files without ever uploading a single byte to remote servers. Fast, secure, and completely local.
        </p>
      </div>

      {/* Tools Organized by Cluster */}
      <div id="tools-grid">
        {displayedClusters.map(cluster => {
          const clusterTools = TOOLS.filter(t => t.cluster === cluster.id);
          return (
            <div key={cluster.id} style={{ marginBottom: '44px' }}>
              {/* Category Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cluster.color }} />
                <h2 style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)' }}>
                  {cluster.name} Tools
                </h2>
                <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: '600' }}>
                  ({clusterTools.length})
                </span>
              </div>

              {/* Grid of Modern Tool Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {clusterTools.map(tool => {
                  const IconComponent = (Icons as any)[tool.icon] || Icons.Code;
                  return (
                    <Link
                      key={tool.id}
                      to={tool.path}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div style={{
                        background: '#1c1c1e',
                        borderRadius: '16px',
                        padding: '20px',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid rgba(255, 255, 255, 0.03)',
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = '#2c2c2e';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = '#1c1c1e';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '10px',
                              background: `${cluster.color}25`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <IconComponent size={22} color={cluster.color} strokeWidth={2} />
                            </div>
                          </div>
                          
                          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', marginBottom: '6px', letterSpacing: '-0.3px', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                            {tool.name}
                          </h3>
                          <p style={{ fontSize: '13px', color: '#8e8e93', lineHeight: '1.5', fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif' }}>
                            {tool.description}
                          </p>
                        </div>

                        <div style={{
                          marginTop: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end'
                        }}>
                          <Icons.ChevronRight size={18} color="#8e8e93" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
