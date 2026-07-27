import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { downloadFileWithDialog, downloadZipWithDialog } from '../../../utils/fileSaver';

interface ProcessedFile {
  name: string;
  blob: Blob;
  size: number;
}

export function WatermarkNumPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [mode, setMode] = useState<'watermark' | 'pagenums'>('watermark');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf');
    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  const handleApply = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    
    try {
      const fontUrl = chrome.runtime.getURL('/fonts/Rubik-Regular.ttf');
      const fontRes = await fetch(fontUrl);
      const fontBytes = await fontRes.arrayBuffer();

      const results: ProcessedFile[] = [];

      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(buffer);
        
        pdfDoc.registerFontkit(fontkit);
        const font = await pdfDoc.embedFont(fontBytes);
        
        const pages = pdfDoc.getPages();

        if (mode === 'watermark') {
          const text = watermarkText || 'DRAFT';
          pages.forEach(page => {
            const { width, height } = page.getSize();
            const fontSize = 60;
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            
            const cx = width / 2;
            const cy = height / 2;
            const rad = Math.PI / 4; 
            const dx = (textWidth / 2) * Math.cos(rad) - (fontSize / 2) * Math.sin(rad);
            const dy = (textWidth / 2) * Math.sin(rad) + (fontSize / 2) * Math.cos(rad);

            page.drawText(text, {
              x: cx - dx,
              y: cy - dy,
              size: fontSize,
              font: font,
              color: rgb(0.8, 0.8, 0.8),
              opacity: 0.5,
              rotate: degrees(45),
            });
          });
        } else {
          pages.forEach((page, idx) => {
            const { width } = page.getSize();
            const text = `Page ${idx + 1} of ${pages.length}`;
            const fontSize = 12;
            const textWidth = font.widthOfTextAtSize(text, fontSize);
            
            page.drawText(text, {
              x: width - textWidth - 30,
              y: 30,
              size: fontSize,
              font: font,
              color: rgb(0, 0, 0),
            });
          });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        results.push({ name: `marked_${file.name}`, blob, size: blob.size });
      }

      setProcessedFiles(results);
    } catch (err) {
      console.error(err);
      alert('Error modifying PDFs.');
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleDownloadAllZip = async () => {
    await downloadZipWithDialog(processedFiles.map(pf => ({ name: pf.name, blob: pf.blob })), 'marked_pdfs.zip');
  };

  const handleDownloadSingle = async (pf: ProcessedFile) => {
    await downloadFileWithDialog(pf.blob, pf.name);
  };

  const handleReset = () => {
    setFiles([]);
    setProcessedFiles([]);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Watermark & Page Numbers
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Batch apply custom diagonal watermarks or automatic page numbering to multiple PDFs offline.
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
                    <Icons.FileCheck size={20} color="#10b981" />
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
              onClick={() => setMode('watermark')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: mode === 'watermark' ? '600' : '500',
                background: mode === 'watermark' ? '#3a3a3c' : 'transparent',
                color: mode === 'watermark' ? '#ffffff' : '#8e8e93',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Watermark Text
            </button>
            <button
              onClick={() => setMode('pagenums')}
              style={{
                padding: '10px 20px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '14px',
                fontWeight: mode === 'pagenums' ? '600' : '500',
                background: mode === 'pagenums' ? '#3a3a3c' : 'transparent',
                color: mode === 'pagenums' ? '#ffffff' : '#8e8e93',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Page Numbers
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
              <Icons.Stamp size={32} color="#f43f5e" />
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

              {mode === 'watermark' && (
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '13px', color: '#8e8e93', marginBottom: '8px' }}>Watermark Text</label>
                  <input 
                    type="text" 
                    value={watermarkText} 
                    onChange={e => setWatermarkText(e.target.value)}
                    placeholder="e.g. CONFIDENTIAL"
                    style={{
                      width: '100%', padding: '14px', borderRadius: '10px',
                      background: '#121214', border: '1px solid rgba(255,255,255,0.1)',
                      color: '#ffffff', fontSize: '15px', outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#f43f5e'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                  />
                </div>
              )}

              <button
                onClick={handleApply}
                disabled={isProcessing || (mode === 'watermark' && !watermarkText)}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#f43f5e',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isProcessing || (mode === 'watermark' && !watermarkText) ? 'not-allowed' : 'pointer', 
                  opacity: isProcessing || (mode === 'watermark' && !watermarkText) ? 0.6 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {isProcessing ? <Icons.Loader2 size={20} className="animate-spin" /> : <Icons.Settings size={20} />}
                {isProcessing ? 'Processing Files...' : `Process ${files.length > 1 ? 'Files' : 'File'}`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
