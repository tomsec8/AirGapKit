import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

interface PageCropSetting {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function CropPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDocProxy, setPdfDocProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Map of page number (1-based) to crop settings (%)
  const [pageCrops, setPageCrops] = useState<Record<number, PageCropSetting>>({});

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get crop setting for current page (defaults to 5% if not set)
  const currentCrop = pageCrops[pageNum] || { top: 5, bottom: 5, left: 5, right: 5 };

  const updateCurrentCrop = (field: keyof PageCropSetting, value: number) => {
    setPageCrops(prev => ({
      ...prev,
      [pageNum]: {
        ...(prev[pageNum] || { top: 5, bottom: 5, left: 5, right: 5 }),
        [field]: value
      }
    }));
  };

  const applyCurrentToAllPages = () => {
    const updated: Record<number, PageCropSetting> = {};
    for (let i = 1; i <= numPages; i++) {
      updated[i] = { ...currentCrop };
    }
    setPageCrops(updated);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (e.dataTransfer.files.length && (e.dataTransfer.files[0].type === 'application/pdf' || e.dataTransfer.files[0].name.toLowerCase().endsWith('.pdf'))) {
      loadPdf(e.dataTransfer.files[0]);
    }
  };

  const loadPdf = async (selectedFile: File) => {
    try {
      setFile(selectedFile);
      setErrorMsg(null);
      const buffer = await selectedFile.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
      setPdfDocProxy(doc);
      setNumPages(doc.numPages);
      setPageNum(1);
      
      // Initialize default 5% crop for all pages
      const initialCrops: Record<number, PageCropSetting> = {};
      for (let i = 1; i <= doc.numPages; i++) {
        initialCrops[i] = { top: 5, bottom: 5, left: 5, right: 5 };
      }
      setPageCrops(initialCrops);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Failed to load PDF for cropping.');
      setFile(null);
    }
  };

