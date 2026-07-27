import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { saveAs } from 'file-saver';
import { stripImageMetadata, stripPdfMetadata, stripOfficeMetadata, readMetadata } from './metadataStripperEngine';

export function MetadataStripperView() {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState<Record<string, string> | null>(null);
  const [isReadingMeta, setIsReadingMeta] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Blob | Uint8Array | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveFileWithPicker = async (blob: Blob, suggestedName: string) => {
    try {
      if (typeof chrome !== 'undefined' && chrome.downloads) {
        const url = URL.createObjectURL(blob);
        await chrome.downloads.download({
          url: url,
          filename: suggestedName,
          saveAs: true
        });
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        return;
      }
    } catch (err) {
      console.warn("chrome.downloads failed, falling back to saveAs:", err);
    }
    saveAs(blob, suggestedName);
  };

  const loadFileAndMetadata = async (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setErrorMessage(null);
    setIsReadingMeta(true);
    try {
      const meta = await readMetadata(selectedFile);
      setMetadata(meta);
    } catch (e) {
      console.error(e);
      setMetadata({});
    } finally {
      setIsReadingMeta(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      loadFileAndMetadata(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      loadFileAndMetadata(e.target.files[0]);
    }
  };

  const handleStrip = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const cleaned = await stripPdfMetadata(file);
        setResult(cleaned);
      } else if (file.name.match(/\.(docx|xlsx|pptx)$/i)) {
        const cleaned = await stripOfficeMetadata(file);
        setResult(cleaned);
      } else {
        const cleaned = await stripImageMetadata(file);
        setResult(cleaned);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Error stripping metadata: ${err?.message || 'Invalid or corrupted file'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result || !file) return;
    let mimeType = file.type || 'application/octet-stream';
    if (file.name.toLowerCase().endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    else if (file.name.toLowerCase().endsWith('.xlsx')) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    else if (file.name.toLowerCase().endsWith('.pptx')) mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    else if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') mimeType = 'application/pdf';

    const blob = result instanceof Uint8Array 
      ? new Blob([result as any], { type: mimeType }) 
      : new Blob([result], { type: mimeType });

    saveFileWithPicker(blob, `cleaned_${file.name}`);
  };

  const metaKeys = metadata ? Object.keys(metadata) : [];

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Metadata Stripper
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Inspect existing metadata properties and remove sensitive author, camera, and device data 100% offline.
        </p>
      </div>

      {errorMessage && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#fca5a5', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Icons.AlertCircle size={18} color="#ef4444" />
          {errorMessage}
        </div>
      )}

      {!result ? (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          style={{
            border: '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '50px 40px',
            textAlign: 'center',
            background: '#121214',
            marginBottom: '24px',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('fileUpload')?.click()}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.ShieldAlert size={32} color="#ef4444" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Select or Drop Image, PDF or Office File Here
          </div>
          <div style={{ fontSize: '13px', color: '#8e8e93' }}>
            Supports JPG, PNG, PDF, DOCX, XLSX, PPTX.
          </div>
          <input 
            id="fileUpload" 
            type="file" 
            accept="image/*,application/pdf,.docx,.xlsx,.pptx" 
            style={{ display: 'none' }} 
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '36px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.3)', marginBottom: '24px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.Check size={32} color="#10b981" />
          </div>
          <h2 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '8px' }}>File Sanitized Successfully</h2>
          <p style={{ color: '#8e8e93', marginBottom: '24px', fontSize: '14px' }}>All author, title, location, and camera metadata tags have been permanently stripped.</p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => { setFile(null); setResult(null); setMetadata(null); }}
              style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}
            >
              Clean Another File
            </button>
            <button
              onClick={handleDownload}
              style={{ padding: '10px 20px', background: '#10b981', border: 'none', color: '#000000', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Icons.Download size={18} /> Download Sanitized File
            </button>
          </div>
        </div>
      )}

      {file && !result && (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icons.File size={24} color="#ef4444" />
              <div>
                <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>{file.name}</div>
                <div style={{ fontSize: '12px', color: '#8e8e93' }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
            <button
              onClick={handleStrip}
              disabled={isProcessing || isReadingMeta}
              style={{ 
                padding: '10px 20px', 
                background: '#ef4444', 
                border: 'none', 
                color: '#ffffff', 
                borderRadius: '8px', 
                cursor: isProcessing ? 'not-allowed' : 'pointer', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.Shield size={18} />}
              Strip Metadata Now
            </button>
          </div>

          {/* Metadata Inspection Panel */}
          <div>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#8e8e93', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icons.Search size={14} color="#06b6d4" />
              Metadata Detected Before Stripping:
            </div>

            {isReadingMeta ? (
              <div style={{ fontSize: '13px', color: '#8e8e93', padding: '12px', background: '#2c2c2e', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Loader2 size={14} className="animate-spin" /> Inspecting metadata properties...
              </div>
            ) : metaKeys.length > 0 ? (
              <div style={{ background: '#2c2c2e', borderRadius: '10px', padding: '12px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                {metaKeys.map(key => (
                  <div key={key} style={{ background: '#1c1c1e', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ fontSize: '11px', color: '#ef4444', fontWeight: '600', marginBottom: '2px' }}>{key}</div>
                    <div style={{ fontSize: '13px', color: '#ffffff', wordBreak: 'break-word' }}>{metadata![key]}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: '13px', color: '#10b981', padding: '12px 16px', background: '#2c2c2e', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.CheckCircle size={16} /> No hidden metadata tags detected in this file.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
