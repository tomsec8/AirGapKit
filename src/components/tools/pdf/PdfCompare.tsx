import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Icons from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';

if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

type Stage = 'select' | 'preview' | 'compare';

// A wrapper to allow mouse drag-to-pan inside the overflow container
const DraggablePanWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, x: 0, y: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    setIsDragging(true);
    setPos({
      left: containerRef.current.scrollLeft,
      top: containerRef.current.scrollTop,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault();
    const dx = e.clientX - pos.x;
    const dy = e.clientY - pos.y;
    containerRef.current.scrollTop = pos.top - dy;
    containerRef.current.scrollLeft = pos.left - dx;
  };

  const onMouseUp = () => setIsDragging(false);

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{
        background: '#121214',
        borderRadius: '12px',
        overflow: 'auto',
        height: 'calc(100vh - 300px)',
        minHeight: '400px',
        width: '100%',
        border: '1px solid rgba(255,255,255,0.05)',
        cursor: isDragging ? 'grabbing' : 'grab',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ margin: 'auto', pointerEvents: 'none' }}>
        {children}
      </div>
    </div>
  );
};

export function PdfCompare() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [doc1, setDoc1] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [doc2, setDoc2] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [stage, setStage] = useState<Stage>('select');

  // Preview thumbnails
  const [thumb1, setThumb1] = useState<string | null>(null);
  const [thumb2, setThumb2] = useState<string | null>(null);

  // Independent states (Start with smaller scale to fit the screen side-by-side)
  const [pageNum1, setPageNum1] = useState(1);
  const [numPages1, setNumPages1] = useState(0);
  const [scale1, setScale1] = useState(0.8);

  const [pageNum2, setPageNum2] = useState(1);
  const [numPages2, setNumPages2] = useState(0);
  const [scale2, setScale2] = useState(0.8);

  const canvas1Ref = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);

  const renderCounter1 = useRef(0);
  const renderCounter2 = useRef(0);

  const generateThumbnail = async (doc: pdfjsLib.PDFDocumentProxy): Promise<string> => {
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport } as any).promise;
    return canvas.toDataURL();
  };

  const loadPdf = async (file: File, isFirst: boolean) => {
    try {
      const buffer = await file.arrayBuffer();
      const doc = await pdfjsLib.getDocument({ data: buffer }).promise;
      const thumbnail = await generateThumbnail(doc);

      if (isFirst) {
        setFile1(file);
        setDoc1(doc);
        setNumPages1(doc.numPages);
        setPageNum1(1);
        setScale1(0.8);
        setThumb1(thumbnail);
      } else {
        setFile2(file);
        setDoc2(doc);
        setNumPages2(doc.numPages);
        setPageNum2(1);
        setScale2(0.8);
        setThumb2(thumbnail);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (file1 && file2 && stage === 'select') {
      setStage('preview');
    }
  }, [file1, file2, stage]);

  const renderPage = useCallback(async (
    doc: pdfjsLib.PDFDocumentProxy | null,
    pageNum: number,
    scale: number,
    canvas: HTMLCanvasElement | null,
    counter: React.MutableRefObject<number>
  ) => {
    if (!doc || !canvas) return;
    const thisRender = ++counter.current;

    try {
      if (pageNum > doc.numPages) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = 400;
          canvas.height = 300;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
      }
      const page = await doc.getPage(pageNum);
      if (thisRender !== counter.current) return;

      const viewport = page.getViewport({ scale });
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: ctx, viewport } as any).promise;
      }
    } catch (err) {
      console.error('Render error:', err);
    }
  }, []);

  useEffect(() => {
    if (stage === 'compare') renderPage(doc1, pageNum1, scale1, canvas1Ref.current, renderCounter1);
  }, [doc1, pageNum1, scale1, stage, renderPage]);

  useEffect(() => {
    if (stage === 'compare') renderPage(doc2, pageNum2, scale2, canvas2Ref.current, renderCounter2);
  }, [doc2, pageNum2, scale2, stage, renderPage]);

  const handleReset = () => {
    setFile1(null);
    setFile2(null);
    setDoc1(null);
    setDoc2(null);
    setThumb1(null);
    setThumb2(null);
    setStage('select');
    setPageNum1(1);
    setPageNum2(1);
    setScale1(0.8);
    setScale2(0.8);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '20px', boxSizing: 'border-box' }}>
      <div style={{ marginBottom: '24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          PDF Compare (Visual)
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Compare two PDF documents side-by-side perfectly synchronized. Drag to pan.
        </p>
      </div>

      {/* ─── STAGE: SELECT FILES ─── */}
      {stage === 'select' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          {/* File 1 */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) loadPdf(e.dataTransfer.files[0], true); }}
            style={{
              border: `2px dashed ${file1 ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '16px', padding: '40px', textAlign: 'center',
              background: file1 ? 'rgba(16, 185, 129, 0.05)' : '#121214',
              cursor: 'pointer', height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => document.getElementById('fileUpload1')?.click()}
          >
            {file1 ? (
              <>
                <Icons.CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>Document 1 Loaded</div>
                <div style={{ fontSize: '14px', color: '#10b981', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file1.name}</div>
              </>
            ) : (
              <>
                <Icons.FileText size={48} color="#06b6d4" style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>Select Document 1</div>
                <div style={{ fontSize: '14px', color: '#8e8e93' }}>Drag & drop or click</div>
              </>
            )}
            <input id="fileUpload1" type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) loadPdf(e.target.files[0], true) }} />
          </div>

          {/* File 2 */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) loadPdf(e.dataTransfer.files[0], false); }}
            style={{
              border: `2px dashed ${file2 ? '#10b981' : 'rgba(255,255,255,0.1)'}`,
              borderRadius: '16px', padding: '40px', textAlign: 'center',
              background: file2 ? 'rgba(16, 185, 129, 0.05)' : '#121214',
              cursor: 'pointer', height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}
            onClick={() => document.getElementById('fileUpload2')?.click()}
          >
            {file2 ? (
              <>
                <Icons.CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>Document 2 Loaded</div>
                <div style={{ fontSize: '14px', color: '#10b981', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file2.name}</div>
              </>
            ) : (
              <>
                <Icons.FileText size={48} color="#a855f7" style={{ marginBottom: '16px' }} />
                <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>Select Document 2</div>
                <div style={{ fontSize: '14px', color: '#8e8e93' }}>Drag & drop or click</div>
              </>
            )}
            <input id="fileUpload2" type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) loadPdf(e.target.files[0], false) }} />
          </div>
        </div>
      )}

      {/* ─── STAGE: PREVIEW ─── */}
      {stage === 'preview' && (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px', marginBottom: '32px' }}>
            {/* Preview Card 1 */}
            <div style={{ background: '#121214', borderRadius: '12px', padding: '20px', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '8px', borderRadius: '8px' }}><Icons.FileText size={20} color="#06b6d4" /></div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file1?.name}</div>
                    <div style={{ fontSize: '12px', color: '#8e8e93' }}>{numPages1} pages</div>
                  </div>
                </div>
                <button onClick={() => { setFile1(null); setDoc1(null); setThumb1(null); setStage('select'); }} style={{ background: 'transparent', border: 'none', color: '#8e8e93', cursor: 'pointer', padding: '4px' }}><Icons.X size={18} /></button>
              </div>
              {thumb1 && (
                <div style={{ display: 'flex', justifyContent: 'center', background: '#0a0a0c', borderRadius: '8px', padding: '16px' }}>
                  <img src={thumb1} alt="Preview 1" style={{ maxHeight: '250px', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
                </div>
              )}
            </div>

            {/* Preview Card 2 */}
            <div style={{ background: '#121214', borderRadius: '12px', padding: '20px', border: '1px solid rgba(168, 85, 247, 0.3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ background: 'rgba(168, 85, 247, 0.15)', padding: '8px', borderRadius: '8px' }}><Icons.FileText size={20} color="#a855f7" /></div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file2?.name}</div>
                    <div style={{ fontSize: '12px', color: '#8e8e93' }}>{numPages2} pages</div>
                  </div>
                </div>
                <button onClick={() => { setFile2(null); setDoc2(null); setThumb2(null); setStage('select'); }} style={{ background: 'transparent', border: 'none', color: '#8e8e93', cursor: 'pointer', padding: '4px' }}><Icons.X size={18} /></button>
              </div>
              {thumb2 && (
                <div style={{ display: 'flex', justifyContent: 'center', background: '#0a0a0c', borderRadius: '8px', padding: '16px' }}>
                  <img src={thumb2} alt="Preview 2" style={{ maxHeight: '250px', borderRadius: '4px', boxShadow: '0 4px 20px rgba(0,0,0,0.5)' }} />
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setStage('compare')}
            style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #06b6d4, #a855f7)', color: '#ffffff', fontSize: '16px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 20px rgba(168, 85, 247, 0.3)' }}
          >
            <Icons.GitCompareArrows size={22} /> Compare Documents
          </button>
        </div>
      )}

      {/* ─── STAGE: COMPARE ─── */}
      {stage === 'compare' && (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', width: '100%', boxSizing: 'border-box' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', width: '100%' }}>
            {/* ─ Document 1 Panel ─ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#121214', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                <div style={{ fontSize: '13px', color: '#06b6d4', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                  {file1?.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#2c2c2e', padding: '3px', borderRadius: '6px' }}>
                    <button onClick={() => setScale1(s => Math.max(0.3, +(s - 0.2).toFixed(1)))} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '3px', display: 'flex' }}><Icons.ZoomOut size={14} /></button>
                    <span style={{ fontSize: '11px', color: '#ffffff', minWidth: '32px', textAlign: 'center' }}>{Math.round(scale1 * 100)}%</span>
                    <button onClick={() => setScale1(s => Math.min(3, +(s + 0.2).toFixed(1)))} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '3px', display: 'flex' }}><Icons.ZoomIn size={14} /></button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#2c2c2e', padding: '3px', borderRadius: '6px' }}>
                    <button onClick={() => setPageNum1(p => Math.max(1, p - 1))} disabled={pageNum1 <= 1} style={{ background: 'transparent', border: 'none', color: pageNum1 <= 1 ? '#555' : '#fff', cursor: pageNum1 <= 1 ? 'default' : 'pointer', padding: '3px', display: 'flex' }}><Icons.ChevronLeft size={14} /></button>
                    <span style={{ fontSize: '11px', color: '#ffffff', minWidth: '36px', textAlign: 'center' }}>{pageNum1}/{numPages1}</span>
                    <button onClick={() => setPageNum1(p => Math.min(numPages1, p + 1))} disabled={pageNum1 >= numPages1} style={{ background: 'transparent', border: 'none', color: pageNum1 >= numPages1 ? '#555' : '#fff', cursor: pageNum1 >= numPages1 ? 'default' : 'pointer', padding: '3px', display: 'flex' }}><Icons.ChevronRight size={14} /></button>
                  </div>
                </div>
              </div>
              <DraggablePanWrapper>
                <canvas ref={canvas1Ref} style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.5)', borderRadius: '4px', display: 'block' }} />
              </DraggablePanWrapper>
            </div>

            {/* ─ Document 2 Panel ─ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#121214', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(168, 85, 247, 0.2)' }}>
                <div style={{ fontSize: '13px', color: '#a855f7', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
                  {file2?.name}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#2c2c2e', padding: '3px', borderRadius: '6px' }}>
                    <button onClick={() => setScale2(s => Math.max(0.3, +(s - 0.2).toFixed(1)))} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '3px', display: 'flex' }}><Icons.ZoomOut size={14} /></button>
                    <span style={{ fontSize: '11px', color: '#ffffff', minWidth: '32px', textAlign: 'center' }}>{Math.round(scale2 * 100)}%</span>
                    <button onClick={() => setScale2(s => Math.min(3, +(s + 0.2).toFixed(1)))} style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '3px', display: 'flex' }}><Icons.ZoomIn size={14} /></button>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', background: '#2c2c2e', padding: '3px', borderRadius: '6px' }}>
                    <button onClick={() => setPageNum2(p => Math.max(1, p - 1))} disabled={pageNum2 <= 1} style={{ background: 'transparent', border: 'none', color: pageNum2 <= 1 ? '#555' : '#fff', cursor: pageNum2 <= 1 ? 'default' : 'pointer', padding: '3px', display: 'flex' }}><Icons.ChevronLeft size={14} /></button>
                    <span style={{ fontSize: '11px', color: '#ffffff', minWidth: '36px', textAlign: 'center' }}>{pageNum2}/{numPages2}</span>
                    <button onClick={() => setPageNum2(p => Math.min(numPages2, p + 1))} disabled={pageNum2 >= numPages2} style={{ background: 'transparent', border: 'none', color: pageNum2 >= numPages2 ? '#555' : '#fff', cursor: pageNum2 >= numPages2 ? 'default' : 'pointer', padding: '3px', display: 'flex' }}><Icons.ChevronRight size={14} /></button>
                  </div>
                </div>
              </div>
              <DraggablePanWrapper>
                <canvas ref={canvas2Ref} style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.5)', borderRadius: '4px', display: 'block' }} />
              </DraggablePanWrapper>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={() => setStage('preview')}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.15)', color: '#ffffff', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
            >
              <Icons.ArrowLeft size={16} /> Back to Preview
            </button>
            <button
              onClick={handleReset}
              style={{ background: 'transparent', border: '1px solid #ef4444', color: '#ef4444', cursor: 'pointer', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}
            >
              <Icons.RefreshCw size={16} /> Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