  // Render selected page preview canvas
  useEffect(() => {
    if (!pdfDocProxy || !canvasRef.current) return;
    let isCancelled = false;

    const renderPreview = async () => {
      try {
        const page = await pdfDocProxy.getPage(pageNum);
        if (isCancelled) return;
        
        // Render at scale that fits 450px width max
        const unscaledViewport = page.getViewport({ scale: 1.0 });
        const scale = Math.min(450 / unscaledViewport.width, 500 / unscaledViewport.height);
        const viewport = page.getViewport({ scale });

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: ctx, viewport } as any).promise;
        }
      } catch (err) {
        console.error('Error rendering crop preview:', err);
      }
    };

    renderPreview();
    return () => { isCancelled = true; };
  }, [pdfDocProxy, pageNum]);

  const handleCrop = async () => {
    if (!file) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const buffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const pages = pdfDoc.getPages();

      pages.forEach((page, idx) => {
        const pNum = idx + 1;
        const crop = pageCrops[pNum] || { top: 0, bottom: 0, left: 0, right: 0 };
        const { width, height } = page.getSize();

        // Calculate offsets from percentages
        const leftPts = (crop.left / 100) * width;
        const rightPts = (crop.right / 100) * width;
        const topPts = (crop.top / 100) * height;
        const bottomPts = (crop.bottom / 100) * height;

        // pdf-lib coordinate space: (0,0) is BOTTOM-LEFT
        const newX = leftPts;
        const newY = bottomPts;
        const newWidth = Math.max(10, width - leftPts - rightPts);
        const newHeight = Math.max(10, height - topPts - bottomPts);

        page.setCropBox(newX, newY, newWidth, newHeight);
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      await downloadFileWithDialog(blob, `cropped_${file.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Failed to crop PDF.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetCurrentCrop = () => {
    setPageCrops(prev => ({
      ...prev,
      [pageNum]: { top: 0, bottom: 0, left: 0, right: 0 }
    }));
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Crop PDF (Visual Trim)
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Visually preview and remove unwanted outer margins per page or across the whole document.
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
            <Icons.Crop size={32} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Drop PDF here for visual cropping
          </div>
          <div style={{ fontSize: '13px', color: '#8e8e93' }}>
            Per-page customizable crop margins with live preview.
          </div>
          <input 
            id="fileUpload" 
            type="file" 
            accept="application/pdf" 
            style={{ display: 'none' }} 
            onChange={e => { if (e.target.files?.[0]) loadPdf(e.target.files[0]); }}
          />
        </div>
      ) : (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#121214', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
              <Icons.FileText size={20} color="#f43f5e" />
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '250px' }}>{file.name}</div>
            </div>

            {/* Page Navigation Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2c2c2e', padding: '4px 8px', borderRadius: '8px' }}>
              <button 
                onClick={() => setPageNum(p => Math.max(1, p - 1))} 
                disabled={pageNum <= 1} 
                style={{ background: 'transparent', border: 'none', color: pageNum <= 1 ? '#555' : '#ffffff', cursor: pageNum <= 1 ? 'default' : 'pointer', display: 'flex', padding: '4px' }}
              >
                <Icons.ChevronLeft size={18} />
              </button>
              <span style={{ fontSize: '13px', color: '#ffffff', minWidth: '60px', textAlign: 'center' }}>Page {pageNum} / {numPages}</span>
              <button 
                onClick={() => setPageNum(p => Math.min(numPages, p + 1))} 
                disabled={pageNum >= numPages} 
                style={{ background: 'transparent', border: 'none', color: pageNum >= numPages ? '#555' : '#ffffff', cursor: pageNum >= numPages ? 'default' : 'pointer', display: 'flex', padding: '4px' }}
              >
                <Icons.ChevronRight size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button 
                onClick={resetCurrentCrop}
                style={{ background: 'rgba(255,255,255,0.05)', border: 'none', color: '#8e8e93', borderRadius: '8px', cursor: 'pointer', padding: '8px 12px', fontSize: '13px' }}
              >
                Reset Page
              </button>
              <button 
                onClick={() => { setFile(null); setPdfDocProxy(null); setErrorMsg(null); setPageCrops({}); }} 
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', padding: '8px 12px', fontSize: '13px' }}
              >
                Change PDF
              </button>
            </div>
          </div>

          {/* Grid Layout: Visual Preview (Left) + Sliders (Right) */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
            
            {/* Visual Canvas Container */}
            <div style={{ background: '#121214', borderRadius: '12px', padding: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', border: '1px solid rgba(255,255,255,0.05)', minHeight: '400px' }}>
              <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', borderRadius: '4px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
                <canvas ref={canvasRef} style={{ display: 'block' }} />

                {/* Dark Mask Overlays for Cropped Areas */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${currentCrop.top}%`, background: 'rgba(0, 0, 0, 0.65)', borderBottom: '1px dashed #f43f5e', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${currentCrop.bottom}%`, background: 'rgba(0, 0, 0, 0.65)', borderTop: '1px dashed #f43f5e', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: `${currentCrop.top}%`, bottom: `${currentCrop.bottom}%`, left: 0, width: `${currentCrop.left}%`, background: 'rgba(0, 0, 0, 0.65)', borderRight: '1px dashed #f43f5e', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', top: `${currentCrop.top}%`, bottom: `${currentCrop.bottom}%`, right: 0, width: `${currentCrop.right}%`, background: 'rgba(0, 0, 0, 0.65)', borderLeft: '1px dashed #f43f5e', pointerEvents: 'none' }} />

                {/* Active Uncropped Box Label */}
                <div style={{
                  position: 'absolute',
                  top: `${currentCrop.top}%`,
                  left: `${currentCrop.left}%`,
                  right: `${currentCrop.right}%`,
                  bottom: `${currentCrop.bottom}%`,
                  border: '2px solid #f43f5e',
                  boxSizing: 'border-box',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ background: '#f43f5e', color: '#ffffff', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                    Page {pageNum} Keep Zone
                  </span>
                </div>
              </div>
            </div>

            {/* Sliders Controls */}
            <div style={{ background: '#121214', borderRadius: '12px', padding: '20px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Page {pageNum} Margins (%)
                </div>
              </div>

              {/* Top */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8e8e93', marginBottom: '6px' }}>
                  <span>Top Trim</span>
                  <span style={{ color: '#f43f5e', fontWeight: '600' }}>{currentCrop.top}%</span>
                </div>
                <input 
                  type="range" min="0" max="45" value={currentCrop.top} 
                  onChange={e => updateCurrentCrop('top', Number(e.target.value))} 
                  style={{ width: '100%', accentColor: '#f43f5e', cursor: 'pointer' }} 
                />
              </div>

              {/* Bottom */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8e8e93', marginBottom: '6px' }}>
                  <span>Bottom Trim</span>
                  <span style={{ color: '#f43f5e', fontWeight: '600' }}>{currentCrop.bottom}%</span>
                </div>
                <input 
                  type="range" min="0" max="45" value={currentCrop.bottom} 
                  onChange={e => updateCurrentCrop('bottom', Number(e.target.value))} 
                  style={{ width: '100%', accentColor: '#f43f5e', cursor: 'pointer' }} 
                />
              </div>

              {/* Left */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8e8e93', marginBottom: '6px' }}>
                  <span>Left Trim</span>
                  <span style={{ color: '#f43f5e', fontWeight: '600' }}>{currentCrop.left}%</span>
                </div>
                <input 
                  type="range" min="0" max="45" value={currentCrop.left} 
                  onChange={e => updateCurrentCrop('left', Number(e.target.value))} 
                  style={{ width: '100%', accentColor: '#f43f5e', cursor: 'pointer' }} 
                />
              </div>

              {/* Right */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#8e8e93', marginBottom: '6px' }}>
                  <span>Right Trim</span>
                  <span style={{ color: '#f43f5e', fontWeight: '600' }}>{currentCrop.right}%</span>
                </div>
                <input 
                  type="range" min="0" max="45" value={currentCrop.right} 
                  onChange={e => updateCurrentCrop('right', Number(e.target.value))} 
                  style={{ width: '100%', accentColor: '#f43f5e', cursor: 'pointer' }} 
                />
              </div>

              {/* Apply to all button */}
              <button
                onClick={applyCurrentToAllPages}
                style={{
                  padding: '10px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px dashed rgba(244, 63, 94, 0.4)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '4px'
                }}
              >
                <Icons.Copy size={14} color="#f43f5e" />
                Apply Page {pageNum} Margins to All Pages
              </button>

              <button
                onClick={handleCrop}
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
                  marginTop: '4px',
                  opacity: isProcessing ? 0.6 : 1
                }}
              >
                {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.Crop size={18} />}
                {isProcessing ? 'Cropping PDF...' : 'Apply Crop & Download'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
