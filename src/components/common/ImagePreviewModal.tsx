import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { sanitizeUrl } from '../../utils/sanitize';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export function ImagePreviewModal({ isOpen, imageUrl, title, onClose }: ImagePreviewModalProps) {
  const [rotation, setRotation] = useState<number>(0);

  useEffect(() => {
    if (isOpen) {
      setRotation(0);
    }
  }, [isOpen, imageUrl]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const isRotated90or270 = rotation % 180 !== 0;

  return (
    <div 
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '24px',
        animation: 'fadeIn 0.2s ease-out'
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#1c1c1e',
          borderRadius: '20px',
          padding: '20px 24px',
          maxWidth: '850px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxShadow: '0 25px 50px rgba(0,0,0,0.9)',
          border: '1px solid rgba(255,255,255,0.1)',
          position: 'relative'
        }}
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '12px' }}>
            {title || 'Image Preview'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setRotation(prev => (prev + 90) % 360)}
              style={{
                background: '#2c2c2e',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#06b6d4',
                padding: '6px 14px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Rotate 90°"
            >
              <Icons.RotateCw size={14} /> Rotate
            </button>

            <button
              onClick={onClose}
              style={{ 
                background: '#2c2c2e', 
                border: 'none', 
                color: '#ffffff', 
                borderRadius: '50%', 
                width: '32px', 
                height: '32px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              <Icons.X size={18} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '380px', padding: '16px', background: '#121214', borderRadius: '12px' }}>
          <img 
            src={sanitizeUrl(imageUrl)} 
            alt={title || 'Preview'} 
            style={{ 
              maxWidth: isRotated90or270 ? '55vh' : '100%', 
              maxHeight: isRotated90or270 ? '70vw' : '65vh', 
              objectFit: 'contain',
              borderRadius: '6px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
              transition: 'all 0.3s ease',
              transform: `rotate(${rotation}deg)`
            }} 
          />
        </div>
      </div>
    </div>
  );
}
