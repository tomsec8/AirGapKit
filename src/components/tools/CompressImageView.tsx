import React, { useState } from 'react';
import { FileDropzone } from '../shared/FileDropzone';
import { DownloadButton } from '../shared/DownloadButton';
import { compressImage } from '../../engines/image/compressImage';

export function CompressImageView() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(0.7);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Blob | null>(null);

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      const compressed = await compressImage(file, quality);
      setResult(compressed);
    } catch (err) {
      console.error(err);
      alert('Error compressing image');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>Compress Image</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
        Shrink JPEG/PNG image file sizes directly in your browser.
      </p>

      {!file ? (
        <FileDropzone accept="image/*" multiple={false} onFilesSelected={(files) => setFile(files[0])} title="Drag & drop image file to compress" />
      ) : (
        <div>
          <div className="glass-card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span>🖼️ {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              <button onClick={() => { setFile(null); setResult(null); }} style={{ background: 'transparent', border: 'none', color: 'var(--accent-pdf)', cursor: 'pointer', fontSize: '12px' }}>
                Change image
              </button>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Compression Quality: {Math.round(quality * 100)}%
              </label>
              <input
                type="range"
                min="0.1"
                max="0.9"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {!result ? (
            <button
              onClick={handleCompress}
              disabled={isProcessing}
              style={{
                padding: '12px 24px',
                borderRadius: 'var(--radius-md)',
                background: 'var(--accent-image)',
                color: '#fff',
                border: 'none',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              {isProcessing ? 'Compressing...' : 'Compress Image Now'}
            </button>
          ) : (
            <div>
              <div style={{ marginBottom: '12px', fontSize: '13px', color: 'var(--accent-secure)' }}>
                Original: {(file.size / 1024).toFixed(1)} KB ➔ Compressed: {(result.size / 1024).toFixed(1)} KB ({Math.round((1 - result.size / file.size) * 100)}% smaller!)
              </div>
              <DownloadButton blob={result} filename={`compressed_${file.name}`} label="Download Compressed Image" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
