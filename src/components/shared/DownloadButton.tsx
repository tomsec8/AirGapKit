import React from 'react';
import { sanitizeUrl } from '../../utils/sanitize';

interface DownloadButtonProps {
  blob: Blob | Uint8Array;
  filename: string;
  label?: string;
}

export function DownloadButton({ blob, filename, label = 'Download Result' }: DownloadButtonProps) {
  const handleDownload = () => {
    const dataBlob = blob instanceof Uint8Array 
      ? new Blob([blob.buffer as ArrayBuffer], { type: 'application/octet-stream' }) 
      : blob;
      
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = sanitizeUrl(url);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      style={{
        padding: '12px 24px',
        borderRadius: 'var(--radius-md)',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: '#fff',
        border: 'none',
        fontSize: '14px',
        fontWeight: 'bold',
        cursor: 'pointer',
        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span>⬇️</span> {label}
    </button>
  );
}
