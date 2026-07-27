import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';

export function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [level, setLevel] = useState<'low' | 'medium' | 'high'>('medium');
  const [result, setResult] = useState<{ blob: Blob; originalSize: number; newSize: number } | null>(null);
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

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length && (e.dataTransfer.files[0].type === 'application/pdf' || e.dataTransfer.files[0].name.toLowerCase().endsWith('.pdf'))) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
      setErrorMessage(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length && (e.target.files[0].type === 'application/pdf' || e.target.files[0].name.toLowerCase().endsWith('.pdf'))) {
      setFile(e.target.files[0]);
      setResult(null);
      setErrorMessage(null);
    }
  };

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Locate %PDF- header magic bytes (0x25, 0x50, 0x44, 0x46)
      let headerOffset = -1;
      for (let i = 0; i < Math.min(bytes.length - 4, 1024); i++) {
        if (bytes[i] === 0x25 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x44 && bytes[i + 3] === 0x46) {
          headerOffset = i;
          break;
        }
      }

      if (headerOffset === -1) {
        throw new Error('No valid PDF header (%PDF-) found in the file. The file may be corrupt or encrypted.');
      }

      if (headerOffset > 0) {
        arrayBuffer = arrayBuffer.slice(headerOffset);
      }

      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        throwOnInvalidObject: false
      } as any);

      if (level === 'high' || level === 'medium') {
        // Strip metadata properties to reduce size
        try { pdfDoc.setTitle(''); } catch (e) { }
        try { pdfDoc.setAuthor(''); } catch (e) { }
        try { pdfDoc.setSubject(''); } catch (e) { }
        try { pdfDoc.setKeywords([]); } catch (e) { }
        try { pdfDoc.setProducer(''); } catch (e) { }
        try { pdfDoc.setCreator(''); } catch (e) { }
      }

      // Save with useObjectStreams to compress PDF structure
      const pdfBytes = await pdfDoc.save({ useObjectStreams: level !== 'low' });

      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      setResult({ blob, originalSize: file.size, newSize: blob.size });
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Failed to compress PDF: ${err?.message || 'Invalid or corrupted PDF document'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (result && file) {
      saveFileWithPicker(result.blob, `compressed_${file.name}`);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Compress PDF Document
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Structurally optimize and shrink PDF file sizes completely offline with error recovery and Save As location selector.
        </p>
      </div>

      {errorMessage && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#fca5a5', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Icons.AlertCircle size={18} color="#ef4444" />
          {errorMessage}
        </div>
      )}

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
          }}
          onClick={() => document.getElementById('fileUpload')?.click()}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.Minimize2 size={32} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Select or Drop PDF Here to Compress
          </div>
          <div style={{ fontSize: '13px', color: '#8e8e93' }}>
            Shrink file size 100% offline.
          </div>
          <input
            id="fileUpload"
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={handleFileSelect}
          />
        </div>
      ) : !result ? (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Icons.FileText size={24} color="#f43f5e" />
            <div>
              <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>{file.name}</div>
              <div style={{ fontSize: '13px', color: '#8e8e93' }}>Original Size: {(file.size / (1024 * 1024)).toFixed(2)} MB</div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#8e8e93', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
              Compression Level
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { id: 'low', label: 'Low', desc: 'Basic rebuild' },
                { id: 'medium', label: 'Medium', desc: 'Metadata strip + rebuild' },
                { id: 'high', label: 'High', desc: 'Object streams + strip' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setLevel(opt.id as any)}
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    border: level === opt.id ? '1px solid #f43f5e' : '1px solid rgba(255,255,255,0.1)',
                    background: level === opt.id ? 'rgba(244, 63, 94, 0.1)' : 'transparent',
                    color: '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'left'
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '14px', marginBottom: '4px' }}>{opt.label}</div>
                  <div style={{ fontSize: '11px', color: '#8e8e93' }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => { setFile(null); setErrorMessage(null); }}
              style={{ padding: '14px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              Cancel
            </button>
            <button
              onClick={handleCompress}
              disabled={isProcessing}
              style={{
                flex: 1,
                padding: '14px',
                background: '#f43f5e',
                border: 'none',
                color: '#ffffff',
                borderRadius: '8px',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isProcessing ? 0.6 : 1
              }}
            >
              {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.Minimize2 size={18} />}
              {isProcessing ? 'Compressing PDF...' : 'Compress PDF Now'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.CheckCircle size={32} color="#10b981" />
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
            PDF Compressed Successfully!
          </h3>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', margin: '24px 0', background: '#121214', padding: '16px', borderRadius: '12px' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#8e8e93', marginBottom: '4px' }}>Original Size</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff' }}>{(result.originalSize / (1024 * 1024)).toFixed(2)} MB</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize: '12px', color: '#8e8e93', marginBottom: '4px' }}>Compressed Size</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>{(result.newSize / (1024 * 1024)).toFixed(2)} MB</div>
            </div>
            <div style={{ borderLeft: '1px solid rgba(255,255,255,0.1)' }} />
            <div>
              <div style={{ fontSize: '12px', color: '#8e8e93', marginBottom: '4px' }}>Reduction</div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>
                {Math.round(((result.originalSize - result.newSize) / result.originalSize) * 100)}%
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => { setFile(null); setResult(null); setErrorMessage(null); }}
              style={{ flex: 1, padding: '14px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              Compress Another File
            </button>
            <button
              onClick={handleDownload}
              style={{ flex: 1, padding: '14px', background: '#10b981', border: 'none', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <Icons.Download size={18} />
              Save Compressed PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
