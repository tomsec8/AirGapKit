import React, { useState } from 'react';
import * as Icons from 'lucide-react';

export function FileHashView() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hashes, setHashes] = useState<{ sha256: string; sha512: string } | null>(null);

  const calculateHashes = async (selectedFile: File) => {
    setIsProcessing(true);
    try {
      const buffer = await selectedFile.arrayBuffer();
      
      const sha256Buffer = await crypto.subtle.digest('SHA-256', buffer);
      const sha256Array = Array.from(new Uint8Array(sha256Buffer));
      const sha256Hex = sha256Array.map(b => b.toString(16).padStart(2, '0')).join('');

      const sha512Buffer = await crypto.subtle.digest('SHA-512', buffer);
      const sha512Array = Array.from(new Uint8Array(sha512Buffer));
      const sha512Hex = sha512Array.map(b => b.toString(16).padStart(2, '0')).join('');

      setHashes({ sha256: sha256Hex, sha512: sha512Hex });
    } catch (err) {
      console.error(err);
      alert('Error calculating file hashes');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      setFile(e.dataTransfer.files[0]);
      calculateHashes(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      setFile(e.target.files[0]);
      calculateHashes(e.target.files[0]);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          File Hash Generator
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Calculate cryptographic hashes (SHA-256, SHA-512) to verify file integrity perfectly offline.
        </p>
      </div>

      {!file ? (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          style={{
            border: '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '60px 40px',
            textAlign: 'center',
            background: '#121214',
            marginBottom: '24px',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          onClick={() => document.getElementById('fileUpload')?.click()}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.Key size={32} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Drop file to hash
          </div>
          <input 
            id="fileUpload" 
            type="file" 
            accept="*" 
            style={{ display: 'none' }} 
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icons.File size={24} color="#06b6d4" />
              <div>
                <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>{file.name}</div>
                <div style={{ fontSize: '13px', color: '#8e8e93' }}>{(file.size / 1024).toFixed(2)} KB</div>
              </div>
            </div>
            <button 
              onClick={() => { setFile(null); setHashes(null); }} 
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', padding: '8px 16px', fontSize: '13px' }}
            >
              Change file
            </button>
          </div>

          {isProcessing ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#06b6d4' }}>
              <Icons.Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
              Calculating checksums...
            </div>
          ) : hashes ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#06b6d4', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  SHA-256
                </label>
                <div style={{
                  padding: '16px',
                  background: '#2c2c2e',
                  borderRadius: '12px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '14px',
                  wordBreak: 'break-all',
                  color: '#ffffff',
                  userSelect: 'all',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  {hashes.sha256}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#a855f7', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.5px' }}>
                  SHA-512
                </label>
                <div style={{
                  padding: '16px',
                  background: '#2c2c2e',
                  borderRadius: '12px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '14px',
                  wordBreak: 'break-all',
                  color: '#ffffff',
                  userSelect: 'all',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  {hashes.sha512}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
