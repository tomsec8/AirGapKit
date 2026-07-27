import React, { useState, useEffect, useRef } from 'react';
import * as Icons from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export function PdfViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
      const arrayBuffer = await selectedFile.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setPageNum(1);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Failed to load PDF for viewing.');
      setFile(null);
    }
  };

  useEffect(() => {
    if (pdfDoc && canvasRef.current) {
      renderPage();
    }
  }, [pdfDoc, pageNum, scale]);

  // Keyboard navigation for page flip and Esc for full screen exit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!pdfDoc) return;
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setPageNum(p => Math.min(numPages, p + 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setPageNum(p => Math.max(1, p - 1));
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pdfDoc, numPages, isFullscreen]);

  const renderPage = async () => {
    if (!pdfDoc || !canvasRef.current) return;
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        const renderContext = { canvasContext: ctx, viewport };
        await page.render(renderContext as any).promise;
      }
    } catch (err) {
      console.error('Error rendering page:', err);
    }
  };

  const containerStyle: React.CSSProperties = isFullscreen
    ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        background: '#09090b',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        boxSizing: 'border-box',
      }
    : {
        background: '#1c1c1e',
        borderRadius: '16px',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      };

  return (
    <div style={{ maxWidth: isFullscreen ? '100%' : '1000px', margin: '0 auto', padding: isFullscreen ? '0' : '20px' }}>
      {!isFullscreen && (
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
            PDF Viewer & Reader
          </h1>
          <p style={{ color: '#8e8e93', fontSize: '15px' }}>
            Fast, distraction-free PDF reading experience rendered completely offline.
          </p>
        </div>
      )}

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
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.Eye size={32} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Drop PDF to view
          </div>
          <div style={{ fontSize: '13px', color: '#8e8e93' }}>
            Click or drag a file to open full-screen offline reader.
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
        <div style={containerStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#121214', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '300px' }}>
              <Icons.FileText size={20} color="#f43f5e" />
              <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{file.name}</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2c2c2e', padding: '4px', borderRadius: '8px' }}>
                <button onClick={() => setScale(s => Math.max(0.5, +(s - 0.2).toFixed(1)))} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', padding: '4px' }}><Icons.ZoomOut size={18} /></button>
                <span style={{ fontSize: '13px', color: '#ffffff', minWidth: '40px', textAlign: 'center' }}>{Math.round(scale * 100)}%</span>
                <button onClick={() => setScale(s => Math.min(3, +(s + 0.2).toFixed(1)))} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', display: 'flex', padding: '4px' }}><Icons.ZoomIn size={18} /></button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#2c2c2e', padding: '4px', borderRadius: '8px' }}>
                <button onClick={() => setPageNum(p => Math.max(1, p - 1))} disabled={pageNum <= 1} style={{ background: 'transparent', border: 'none', color: pageNum <= 1 ? '#555' : '#ffffff', cursor: pageNum <= 1 ? 'default' : 'pointer', display: 'flex', padding: '4px' }}><Icons.ChevronLeft size={18} /></button>
                <span style={{ fontSize: '13px', color: '#ffffff', minWidth: '60px', textAlign: 'center' }}>{pageNum} / {numPages}</span>
                <button onClick={() => setPageNum(p => Math.min(numPages, p + 1))} disabled={pageNum >= numPages} style={{ background: 'transparent', border: 'none', color: pageNum >= numPages ? '#555' : '#ffffff', cursor: pageNum >= numPages ? 'default' : 'pointer', display: 'flex', padding: '4px' }}><Icons.ChevronRight size={18} /></button>
              </div>

              <button
                onClick={() => setIsFullscreen(prev => !prev)}
                title={isFullscreen ? 'Exit Fullscreen (Esc)' : 'Fullscreen Mode'}
                style={{
                  background: isFullscreen ? 'rgba(244, 63, 94, 0.2)' : '#2c2c2e',
                  border: isFullscreen ? '1px solid #f43f5e' : 'none',
                  color: isFullscreen ? '#f43f5e' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '600',
                }}
              >
                {isFullscreen ? <Icons.Minimize size={18} /> : <Icons.Maximize size={18} />}
                <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
              </button>
            </div>

            <button onClick={() => { setFile(null); setPdfDoc(null); setIsFullscreen(false); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: '8px' }}>
              <Icons.X size={20} />
            </button>
          </div>

          <div
            ref={containerRef}
            style={{
              background: '#121214',
              borderRadius: isFullscreen ? '0' : '12px',
              overflow: 'auto',
              flex: 1,
              minHeight: isFullscreen ? 'calc(100vh - 100px)' : '600px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '24px',
              border: '1px solid rgba(255,255,255,0.05)',
              boxSizing: 'border-box',
            }}
          >
            <canvas ref={canvasRef} style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.5)', borderRadius: '4px', margin: '0 auto' }} />
          </div>
        </div>
      )}
    </div>
  );
}
