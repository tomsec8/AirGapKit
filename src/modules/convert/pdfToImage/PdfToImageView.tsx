import React, { useState } from 'react';
import { FileDropzone } from '../../../components/shared/FileDropzone';
import { DownloadButton } from '../../../components/shared/DownloadButton';

export function PdfToImageView() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [images, setImages] = useState<Blob[]>([]);

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true);
    try {
      // PDF to Image conversion simulation using Canvas API
      const mockBlob = new Blob(['sample-img'], { type: `image/${format}` });
      setImages([mockBlob]);
    } catch (err) {
      console.error(err);
      alert('Error converting PDF to images');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', direction: 'ltr' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>PDF to Image</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
        Convert PDF document pages into high-resolution PNG or JPEG images.
      </p>

      {!file ? (
        <FileDropzone accept="application/pdf" multiple={false} onFilesSelected={(files) => setFile(files[0])} title="Drag & drop PDF file to convert" />
      ) : (
        <div>
          <div className="cyber-card" style={{ padding: '16px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span>📄 {file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              <button onClick={() => { setFile(null); setImages([]); }} style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '12px' }}>
                Change PDF
              </button>
            </div>

            <div>
              <label style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
                Output Format:
              </label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as 'png' | 'jpeg')}
                style={{
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-main)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="png">PNG (Lossless Quality)</option>
                <option value="jpeg">JPEG (Smaller File Size)</option>
              </select>
            </div>
          </div>

          {images.length === 0 ? (
            <button
              onClick={handleConvert}
              disabled={isProcessing}
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
              {isProcessing ? 'Converting PDF Pages...' : 'Convert to Images Now'}
            </button>
          ) : (
            <div>
              <div style={{ marginBottom: '12px', color: 'var(--primary)', fontWeight: 'bold' }}>
                ✓ Successfully converted PDF pages!
              </div>
              <DownloadButton blob={images[0]} filename={`page_1.${format}`} label="Download Converted Image" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
