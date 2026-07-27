import React, { useState } from 'react';
import { FileDropzone } from '../shared/FileDropzone';
import { DownloadButton } from '../shared/DownloadButton';
import { mergePdfs } from '../../engines/pdf/mergePdf';

export function MergePdfView() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    try {
      const merged = await mergePdfs(files);
      setResultBytes(merged);
    } catch (err) {
      console.error(err);
      alert('Error merging PDFs');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>Merge PDF</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
        Combine multiple PDF documents into a single file in seconds.
      </p>

      {files.length === 0 ? (
        <FileDropzone accept=".pdf" onFilesSelected={setFiles} title="Drag & drop PDF files to merge" />
      ) : (
        <div>
          <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
            <h4 style={{ fontSize: '14px', marginBottom: '12px', color: 'var(--text-muted)' }}>Files to merge:</h4>
            {files.map((file, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', marginBottom: '6px' }}>
                <span>📄 {file.name}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '12px' }}>{(file.size / 1024).toFixed(1)} KB</span>
              </div>
            ))}
            <button onClick={() => setFiles([])} style={{ marginTop: '8px', background: 'transparent', border: 'none', color: 'var(--accent-pdf)', cursor: 'pointer', fontSize: '12px' }}>
              Clear all
            </button>
          </div>

          {!resultBytes ? (
            <button
              onClick={handleMerge}
              disabled={isProcessing}
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--primary)',
                color: '#fff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {isProcessing ? 'Merging PDFs...' : 'Merge Files Now'}
            </button>
          ) : (
            <div>
              <DownloadButton blob={resultBytes} filename="merged_document.pdf" label="Download Merged PDF" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
