import React, { useState } from 'react';
import { FileDropzone } from '../shared/FileDropzone';
import { DownloadButton } from '../shared/DownloadButton';
import { stripImageMetadata, stripPdfMetadata } from '../../engines/security/metadataStripper';

export function MetadataStripperView() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Blob | Uint8Array | null>(null);

  const handleStrip = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      if (file.type === 'application/pdf') {
        const cleaned = await stripPdfMetadata(file);
        setResult(cleaned);
      } else {
        const cleaned = await stripImageMetadata(file);
        setResult(cleaned);
      }
    } catch (err) {
      console.error(err);
      alert('Error stripping metadata');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>Metadata Stripper</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
        Remove hidden EXIF data from images and sensitive author/device metadata from PDF files.
      </p>

      {!file ? (
        <FileDropzone accept="image/*,application/pdf" multiple={false} onFilesSelected={(files) => setFile(files[0])} title="Drag & drop file to clean metadata" />
      ) : (
        <div>
          <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🛡️ {file.name}</span>
              <button onClick={() => { setFile(null); setResult(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent-pdf)', cursor: 'pointer', fontSize: '12px' }}>
                Remove file
              </button>
            </div>
          </div>

          {!result ? (
            <button
              onClick={handleStrip}
              disabled={isProcessing}
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-secure)',
                color: '#fff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {isProcessing ? 'Cleaning Metadata...' : 'Strip Metadata & Clean File'}
            </button>
          ) : (
            <div>
              <DownloadButton blob={result} filename={`cleaned_${file.name}`} label="Download Clean File" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
