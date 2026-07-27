import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import JSZip from 'jszip';
import { downloadFileWithDialog } from '../../../utils/fileSaver';
import * as pdfjsLib from 'pdfjs-dist';
import { ImagePreviewModal } from '../../common/ImagePreviewModal';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ExtractedMediaItem {
  id: string;
  sourceFileName: string;
  mediaName: string;
  blob: Blob;
  previewUrl: string;
}

export function MediaExtractor() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ExtractedMediaItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [zoomItem, setZoomItem] = useState<{ url: string; title: string } | null>(null);

  const saveFileWithPicker = async (blob: Blob, suggestedName: string) => {
    await downloadFileWithDialog(blob, suggestedName);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (e.dataTransfer.files.length) {
      const newFiles = Array.from(e.dataTransfer.files).filter(f => 
        f.name.match(/\.(docx|xlsx|pptx|pdf)$/i)
      );
      if (newFiles.length === 0) {
        setErrorMessage('Unsupported file format. Please upload Office (.docx, .xlsx, .pptx) or PDF files.');
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const getErrorMessage = (err: any): string => {
    let msg = '';
    if (typeof err === 'string') msg = err;
    else if (err && typeof err === 'object' && err.message) msg = String(err.message);
    else try { msg = JSON.stringify(err); } catch(e) { msg = 'Unknown file parsing error'; }

    if (msg.includes('Corrupted zip') || msg.includes('missing') && msg.includes('bytes')) {
      return 'The file appears to be corrupted or incomplete. Its ZIP internal structure is damaged and cannot be opened.';
    }
    if (msg.includes('Invalid Root reference')) {
      return 'The PDF file structure is severely corrupted or missing its root catalog object.';
    }
    return msg;
  };

  const extractFromFile = async (file: File): Promise<ExtractedMediaItem[]> => {
    const isOffice = file.name.match(/\.(docx|xlsx|pptx)$/i);
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const extracted: ExtractedMediaItem[] = [];

    if (isOffice) {
      const buffer = await file.arrayBuffer();
      const header = new Uint8Array(buffer.slice(0, 4));

      // Check for old binary format (0xD0, 0xCF, 0x11, 0xE0)
      if (header[0] === 0xD0 && header[1] === 0xCF && header[2] === 0x11 && header[3] === 0xE0) {
        throw new Error(`"${file.name}" is an older binary Office document (.doc / .xls / .ppt). Please save it in modern format (.docx / .xlsx / .pptx) first.`);
      }

      // Check for valid ZIP magic header (0x50, 0x4B - 'PK..')
      if (header[0] !== 0x50 || header[1] !== 0x4B) {
        throw new Error(`"${file.name}" is not a valid ZIP-compressed Office document.`);
      }

      let zip: JSZip;
      try {
        zip = await JSZip.loadAsync(buffer);
      } catch (e: any) {
        throw new Error(`Corrupted Office file "${file.name}": ${getErrorMessage(e)}`);
      }

      const mediaFiles = Object.keys(zip.files).filter(name => 
        name.startsWith('word/media/') || 
        name.startsWith('xl/media/') || 
        name.startsWith('ppt/media/')
      );

      for (let i = 0; i < mediaFiles.length; i++) {
        const name = mediaFiles[i];
        const fileData = await zip.files[name].async('blob');
        const fileName = `${file.name.replace(/\.[^/.]+$/, '')}_${name.split('/').pop() || `img_${i}.png`}`;
        const previewUrl = URL.createObjectURL(fileData);
        extracted.push({
          id: Math.random().toString(36).substring(2, 9),
          sourceFileName: file.name,
          mediaName: fileName,
          blob: fileData,
          previewUrl
        });
      }
    } else if (isPdf) {
      const buffer = await file.arrayBuffer();
      const dataTypedArray = new Uint8Array(buffer.slice(0));

      let pdf: pdfjsLib.PDFDocumentProxy;
      try {
        pdf = await pdfjsLib.getDocument({
          data: dataTypedArray,
          disableRange: true,
          disableStream: true,
          disableAutoFetch: true,
          stopAtErrors: false,
          verbosity: 0
        }).promise;
      } catch (e: any) {
        throw new Error(`Failed to parse PDF "${file.name}": ${getErrorMessage(e)}`);
      }

      for (let i = 1; i <= pdf.numPages; i++) {
        setProgress(Math.round((i / pdf.numPages) * 100));
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport } as any).promise;
          const blob: Blob = await new Promise(res => canvas.toBlob(b => res(b!), 'image/jpeg', 0.9));
          const previewUrl = URL.createObjectURL(blob);
          extracted.push({
            id: Math.random().toString(36).substring(2, 9),
            sourceFileName: file.name,
            mediaName: `${file.name.replace(/\.[^/.]+$/, '')}_page_${i}.jpg`,
            blob,
            previewUrl
          });
        }
      }
    }

    return extracted;
  };

  const processSingleFile = async (targetFile: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const items = await extractFromFile(targetFile);
      if (items.length === 0) {
        setErrorMessage(`No media images found inside "${targetFile.name}".`);
      } else {
        setResults(prev => [...prev.filter(r => r.sourceFileName !== targetFile.name), ...items]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const processAllFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    const errors: string[] = [];
    try {
      const allExtracted: ExtractedMediaItem[] = [];
      for (const file of files) {
        try {
          const items = await extractFromFile(file);
          allExtracted.push(...items);
        } catch (e: any) {
          console.error(e);
          errors.push(getErrorMessage(e));
        }
      }
      if (allExtracted.length === 0 && errors.length > 0) {
        setErrorMessage(errors.join(' | '));
      } else {
        if (errors.length > 0) {
          setErrorMessage(`Completed with some issues: ${errors.join(' | ')}`);
        }
        setResults(allExtracted);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownloadAllZip = async () => {
    if (results.length === 0) return;
    const zip = new JSZip();
    results.forEach(item => {
      zip.file(item.mediaName, item.blob);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    await saveFileWithPicker(zipBlob, 'extracted_media_all.zip');
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Media Extractor
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Extract raw embedded images and media files from Office documents (.docx, .xlsx, .pptx) and PDFs directly.
        </p>
      </div>

      {errorMessage && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#fca5a5', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Icons.AlertCircle size={18} color="#ef4444" />
          {errorMessage}
        </div>
      )}

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
          <Icons.Archive size={32} color="#ef4444" />
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
          Select or Drop Multiple Office or PDF Files
        </div>
        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
          Supports .docx, .xlsx, .pptx and .pdf documents. 100% Offline.
        </div>
        <input 
          id="fileUpload" 
          type="file" 
          accept=".docx,.xlsx,.pptx,application/pdf" 
          multiple
          style={{ display: 'none' }} 
          onChange={handleFileSelect}
        />
      </div>

      {files.length > 0 && (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
              Selected Files ({files.length})
            </span>
            <button 
              onClick={() => { setFiles([]); setResults([]); }} 
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
            >
              Clear List
            </button>
          </div>

          <div style={{ maxHeight: '220px', overflowY: 'auto', marginBottom: files.length > 1 && files.some(f => !results.some(r => r.sourceFileName === f.name)) ? '20px' : '0' }}>
            {files.map((file, i) => {
              const hasResults = results.some(r => r.sourceFileName === file.name);
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#2c2c2e', borderRadius: '8px', marginBottom: '8px' }}>
                  <Icons.FileText size={16} color="#ef4444" />
                  <div style={{ flex: 1, fontSize: '13px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8e8e93' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>

                  {hasResults ? (
                    <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Icons.CheckCircle size={14} /> Extracted
                    </span>
                  ) : (
                    <button 
                      onClick={() => processSingleFile(file)}
                      disabled={isProcessing}
                      style={{
                        background: '#ef4444',
                        border: 'none',
                        color: '#ffffff',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icons.ArchiveRestore size={12} />
                      Extract
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      setFiles(files.filter((_, idx) => idx !== i));
                      setResults(results.filter(r => r.sourceFileName !== file.name));
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: '4px' }}
                  >
                    <Icons.X size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {files.length > 1 && files.some(f => !results.some(r => r.sourceFileName === f.name)) && (
            <button
              onClick={processAllFiles}
              disabled={isProcessing}
              style={{ 
                width: '100%',
                padding: '12px 20px', 
                background: '#ef4444', 
                border: 'none', 
                color: '#ffffff', 
                borderRadius: '10px', 
                cursor: isProcessing ? 'not-allowed' : 'pointer', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.ArchiveRestore size={18} />}
              {isProcessing ? `Extracting ${progress}%` : `Extract Media from All Files (${files.length})`}
            </button>
          )}
        </div>
      )}

      {results.length > 0 && (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Icons.CheckCircle size={18} />
              Extracted Images ({results.length})
            </span>
            <button 
              onClick={handleDownloadAllZip}
              style={{ background: '#ef4444', border: 'none', color: '#ffffff', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Icons.Download size={14} />
              Download All Media (ZIP)
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '12px', maxHeight: '350px', overflowY: 'auto' }}>
            {results.map((item) => (
              <div key={item.id} style={{ background: '#2c2c2e', borderRadius: '10px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img 
                  src={item.previewUrl} 
                  alt={item.mediaName}
                  onClick={() => setZoomItem({ url: item.previewUrl, title: item.mediaName })}
                  title="Click to enlarge preview"
                  style={{ width: '100%', height: '90px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px', background: '#121214', cursor: 'zoom-in' }}
                />
                <div style={{ fontSize: '11px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%', textAlign: 'center', marginBottom: '8px' }}>
                  {item.mediaName}
                </div>
                <div style={{ display: 'flex', gap: '6px', width: '100%' }}>
                  <button
                    onClick={() => saveFileWithPicker(item.blob, item.mediaName)}
                    style={{ flex: 1, background: '#ef4444', border: 'none', color: '#ffffff', padding: '4px 8px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                  >
                    <Icons.Download size={12} />
                    Save
                  </button>
                  <button
                    onClick={() => setResults(results.filter(r => r.id !== item.id))}
                    style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#ef4444', padding: '4px 6px', borderRadius: '6px', cursor: 'pointer' }}
                  >
                    <Icons.X size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ImagePreviewModal
        isOpen={!!zoomItem}
        imageUrl={zoomItem?.url || null}
        title={zoomItem?.title}
        onClose={() => setZoomItem(null)}
      />
    </div>
  );
}
