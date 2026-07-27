import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import mammoth from 'mammoth';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

export function WordToText() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState('');
  const [textContent, setTextContent] = useState('');
  const [mode, setMode] = useState<'text' | 'html'>('text');
  const [direction, setDirection] = useState<'rtl' | 'ltr'>('rtl');

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (e.dataTransfer.files.length) {
      const f = e.dataTransfer.files[0];
      if (f.name.toLowerCase().endsWith('.docx')) {
        setFile(f);
        processWord(f);
      } else {
        setErrorMsg('Please upload a valid .docx file.');
      }
    }
  };

  const processWord = async (f: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const arrayBuffer = await f.arrayBuffer();
      
      const rawText = await mammoth.extractRawText({ arrayBuffer });
      setTextContent(rawText.value);

      const htmlRes = await mammoth.convertToHtml({ arrayBuffer });
      setHtmlContent(htmlRes.value);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error extracting text from Word document. Ensure it is a valid .docx file.');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (mode === 'text' && textContent) {
      const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
      await downloadFileWithDialog(blob, `${file?.name.replace(/\.[^/.]+$/, '')}.txt`);
    } else if (mode === 'html' && htmlContent) {
      const fullHtml = `<!DOCTYPE html><html dir="${direction}"><head><meta charset="utf-8"><title>${file?.name}</title></head><body>${htmlContent}</body></html>`;
      const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      await downloadFileWithDialog(blob, `${file?.name.replace(/\.[^/.]+$/, '')}.html`);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Word to Text / HTML
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Instantly convert Word documents into clean text or HTML elements offline.
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
            padding: '80px 40px',
            textAlign: 'center',
            background: '#121214',
            marginBottom: '24px',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('fileUpload')?.click()}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.FileText size={32} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Drop .docx file here
          </div>
          <input 
            id="fileUpload" 
            type="file" 
            accept=".docx" 
            style={{ display: 'none' }} 
            onChange={e => { if (e.target.files?.length) { setFile(e.target.files[0]); processWord(e.target.files[0]); } }}
          />
        </div>
      ) : (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icons.FileText size={24} color="#38bdf8" />
              <div>
                <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>{file.name}</div>
                <div style={{ fontSize: '13px', color: '#8e8e93' }}>{(file.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
            <button 
              onClick={() => { setFile(null); setTextContent(''); setHtmlContent(''); setErrorMsg(null); }} 
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', padding: '8px 16px', fontSize: '13px' }}
            >
              Change File
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            {/* Format Mode Tab */}
            <div style={{ display: 'flex', gap: '8px', background: '#121214', padding: '6px', borderRadius: '12px', width: 'fit-content' }}>
              <button
                onClick={() => setMode('text')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: mode === 'text' ? '600' : '500',
                  background: mode === 'text' ? '#2c2c2e' : 'transparent',
                  color: mode === 'text' ? '#ffffff' : '#8e8e93',
                  cursor: 'pointer',
                }}
              >
                Raw Text
              </button>
              <button
                onClick={() => setMode('html')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: mode === 'html' ? '600' : '500',
                  background: mode === 'html' ? '#2c2c2e' : 'transparent',
                  color: mode === 'html' ? '#ffffff' : '#8e8e93',
                  cursor: 'pointer',
                }}
              >
                HTML Elements
              </button>
            </div>

            {/* Direction Selector */}
            <div style={{ display: 'flex', gap: '4px', background: '#121214', padding: '4px', borderRadius: '8px' }}>
              <button
                onClick={() => setDirection('rtl')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: direction === 'rtl' ? '600' : '500',
                  background: direction === 'rtl' ? '#3a3a3c' : 'transparent',
                  color: direction === 'rtl' ? '#38bdf8' : '#8e8e93',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Right-to-Left (RTL)"
              >
                RTL (Right to Left)
              </button>
              <button
                onClick={() => setDirection('ltr')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: direction === 'ltr' ? '600' : '500',
                  background: direction === 'ltr' ? '#3a3a3c' : 'transparent',
                  color: direction === 'ltr' ? '#38bdf8' : '#8e8e93',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Left-to-Right (LTR)"
              >
                LTR (Left to Right)
              </button>
            </div>
          </div>

          <div style={{ 
            background: '#121214', 
            borderRadius: '12px', 
            padding: '16px', 
            height: '300px', 
            overflowY: 'auto', 
            marginBottom: '24px',
            border: '1px solid rgba(255,255,255,0.05)',
            color: '#e5e7eb',
            fontSize: '14px',
            lineHeight: '1.6',
            whiteSpace: mode === 'text' ? 'pre-wrap' : 'normal',
            fontFamily: mode === 'html' ? 'monospace' : 'inherit',
            direction: direction,
            textAlign: direction === 'rtl' ? 'right' : 'left'
          }}>
            {mode === 'text' ? textContent : htmlContent}
          </div>

          <button
            onClick={handleExport}
            disabled={isProcessing}
            style={{ 
              width: '100%',
              padding: '14px', 
              background: '#38bdf8', 
              border: 'none', 
              color: '#000000', 
              borderRadius: '8px', 
              cursor: isProcessing ? 'not-allowed' : 'pointer', 
              fontWeight: '700',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <Icons.Download size={18} />
            Download {mode === 'text' ? 'TXT' : 'HTML'}
          </button>
        </div>
      )}
    </div>
  );
}
