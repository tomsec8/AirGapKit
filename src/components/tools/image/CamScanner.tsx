import React, { useState, useRef, useEffect, useCallback } from 'react';
import * as Icons from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export function CamScanner() {
  const [file, setFile] = useState<File | null>(null);
  const [isPdf, setIsPdf] = useState(false);
  const [imageEl, setImageEl] = useState<HTMLImageElement | null>(null);
  const [pdfProxy, setPdfProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(1);
  
  const [threshold, setThreshold] = useState(140); // 0-255
  const [contrast, setContrast] = useState(1.6); // 1-3
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
  };

  const loadFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setErrorMsg(null);
    const fileName = selectedFile.name.toLowerCase();

    if (fileName.endsWith('.pdf') || selectedFile.type === 'application/pdf') {
      setIsPdf(true);
      setImageEl(null);
      try {
        const buffer = await selectedFile.arrayBuffer();
        const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
        setPdfProxy(doc);
        setNumPages(doc.numPages);
        setPageNum(1);
      } catch (err: any) {
        console.error(err);
        setErrorMsg('Failed to load PDF file.');
      }
    } else if (selectedFile.type.startsWith('image/')) {
      setIsPdf(false);
      setPdfProxy(null);
      const url = URL.createObjectURL(selectedFile);
      const img = new Image();
      img.onload = () => setImageEl(img);
      img.src = url;
    } else {
      setErrorMsg('Please select an Image or PDF file.');
    }
  };

  // Apply contrast & threshold B&W filter to a canvas context
  const applyBwFilterToCanvas = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const factor = (259 * (contrast * 100 + 255)) / (255 * (259 - contrast * 100));

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      let gray = 0.299 * r + 0.587 * g + 0.114 * b;
      gray = factor * (gray - 128) + 128;
      
      if (gray > threshold) {
        gray = 255;
      } else {
        gray = Math.max(0, gray);
      }

      data[i] = gray;
      data[i + 1] = gray;
      data[i + 2] = gray;
    }

    ctx.putImageData(imgData, 0, 0);
  }, [contrast, threshold]);

  // Render current view (Image or active PDF page)
  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (!isPdf && imageEl) {
      canvas.width = imageEl.width;
      canvas.height = imageEl.height;
      ctx.drawImage(imageEl, 0, 0);
      applyBwFilterToCanvas(ctx, canvas.width, canvas.height);
    } else if (isPdf && pdfProxy) {
      let isCancelled = false;
      const renderPdfPage = async () => {
        try {
          const page = await pdfProxy.getPage(pageNum);
          if (isCancelled) return;

          const viewport = page.getViewport({ scale: 1.5 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: ctx, viewport } as any).promise;
          if (isCancelled) return;

          applyBwFilterToCanvas(ctx, canvas.width, canvas.height);
        } catch (err) {
          console.error(err);
        }
      };
      renderPdfPage();
      return () => { isCancelled = true; };
    }
  }, [isPdf, imageEl, pdfProxy, pageNum, applyBwFilterToCanvas]);

  const handleDownload = async () => {
    if (!file || !canvasRef.current) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      if (!isPdf) {
        // Single Image output
        const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.9);
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        await downloadFileWithDialog(blob, `scanned_${file.name.split('.')[0]}.jpg`);
      } else if (pdfProxy) {
        // PDF Output: render & filter ALL pages, then package into new PDF
        const pdfDoc = await PDFDocument.create();
        const offscreenCanvas = document.createElement('canvas');
        const offscreenCtx = offscreenCanvas.getContext('2d')!;

        for (let i = 1; i <= pdfProxy.numPages; i++) {
          const page = await pdfProxy.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });

          offscreenCanvas.width = viewport.width;
          offscreenCanvas.height = viewport.height;

          await page.render({ canvasContext: offscreenCtx, viewport } as any).promise;
          applyBwFilterToCanvas(offscreenCtx, viewport.width, viewport.height);

          const imgDataUrl = offscreenCanvas.toDataURL('image/jpeg', 0.85);
          const imgBytes = await (await fetch(imgDataUrl)).arrayBuffer();
          const embeddedImg = await pdfDoc.embedJpg(imgBytes);

          const newPage = pdfDoc.addPage([embeddedImg.width, embeddedImg.height]);
          newPage.drawImage(embeddedImg, { x: 0, y: 0, width: embeddedImg.width, height: embeddedImg.height });
        }

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
        await downloadFileWithDialog(blob, `scanned_${file.name}`);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Failed to generate scanned document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setImageEl(null);
    setPdfProxy(null);
    setErrorMsg(null);
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Document Scanner Filter (B&W Scan)
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Enhance photos or PDFs into clean, high-contrast B&W document scans offline.
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
          style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '80px 40px', textAlign: 'center', background: '#121214', cursor: 'pointer' }}
          onClick={() => document.getElementById('fileUpload')?.click()}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.Camera size={32} color="#ec4899" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Drop a Photo or PDF Document here
          </div>
          <div style={{ fontSize: '13px', color: '#8e8e93' }}>
            Convert messy document photos or PDFs into crisp black & white scans.
          </div>
          <input 
            id="fileUpload" type="file" accept="image/*,application/pdf" style={{ display: 'none' }} 
            onChange={e => { if (e.target.files?.length) loadFile(e.target.files[0]) }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px', alignItems: 'start' }}>
          
          {/* Main Visual Display */}
          <div style={{ background: '#121214', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', minHeight: '450px' }}>
            {isPdf && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2c2c2e', padding: '4px 12px', borderRadius: '8px', width: 'fit-content' }}>
                <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1} style={{ background: 'transparent', border: 'none', color: pageNum <= 1 ? '#555' : '#ffffff', cursor: pageNum <= 1 ? 'default' : 'pointer', display: 'flex', padding: '4px' }}><Icons.ChevronLeft size={18} /></button>
                <span style={{ fontSize: '13px', color: '#ffffff' }}>Page {pageNum} / {numPages}</span>
                <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum >= numPages} style={{ background: 'transparent', border: 'none', color: pageNum >= numPages ? '#555' : '#ffffff', cursor: pageNum >= numPages ? 'default' : 'pointer', display: 'flex', padding: '4px' }}><Icons.ChevronRight size={18} /></button>
              </div>
            )}

            <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '550px', objectFit: 'contain', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', borderRadius: '4px', background: '#fff' }} />
          </div>

          {/* Controls Side Panel */}
          <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>
              <Icons.FileText size={20} color="#ec4899" />
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '220px' }}>{file.name}</div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '600' }}>Threshold (B&W Cutoff)</label>
                <span style={{ fontSize: '13px', color: '#ec4899', fontWeight: '600' }}>{threshold}</span>
              </div>
              <input 
                type="range" min="50" max="220" value={threshold} 
                onChange={e => setThreshold(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }} 
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '600' }}>Scan Contrast</label>
                <span style={{ fontSize: '13px', color: '#ec4899', fontWeight: '600' }}>{contrast.toFixed(1)}x</span>
              </div>
              <input 
                type="range" min="1" max="2.5" step="0.1" value={contrast} 
                onChange={e => setContrast(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }} 
              />
            </div>

            <div style={{ flexGrow: 1 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={handleDownload} 
                disabled={isProcessing}
                style={{ 
                  padding: '14px', background: '#ec4899', border: 'none', color: '#ffffff', borderRadius: '8px', 
                  cursor: isProcessing ? 'not-allowed' : 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isProcessing ? 0.6 : 1 
                }}
              >
                {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.Download size={18} />}
                {isProcessing ? 'Processing Document...' : isPdf ? 'Download Scanned PDF' : 'Download Scan Image'}
              </button>
              
              <button onClick={handleReset} style={{ padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                Change File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
