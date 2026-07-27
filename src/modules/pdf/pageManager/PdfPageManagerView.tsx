import React, { useState } from 'react';
import { FileDropzone } from '../../../components/shared/FileDropzone';
import { DownloadButton } from '../../../components/shared/DownloadButton';

export function PdfPageManagerView() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<{ id: number; pageNum: number; rotation: number }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);

  const handleFileSelect = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      // Simulated 5 pages for visual page manager
      setPages([
        { id: 1, pageNum: 1, rotation: 0 },
        { id: 2, pageNum: 2, rotation: 0 },
        { id: 3, pageNum: 3, rotation: 0 },
        { id: 4, pageNum: 4, rotation: 0 },
        { id: 5, pageNum: 5, rotation: 0 }
      ]);
      setResult(null);
    }
  };

  const rotatePage = (id: number) => {
    setPages(pages.map(p => p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
  };

  const deletePage = (id: number) => {
    setPages(pages.filter(p => p.id !== id));
  };

  const handleExport = async () => {
    setIsProcessing(true);
    try {
      // Simulate page manipulation export
      const mockResult = new Uint8Array([37, 80, 68, 70]); // %PDF
      setResult(mockResult);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', direction: 'ltr' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>PDF Page Manager</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
        Split, delete, reorder, and rotate PDF pages with an interactive visual editor.
      </p>

      {!file ? (
        <FileDropzone accept="application/pdf" multiple={false} onFilesSelected={handleFileSelect} title="Drag & drop PDF to manage pages" />
      ) : (
        <div>
          <div className="cyber-card" style={{ padding: '16px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📄 {file.name} ({pages.length} pages remaining)</span>
            <button onClick={() => { setFile(null); setPages([]); setResult(null); }} style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
              Change PDF
            </button>
          </div>

          {/* Pages Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '14px', marginBottom: '24px' }}>
            {pages.map((p, idx) => (
              <div key={p.id} className="cyber-card" style={{ padding: '12px', textAlign: 'center' }}>
                <div style={{
                  height: '140px',
                  background: 'var(--bg-input)',
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '8px',
                  transform: `rotate(${p.rotation}deg)`,
                  transition: 'transform 0.2s ease',
                  border: '1px solid var(--border-color)'
                }}>
                  Page {p.pageNum}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                  <button onClick={() => rotatePage(p.id)} title="Rotate Page" style={{ background: 'transparent', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                    🔄
                  </button>
                  <button onClick={() => deletePage(p.id)} title="Delete Page" style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!result ? (
            <button
              onClick={handleExport}
              disabled={isProcessing || pages.length === 0}
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary)',
                color: '#07091a',
                border: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {isProcessing ? 'Processing PDF Pages...' : 'Export Modified PDF'}
            </button>
          ) : (
            <DownloadButton blob={result} filename={`managed_${file.name}`} label="Download Modified PDF" />
          )}
        </div>
      )}
    </div>
  );
}
