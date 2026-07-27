import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { saveAs } from 'file-saver';
import { PDFDocument, degrees } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker to local bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PageItem {
  id: string;
  originalIndex: number;
  rotation: number;
  thumbnailUrl: string;
  isExcluded?: boolean;
}

export function PdfPageManager() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState<string>('');
  const [pdfDocBytes, setPdfDocBytes] = useState<ArrayBuffer | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Enlarged preview modal state
  const [previewItem, setPreviewItem] = useState<PageItem | null>(null);

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

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length && (e.dataTransfer.files[0].type === 'application/pdf' || e.dataTransfer.files[0].name.toLowerCase().endsWith('.pdf'))) {
      await loadPdf(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length && (e.target.files[0].type === 'application/pdf' || e.target.files[0].name.toLowerCase().endsWith('.pdf'))) {
      await loadPdf(e.target.files[0]);
    }
  };

  const loadPdf = async (selectedFile: File) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setLoadingProgress('Reading PDF file...');

      const buffer = await selectedFile.arrayBuffer();
      const dataTypedArray = new Uint8Array(buffer.slice(0));

      const pdf = await pdfjsLib.getDocument({
        data: dataTypedArray,
        disableRange: true,
        disableStream: true,
        disableAutoFetch: true,
        stopAtErrors: false,
        verbosity: 0
      }).promise;

      const pageCount = pdf.numPages;
      const newPages: PageItem[] = [];

      for (let i = 1; i <= pageCount; i++) {
        setLoadingProgress(`Rendering page thumbnail ${i} of ${pageCount}...`);
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 0.6 }); // Crisp thumbnail scale
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        let thumbnailUrl = '';
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport } as any).promise;
          thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
        }

        newPages.push({
          id: `page_${i - 1}_${Math.random().toString(36).substring(2, 7)}`,
          originalIndex: i - 1,
          rotation: 0,
          thumbnailUrl,
          isExcluded: false
        });
      }

      setFile(selectedFile);
      setPages(newPages);
      setPdfDocBytes(buffer);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Failed to load PDF: ${err?.message || 'Invalid or corrupted PDF file'}`);
    } finally {
      setIsProcessing(false);
      setLoadingProgress('');
    }
  };

  const rotatePage = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p));
    if (previewItem && previewItem.id === id) {
      setPreviewItem(prev => prev ? { ...prev, rotation: (prev.rotation + 90) % 360 } : null);
    }
  };

  const toggleExcludePage = (id: string) => {
    setPages(prev => prev.map(p => p.id === id ? { ...p, isExcluded: !p.isExcluded } : p));
    if (previewItem && previewItem.id === id) {
      setPreviewItem(prev => prev ? { ...prev, isExcluded: !prev.isExcluded } : null);
    }
  };

  const moveLeft = (index: number) => {
    if (index === 0) return;
    setPages(prev => {
      const arr = [...prev];
      const temp = arr[index];
      arr[index] = arr[index - 1];
      arr[index - 1] = temp;
      return arr;
    });
  };

  const moveRight = (index: number) => {
    if (index === pages.length - 1) return;
    setPages(prev => {
      const arr = [...prev];
      const temp = arr[index];
      arr[index] = arr[index + 1];
      arr[index + 1] = temp;
      return arr;
    });
  };

  const activePages = pages.filter(p => !p.isExcluded);

  const handleExport = async () => {
    if (!pdfDocBytes || activePages.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const sourcePdf = await PDFDocument.load(pdfDocBytes, { ignoreEncryption: true, throwOnInvalidObject: false } as any);
      const newPdf = await PDFDocument.create();

      for (const pageItem of activePages) {
        const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageItem.originalIndex]);
        if (pageItem.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees(currentRotation + pageItem.rotation));
        }
        newPdf.addPage(copiedPage);
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      await saveFileWithPicker(blob, `edited_${file?.name || 'document.pdf'}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Error exporting PDF: ${err?.message || 'Failed to save PDF'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          PDF Page Manager
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Visually split, reorder, rotate, and soft-delete/restore pages with live preview modal 100% offline.
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
            padding: '80px 40px',
            textAlign: 'center',
            background: '#121214',
            marginBottom: '24px',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('fileUpload')?.click()}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.Grid size={32} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Select or Drop PDF File to Manage Pages
          </div>
          <div style={{ fontSize: '13px', color: '#8e8e93' }}>
            Click thumbnails to enlarge, drag/reorder, rotate, or exclude/restore pages.
          </div>
          <input 
            id="fileUpload" 
            type="file" 
            accept="application/pdf" 
            style={{ display: 'none' }} 
            onChange={handleFileSelect}
          />
        </div>
      ) : (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icons.FileText size={24} color="#f43f5e" />
              <div>
                <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>{file.name}</div>
                <div style={{ fontSize: '13px', color: '#8e8e93' }}>
                  {activePages.length} active pages ({pages.length - activePages.length} excluded)
                </div>
              </div>
            </div>
            <button 
              onClick={() => { setFile(null); setPages([]); setPdfDocBytes(null); }} 
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', padding: '8px 16px', fontSize: '13px' }}
            >
              Select Another PDF
            </button>
          </div>

          {loadingProgress ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#8e8e93', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <Icons.Loader2 size={20} className="animate-spin" color="#f43f5e" />
              {loadingProgress}
            </div>
          ) : (
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', 
              gap: '20px', 
              marginBottom: '32px',
              maxHeight: '560px',
              overflowY: 'auto',
              padding: '6px'
            }}>
              {pages.map((p, idx) => {
                const isExcluded = p.isExcluded;

                return (
                  <div 
                    key={p.id} 
                    style={{ 
                      background: isExcluded ? '#19191b' : '#2c2c2e', 
                      borderRadius: '12px', 
                      padding: '12px', 
                      position: 'relative', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      alignItems: 'center', 
                      border: isExcluded ? '1px dashed rgba(239, 68, 68, 0.4)' : '1px solid rgba(255,255,255,0.05)',
                      opacity: isExcluded ? 0.45 : 1,
                      transition: 'all 0.2s'
                    }}
                  >
                    {/* Toggle Exclude / Delete Button */}
                    <button 
                      onClick={() => toggleExcludePage(p.id)} 
                      title={isExcluded ? "Restore page" : "Exclude page"}
                      style={{ 
                        position: 'absolute', 
                        top: '8px', 
                        right: '8px', 
                        background: isExcluded ? '#10b981' : 'rgba(0,0,0,0.7)', 
                        border: 'none', 
                        color: '#ffffff', 
                        borderRadius: '50%', 
                        width: '26px', 
                        height: '26px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        cursor: 'pointer', 
                        zIndex: 10 
                      }}
                    >
                      {isExcluded ? <Icons.RotateCcw size={14} /> : <Icons.X size={14} />}
                    </button>

                    {/* Thumbnail Image (Click to Enlarge) */}
                    <div 
                      onClick={() => setPreviewItem(p)}
                      title="Click to enlarge preview"
                      style={{
                        width: '100%',
                        height: '210px',
                        background: '#121214',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '12px',
                        overflow: 'hidden',
                        position: 'relative',
                        padding: '8px',
                        cursor: 'zoom-in'
                      }}
                    >
                      {p.thumbnailUrl ? (
                        <img 
                          src={p.thumbnailUrl} 
                          alt={`Page ${p.originalIndex + 1}`} 
                          style={{ 
                            maxWidth: p.rotation % 180 !== 0 ? '160px' : '100%', 
                            maxHeight: p.rotation % 180 !== 0 ? '160px' : '100%', 
                            objectFit: 'contain',
                            borderRadius: '4px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            transition: 'all 0.3s ease',
                            transform: `rotate(${p.rotation}deg)` 
                          }} 
                        />
                      ) : (
                        <div style={{ color: '#8e8e93', fontSize: '12px' }}>Page {p.originalIndex + 1}</div>
                      )}

                      {isExcluded && (
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fca5a5', fontWeight: '700', fontSize: '13px' }}>
                          Excluded
                        </div>
                      )}
                    </div>
                    
                    {/* Controls Footer */}
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <button onClick={() => moveLeft(idx)} disabled={idx === 0} style={{ background: '#1c1c1e', border: 'none', color: idx === 0 ? '#48484a' : '#ffffff', borderRadius: '6px', padding: '6px', cursor: idx === 0 ? 'default' : 'pointer' }}><Icons.ChevronLeft size={16} /></button>
                      
                      <span style={{ fontSize: '12px', fontWeight: '700', color: isExcluded ? '#8e8e93' : '#ffffff', textDecoration: isExcluded ? 'line-through' : 'none' }}>
                        Page {p.originalIndex + 1}
                      </span>

                      <button onClick={() => rotatePage(p.id)} style={{ background: '#1c1c1e', border: 'none', color: '#f43f5e', borderRadius: '6px', padding: '6px', cursor: 'pointer' }} title="Rotate 90°"><Icons.RotateCw size={16} /></button>
                      <button onClick={() => moveRight(idx)} disabled={idx === pages.length - 1} style={{ background: '#1c1c1e', border: 'none', color: idx === pages.length - 1 ? '#48484a' : '#ffffff', borderRadius: '6px', padding: '6px', cursor: idx === pages.length - 1 ? 'default' : 'pointer' }}><Icons.ChevronRight size={16} /></button>
                    </div>

                    {isExcluded && (
                      <button 
                        onClick={() => toggleExcludePage(p.id)}
                        style={{ marginTop: '8px', width: '100%', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', borderRadius: '6px', padding: '4px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                      >
                        <Icons.RotateCcw size={12} /> Restore Page
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={isProcessing || activePages.length === 0}
            style={{ 
              width: '100%',
              padding: '14px', 
              background: activePages.length === 0 ? '#48484a' : '#f43f5e', 
              border: 'none', 
              color: '#ffffff', 
              borderRadius: '10px', 
              cursor: isProcessing || activePages.length === 0 ? 'not-allowed' : 'pointer', 
              fontWeight: '700',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.Download size={18} />}
            {isProcessing ? 'Exporting PDF Document...' : `Export Modified PDF (${activePages.length} Active Pages)`}
          </button>
        </div>
      )}

      {/* Enlarged Page Zoom Modal */}
      {previewItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '24px'
        }}>
          <div style={{
            background: '#1c1c1e',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '650px',
            width: '100%',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 25px 50px rgba(0,0,0,0.9)',
            position: 'relative'
          }}>
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff' }}>
                Page {previewItem.originalIndex + 1} Preview
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => rotatePage(previewItem.id)}
                  style={{ background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', color: '#f43f5e', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}
                >
                  <Icons.RotateCw size={14} /> Rotate
                </button>
                
                <button
                  onClick={() => toggleExcludePage(previewItem.id)}
                  style={{ background: previewItem.isExcluded ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', border: previewItem.isExcluded ? '1px solid #10b981' : '1px solid #ef4444', color: previewItem.isExcluded ? '#6ee7b7' : '#fca5a5', padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}
                >
                  {previewItem.isExcluded ? <Icons.RotateCcw size={14} /> : <Icons.X size={14} />}
                  {previewItem.isExcluded ? 'Restore Page' : 'Exclude Page'}
                </button>

                <button
                  onClick={() => setPreviewItem(null)}
                  style={{ background: '#2c2c2e', border: 'none', color: '#ffffff', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <Icons.X size={18} />
                </button>
              </div>
            </div>

            <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: '380px', padding: '16px', background: '#121214', borderRadius: '12px' }}>
              <img 
                src={previewItem.thumbnailUrl} 
                alt={`Page ${previewItem.originalIndex + 1}`} 
                style={{ 
                  maxWidth: previewItem.rotation % 180 !== 0 ? '55vh' : '100%', 
                  maxHeight: previewItem.rotation % 180 !== 0 ? '70vw' : '65vh', 
                  objectFit: 'contain',
                  borderRadius: '6px',
                  boxShadow: '0 8px 30px rgba(0,0,0,0.6)',
                  transition: 'all 0.3s ease',
                  transform: `rotate(${previewItem.rotation}deg)` 
                }} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
