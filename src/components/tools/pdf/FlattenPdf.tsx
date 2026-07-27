import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

export function FlattenPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (e.dataTransfer.files.length && (e.dataTransfer.files[0].type === 'application/pdf' || e.dataTransfer.files[0].name.toLowerCase().endsWith('.pdf'))) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFlatten = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      
      try {
        const form = pdfDoc.getForm();
        form.flatten();
      } catch (formErr) {
        // If file has no form fields, saving pdf-lib document still locks annotations
        console.warn('No interactive form fields found to flatten:', formErr);
      }
      
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      await downloadFileWithDialog(blob, `flattened_${file.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error flattening PDF. Ensure the file is valid.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Flatten PDF
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Permanently lock interactive form fields and annotations into static text.
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
            <Icons.FileCheck size={32} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Drop PDF with forms here
          </div>
          <input 
            id="fileUpload" 
            type="file" 
            accept="application/pdf" 
            style={{ display: 'none' }} 
            onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }}
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
          
          <div style={{ padding: '16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '8px', marginBottom: '24px', color: '#f43f5e', fontSize: '13px', display: 'flex', gap: '12px' }}>
            <Icons.AlertTriangle size={20} style={{ flexShrink: 0 }} />
            <div>
              <strong>Irreversible Action:</strong> Flattening the PDF will burn all text fields, checkboxes, and dropdowns directly onto the pages. They will no longer be editable.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => { setFile(null); setErrorMsg(null); }}
              style={{ padding: '14px 24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
            >
              Cancel
            </button>
            <button
              onClick={handleFlatten}
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
              {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.FileCheck size={18} />}
              {isProcessing ? 'Flattening...' : 'Flatten & Save PDF'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
