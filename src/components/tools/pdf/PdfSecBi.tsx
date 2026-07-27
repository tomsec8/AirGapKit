import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { downloadFileWithDialog, downloadZipWithDialog } from '../../../utils/fileSaver';

interface ProcessedFile {
  name: string;
  blob: Blob;
  size: number;
}

export function PdfSecBi() {
  const [files, setFiles] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [mode, setMode] = useState<'unlock' | 'lock'>(() => {
    try {
      const saved = localStorage.getItem('airgap_pdf_sec_mode');
      if (saved === 'unlock' || saved === 'lock') return saved;
    } catch(e) {}
    return 'unlock';
  });

  const changeMode = (newMode: 'unlock' | 'lock') => {
    setMode(newMode);
    try { localStorage.setItem('airgap_pdf_sec_mode', newMode); } catch(e) {}
    setProcessedFiles([]);
    setErrorMsg(null);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const processFiles = async () => {
    if (files.length === 0 || !password) return;
    setIsProcessing(true);
    setErrorMsg(null);
    
    const results: ProcessedFile[] = [];
    let failedCount = 0;

    try {
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        
        if (mode === 'unlock') {
          try {
            const pdfBytes = new Uint8Array(buffer);
            let decryptedBytes: Uint8Array;
            try {
              // Try cryptpdf's decrypt first (for AES-256)
              const { decryptPDF } = await import('cryptpdf');
              decryptedBytes = await decryptPDF(pdfBytes, password);
            } catch (cryptoErr) {
              // Fallback to pdf-lib's native unlock (for older RC4 encryptions)
              try {
                const pdfDoc = await PDFDocument.load(buffer, { password } as any);
                decryptedBytes = await pdfDoc.save();
              } catch (innerErr) {
                // Throw to the outer catch if both fail
                throw innerErr;
              }
            }
            const blob = new Blob([decryptedBytes as any], { type: 'application/pdf' });
            results.push({ name: `unlocked_${file.name}`, blob, size: blob.size });
          } catch (err: any) {
            failedCount++;
            // Suppress the console error for expected wrong password attempts
          }
        } else {
          try {
            const pdfBytes = new Uint8Array(buffer);
            const { encryptPDF } = await import('cryptpdf');
            const encryptedBytes = await encryptPDF(pdfBytes, password);
            const blob = new Blob([encryptedBytes as any], { type: 'application/pdf' });
            results.push({ name: `locked_${file.name}`, blob, size: blob.size });
          } catch (err: any) {
            failedCount++;
          }
        }
      }

      setProcessedFiles(results);

      if (failedCount > 0) {
        setErrorMsg(`Failed to ${mode === 'unlock' ? 'unlock' : 'lock'} ${failedCount} file(s). Please make sure the password is correct.`);
      }
    } catch (err) {
      setErrorMsg('A critical error occurred while modifying PDFs.');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setErrorMsg(null);
  };

  const handleDownloadAllZip = async () => {
    const zipName = mode === 'unlock' ? 'unlocked_pdfs.zip' : 'locked_pdfs.zip';
    await downloadZipWithDialog(processedFiles.map(pf => ({ name: pf.name, blob: pf.blob })), zipName);
  };

  const handleDownloadSingle = async (pf: ProcessedFile) => {
    await downloadFileWithDialog(pf.blob, pf.name);
  };

  const handleReset = () => {
    setFiles([]);
    setProcessedFiles([]);
    setPassword('');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          PDF Lock ⇄ Unlock
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Remove password protection from encrypted PDF files offline, or securely encrypt them with AES-256.
        </p>
      </div>

      {processedFiles.length > 0 ? (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#10b981', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.CheckCircle size={24} /> Processing Complete!
            </h3>
            <button
              onClick={handleReset}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', cursor: 'pointer', fontSize: '13px', padding: '8px 12px', borderRadius: '8px' }}
            >
              Start New Batch
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto', marginBottom: '24px' }}>
            {processedFiles.map((pf, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2c2c2e', padding: '16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                  <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '8px', borderRadius: '8px' }}>
                    {mode === 'unlock' ? <Icons.Unlock size={20} color="#10b981" /> : <Icons.Lock size={20} color="#10b981" />}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#ffffff', fontSize: '14px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                      {pf.name}
                    </span>
                    <span style={{ color: '#8e8e93', fontSize: '12px' }}>{(pf.size / 1024).toFixed(1)} KB</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleDownloadSingle(pf)}
                  style={{ background: 'rgba(59, 130, 246, 0.1)', border: 'none', color: '#3b82f6', cursor: 'pointer', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icons.Download size={14} /> Download
                </button>
              </div>
            ))}
          </div>

          {processedFiles.length > 1 && (
            <button
              onClick={handleDownloadAllZip}
              style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#10b981', color: '#ffffff', fontSize: '16px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <Icons.Archive size={20} /> Download All as ZIP
            </button>
          )}
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '8px', background: '#1c1c1e', padding: '6px', borderRadius: '12px', marginBottom: '24px', width: 'fit-content' }}>
            <button
              onClick={() => changeMode('unlock')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: mode === 'unlock' ? '600' : '500',
                background: mode === 'unlock' ? '#3a3a3c' : 'transparent',
                color: mode === 'unlock' ? '#ffffff' : '#8e8e93',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Unlock (Remove Password)
            </button>
            <button
              onClick={() => changeMode('lock')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: mode === 'lock' ? '600' : '500',
                background: mode === 'lock' ? '#3a3a3c' : 'transparent',
                color: mode === 'lock' ? '#ffffff' : '#8e8e93',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Lock (Add Password)
            </button>
          </div>

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
              {mode === 'unlock' ? <Icons.Unlock size={32} color="#f43f5e" /> : <Icons.Lock size={32} color="#f43f5e" />}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
              Drop PDF files here
            </div>
            <div style={{ color: '#8e8e93', fontSize: '14px' }}>
              Select multiple files to process them as a batch
            </div>
            <input 
              id="fileUpload" 
              type="file" 
              multiple
              accept="application/pdf" 
              style={{ display: 'none' }} 
              onChange={e => { 
                if (e.target.files) {
                  setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                }
              }}
            />
          </div>

          {files.length > 0 && (
            <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#ffffff', margin: 0 }}>
                  {files.length} {files.length === 1 ? 'File' : 'Files'} Selected
                </h3>
                <button
                  onClick={() => setFiles([])}
                  style={{ background: 'transparent', border: 'none', color: '#f43f5e', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                >
                  Clear All
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '250px', overflowY: 'auto', marginBottom: '24px' }}>
                {files.map((f, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2c2c2e', padding: '12px 16px', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                      <Icons.FileText size={18} color="#8e8e93" />
                      <span style={{ color: '#ffffff', fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {f.name}
                      </span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(idx); }}
                      style={{ background: 'transparent', border: 'none', color: '#8e8e93', cursor: 'pointer', padding: '4px' }}
                    >
                      <Icons.X size={16} />
                    </button>
                  </div>
                ))}
              </div>

          {errorMsg && (
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', color: '#f43f5e', padding: '12px 16px', borderRadius: '8px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.AlertCircle size={20} />
              <span style={{ fontSize: '14px', fontWeight: '500' }}>{errorMsg}</span>
            </div>
          )}

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#8e8e93', marginBottom: '8px' }}>
              {mode === 'unlock' ? 'Password (required to unlock)' : 'Set Password (to lock the PDF)'}
            </label>
            <input 
              type="password" 
              value={password} 
              onChange={e => {
                setPassword(e.target.value);
                setErrorMsg(null);
              }}
              placeholder={mode === 'unlock' ? "Enter the PDF password" : "Enter a strong password"}
              style={{
                width: '100%', padding: '14px', borderRadius: '10px',
                background: '#121214', border: '1px solid rgba(255,255,255,0.1)',
                color: '#ffffff', fontSize: '15px', outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = '#f43f5e'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
            />
          </div>
              
              <button
                onClick={processFiles}
                disabled={isProcessing || !password}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#f43f5e',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isProcessing || !password ? 'not-allowed' : 'pointer', 
                  opacity: isProcessing || !password ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {isProcessing ? <Icons.Loader2 size={20} className="animate-spin" /> : (mode === 'unlock' ? <Icons.Unlock size={20} /> : <Icons.Lock size={20} />)}
                {isProcessing ? 'Processing Files...' : (mode === 'unlock' ? `Unlock ${files.length > 1 ? 'Files' : 'File'}` : `Encrypt ${files.length > 1 ? 'Files' : 'File'}`)}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
