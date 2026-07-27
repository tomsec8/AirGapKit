import React, { useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { TopCategoryNav } from './TopCategoryNav';
import { Sidebar } from './Sidebar';
import * as Icons from 'lucide-react';

export function AppShell() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === '/' || location.pathname === '';

  const categoryLabels: Record<string, string> = {
    pdf: 'PDF Tools',
    image: 'Image Tools',
    convert: 'Conversion Tools',
    office: 'Office Tools',
    security: 'Security Tools',
    text: 'Text & Data Tools',
  };

  const currentCategoryKey = location.pathname.split('/')[1] || '';
  const categoryLabel = categoryLabels[currentCategoryKey] || 'Tools';

  const handleBackToCategory = () => {
    if (currentCategoryKey && categoryLabels[currentCategoryKey]) {
      setSelectedCategory(currentCategoryKey);
    }
    navigate('/');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#000000' }}>
      <TopCategoryNav selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <Sidebar selectedCategory={selectedCategory} />
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px', position: 'relative' }}>
          {!isHome && (
            <div style={{ maxWidth: '1000px', margin: '0 auto 16px auto' }}>
              <button 
                onClick={handleBackToCategory} 
                style={{ 
                  background: 'transparent', 
                  border: 'none', 
                  color: '#06b6d4', 
                  cursor: 'pointer', 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  fontSize: '14px', 
                  fontWeight: '500', 
                  padding: '0',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icons.ArrowLeft size={16} />
                Back to {categoryLabel}
              </button>
            </div>
          )}
          <Outlet context={{ selectedCategory, setSelectedCategory }} />
        </main>
      </div>
    </div>
  );
}
