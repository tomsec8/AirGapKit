import React, { useState } from 'react';

interface FileDropzoneProps {
  accept?: string;
  multiple?: boolean;
  onFilesSelected: (files: File[]) => void;
  title?: string;
  subtitle?: string;
}

export function FileDropzone({
  accept = '*',
  multiple = true,
  onFilesSelected,
  title = 'Drag & drop your files here',
  subtitle = '100% offline — files never leave your computer'
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      style={{
        border: `2px dashed ${isDragOver ? 'var(--primary)' : 'var(--border-color)'}`,
        background: isDragOver ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-card)',
        borderRadius: 'var(--radius-lg)',
        padding: '40px 24px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isDragOver ? 'var(--shadow-glow)' : 'none'
      }}
      onClick={() => document.getElementById('airgap-file-input')?.click()}
    >
      <input
        id="airgap-file-input"
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        style={{ display: 'none' }}
      />
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>📂</div>
      <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '6px', color: 'var(--text-main)' }}>
        {title}
      </h3>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
        {subtitle}
      </p>
      <button style={{
        marginTop: '16px',
        padding: '8px 18px',
        borderRadius: 'var(--radius-sm)',
        background: 'var(--primary)',
        color: '#fff',
        border: 'none',
        fontSize: '13px',
        fontWeight: '600',
        cursor: 'pointer'
      }}>
        Browse Files
      </button>
    </div>
  );
}
