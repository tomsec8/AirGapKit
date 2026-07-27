import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

export function PdfRepair() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'))) {
      setFile(f);
      setSuccess(false);
      setErrorMsg(null);
    }
  };

  const handleRepair = async () => {
    if (!file) return;
    setIsProcessing(true);
    setSuccess(false);
    setErrorMsg(null);
    try {
      let arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);

      // Locate %PDF- header to handle files with garbage preamble
      let headerOffset = -1;
      for (let i = 0; i < Math.min(bytes.length - 4, 1024); i++) {
        if (bytes[i] === 0x25 && bytes[i + 1] === 0x50 && bytes[i + 2] === 0x44 && bytes[i + 3] === 0x46) {
          headerOffset = i;
          break;
        }
      }

      if (headerOffset === -1) {
        throw new Error('No valid PDF header (%PDF-) found. The file may not be a PDF or is too severely damaged.');
      }

      if (headerOffset > 0) {
        arrayBuffer = arrayBuffer.slice(headerOffset);
      }

      // pdf-lib naturally repairs broken xref tables when loading
      const pdfDoc = await PDFDocument.load(arrayBuffer, {
        ignoreEncryption: true,
        throwOnInvalidObject: false,
      } as any);
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      await downloadFileWithDialog(blob, `repaired_${file.name}`);
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'This PDF is too severely corrupted to be repaired offline.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          PDF Repair
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Automatically fix corrupted cross-reference tables and broken structural indexes.
        </p>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', borderRadius: '8px', color: '#f43f5e', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Icons.AlertCircle size={20} />
          <span style={{ fontWeight: '500' }}>{errorMsg}</span>
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
            <Icons.Wrench size={32} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Drop corrupted PDF here
          </div>
          <input 
            id="fileUpload" 
            type="file" 
            accept="application/pdf" 
            style={{ display: 'none' }} 
            onChange={e => { if (e.target.files) { setFile(e.target.files[0]); setSuccess(false); setErrorMsg(null); } }}
          />
        </div>
      ) : (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <Icons.FileText size={24} color="#f43f5e" />
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{file.name}</div>
              <div style={{ fontSize: '13px', color: '#8e8e93' }}>{(file.size / 1024).toFixed(1)} KB</div>
            </div>
          </div>

          {success ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#10b981' }}>
              <Icons.CheckCircle size={48} style={{ margin: '0 auto 16px auto' }} />
              <h3 style={{ fontSize: '18px', color: '#ffffff', marginBottom: '8px' }}>Repair Successful!</h3>
              <p style={{ color: '#8e8e93', marginBottom: '24px', fontSize: '14px' }}>
                The document structure has been rebuilt and saved.
              </p>
              <button
                onClick={() => { setFile(null); setSuccess(false); setErrorMsg(null); }}
                style={{ padding: '12px 24px', background: '#38bdf8', border: 'none', color: '#000000', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
              >
                Repair Another File
              </button>
            </div>
          ) : (
            <button
              onClick={handleRepair}
              disabled={isProcessing}
              style={{ 
                width: '100%',
                padding: '14px', 
                background: '#f43f5e', 
                border: 'none', 
                color: '#ffffff', 
                borderRadius: '8px', 
                cursor: isProcessing ? 'not-allowed' : 'pointer', 
                fontWeight: '700',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: isProcessing ? 0.6 : 1
              }}
            >
              {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.Wrench size={18} />}
              {isProcessing ? 'Analyzing and Rebuilding...' : 'Start Repair'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
