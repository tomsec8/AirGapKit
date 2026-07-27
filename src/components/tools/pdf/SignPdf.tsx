import React, { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { saveAs } from 'file-saver';
import { PDFDocument, rgb } from 'pdf-lib';
import { downloadFileWithDialog } from '../../../utils/fileSaver';
import { sanitizeUrl } from '../../../utils/sanitize';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker to local bundled worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface PlacedStamp {
  id: string;
  page: number;
  dataUrl: string;
  xPct: number;
  yPct: number;
  scalePct: number;
  title: string;
}

interface SavedSignature {
  id: string;
  title: string;
  dataUrl: string;
  createdAt: number;
}

export function SignPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDocBytes, setPdfDocBytes] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Multi-stamp placement list
  const [placedStamps, setPlacedStamps] = useState<PlacedStamp[]>([]);
  const [selectedStampId, setSelectedStampId] = useState<string | null>(null);

  // Saved Signatures in LocalStorage
  const [savedSigs, setSavedSigs] = useState<SavedSignature[]>(() => {
    try {
      const stored = localStorage.getItem('airgap_saved_signatures');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  });

  // Creation Mode: 'draw' | 'type' | 'upload' | 'composite' | 'saved'
  const [sigMode, setSigMode] = useState<'draw' | 'type' | 'upload' | 'composite' | 'saved'>('draw');
  const [typedName, setTypedName] = useState<string>('');
  const [strokeColor, setStrokeColor] = useState<string>('#000000');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [signatureTitle, setSignatureTitle] = useState<string>('My Signature');

  // Composite Mode Background Image
  const [compositeBgUrl, setCompositeBgUrl] = useState<string | null>(null);

  // Drawing Canvas Ref
  const drawCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // PDF Page Viewer Canvas Ref
  const pageCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfContainerRef = useRef<HTMLDivElement | null>(null);

  // Dragging state for stamps
  const [draggingStampId, setDraggingStampId] = useState<string | null>(null);

  // Save signatures to localStorage
  const saveSignatureToGallery = () => {
    if (!signatureDataUrl) return;
    const newSaved: SavedSignature = {
      id: `sig_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      title: signatureTitle.trim() || `Signature ${savedSigs.length + 1}`,
      dataUrl: signatureDataUrl,
      createdAt: Date.now()
    };
    const updated = [newSaved, ...savedSigs];
    setSavedSigs(updated);
    try {
      localStorage.setItem('airgap_saved_signatures', JSON.stringify(updated));
    } catch (e) {}
  };

  const deleteSavedSignature = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedSigs.filter(s => s.id !== id);
    setSavedSigs(updated);
    try {
      localStorage.setItem('airgap_saved_signatures', JSON.stringify(updated));
    } catch (e) {}
  };

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

  // Load PDF file
  const loadPdf = async (selectedFile: File) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);

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

      setNumPages(pdf.numPages);
      setCurrentPage(1);
      setFile(selectedFile);
      setPdfDocBytes(buffer);
      setPlacedStamps([]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Failed to load PDF: ${err?.message || 'Invalid or corrupted PDF file'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Track the actual displayed canvas dimensions for precise stamp overlay
  const [canvasDisplaySize, setCanvasDisplaySize] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  // Render current PDF page on canvas, scaled to fill the container
  useEffect(() => {
    if (!pdfDocBytes || !pageCanvasRef.current || currentPage < 1) return;

    let isMounted = true;
    const renderPage = async () => {
      try {
        const dataTypedArray = new Uint8Array(pdfDocBytes.slice(0));
        const pdf = await pdfjsLib.getDocument({
          data: dataTypedArray,
          disableRange: true,
          disableStream: true,
          disableAutoFetch: true,
          stopAtErrors: false,
          verbosity: 0
        }).promise;

        const page = await pdf.getPage(currentPage);
        const baseViewport = page.getViewport({ scale: 1 });

        // Determine target width from the wrapper container
        const wrapper = pageWrapperRef.current;
        const containerWidth = wrapper ? wrapper.parentElement?.clientWidth || 600 : 600;
        const targetWidth = containerWidth - 8; // small margin
        const scale = targetWidth / baseViewport.width;
        const viewport = page.getViewport({ scale });

        const canvas = pageCanvasRef.current;
        if (!canvas || !isMounted) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;
        // Set CSS size to exactly match pixel size (no scaling mismatch)
        canvas.style.width = `${viewport.width}px`;
        canvas.style.height = `${viewport.height}px`;

        if (isMounted) {
          setCanvasDisplaySize({ w: viewport.width, h: viewport.height });
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport } as any).promise;
        }
      } catch (e) {
        console.warn('Page render error:', e);
      }
    };

    renderPage();

    return () => { isMounted = false; };
  }, [pdfDocBytes, currentPage]);

  // Redraw Drawing Canvas (handles composite mode background rendering too)
  const redrawCanvasWithBg = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (sigMode === 'composite' && compositeBgUrl) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setSignatureDataUrl(canvas.toDataURL('image/png'));
      };
      img.src = compositeBgUrl;
    }
  };

  useEffect(() => {
    if (sigMode === 'composite') {
      redrawCanvasWithBg();
    }
  }, [compositeBgUrl, sigMode]);

  // Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    captureSignature();
  };

  const clearDrawing = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (sigMode === 'composite' && compositeBgUrl) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setSignatureDataUrl(canvas.toDataURL('image/png'));
        };
        img.src = compositeBgUrl;
        return;
      }
    }
    setSignatureDataUrl(null);
  };

  const captureSignature = () => {
    const canvas = drawCanvasRef.current;
    if (!canvas) return;
    setSignatureDataUrl(canvas.toDataURL('image/png'));
  };

  // Typed signature generator
  useEffect(() => {
    if (sigMode === 'type') {
      if (!typedName.trim()) {
        setSignatureDataUrl(null);
        return;
      }
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 400;
      tempCanvas.height = 120;
      const ctx = tempCanvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, 400, 120);
        ctx.font = 'italic 46px "Dancing Script", "Brush Script MT", "Caveat", cursive';
        ctx.fillStyle = strokeColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(typedName, 200, 60);
        setSignatureDataUrl(tempCanvas.toDataURL('image/png'));
      }
    }
  }, [typedName, strokeColor, sigMode]);

  // Upload signature
  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imgFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSignatureDataUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(imgFile);
    }
  };

  // Composite background image upload
  const handleCompositeBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const imgFile = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCompositeBgUrl(event.target.result as string);
        }
      };
      reader.readAsDataURL(imgFile);
    }
  };

  // Add signature as a new stamp to current PDF page
  const addCurrentSignatureToPage = () => {
    if (!signatureDataUrl) return;
    const newStamp: PlacedStamp = {
      id: `stamp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      page: currentPage,
      dataUrl: signatureDataUrl,
      xPct: 50,
      yPct: 75,
      scalePct: 25,
      title: signatureTitle.trim() || `Stamp ${placedStamps.length + 1}`
    };
    setPlacedStamps(prev => [...prev, newStamp]);
    setSelectedStampId(newStamp.id);
  };

  // PDF Page Viewer Wrapper Ref (tightly wraps canvas)
  const pageWrapperRef = useRef<HTMLDivElement | null>(null);

  // Dragging stamps on PDF Viewer
  const handlePdfContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (draggingStampId || !selectedStampId) return;
    const wrapper = pageWrapperRef.current;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pctX = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, (clickY / rect.height) * 100));

    setPlacedStamps(prev => prev.map(s => s.id === selectedStampId ? { ...s, xPct: pctX, yPct: pctY } : s));
  };

  const handleStampMouseDown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStampId(id);
    setDraggingStampId(id);
  };

  const handleMouseMoveOnPdf = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!draggingStampId) return;
    const wrapper = pageWrapperRef.current;
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const pctX = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const pctY = Math.max(0, Math.min(100, (clickY / rect.height) * 100));

    setPlacedStamps(prev => prev.map(s => s.id === draggingStampId ? { ...s, xPct: pctX, yPct: pctY } : s));
  };

  const handleMouseUpOnPdf = () => {
    if (draggingStampId) {
      setDraggingStampId(null);
    }
  };

  const removeStamp = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPlacedStamps(prev => prev.filter(s => s.id !== id));
    if (selectedStampId === id) {
      setSelectedStampId(null);
    }
  };

  const updateSelectedStampScale = (newScale: number) => {
    if (!selectedStampId) return;
    setPlacedStamps(prev => prev.map(s => s.id === selectedStampId ? { ...s, scalePct: newScale } : s));
  };

  // Embed ALL placed stamps onto PDF & Export
  const handleExportSignedPdf = async () => {
    if (!pdfDocBytes || placedStamps.length === 0 || !file) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const pdfDoc = await PDFDocument.load(pdfDocBytes, { ignoreEncryption: true, throwOnInvalidObject: false } as any);
      const pages = pdfDoc.getPages();

      for (const stamp of placedStamps) {
        if (stamp.page > pages.length || stamp.page < 1) continue;

        const targetPage = pages[stamp.page - 1];
        const { width: pdfPageWidth, height: pdfPageHeight } = targetPage.getSize();

        // Convert signature DataURL to PNG bytes
        const pngImageBytes = await fetch(stamp.dataUrl).then(res => res.arrayBuffer());
        const signatureImg = await pdfDoc.embedPng(pngImageBytes);

        // Calculate stamp dimensions in PDF points
        const stampWidthPoints = (stamp.scalePct / 100) * pdfPageWidth;
        const imgAspect = signatureImg.height / signatureImg.width;
        const stampHeightPoints = stampWidthPoints * imgAspect;

        // Calculate PDF coordinates (PDF Y-axis starts from BOTTOM-LEFT corner!)
        const stampCenterXPoints = (stamp.xPct / 100) * pdfPageWidth;
        const stampCenterYPointsFromTop = (stamp.yPct / 100) * pdfPageHeight;

        const x = Math.max(0, Math.min(pdfPageWidth - stampWidthPoints, stampCenterXPoints - (stampWidthPoints / 2)));
        const y = Math.max(0, Math.min(pdfPageHeight - stampHeightPoints, pdfPageHeight - stampCenterYPointsFromTop - (stampHeightPoints / 2)));

        targetPage.drawImage(signatureImg, {
          x,
          y,
          width: stampWidthPoints,
          height: stampHeightPoints,
        });
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      await saveFileWithPicker(blob, `signed_${file.name}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Failed to sign PDF: ${err?.message || 'Error embedding signatures'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const currentStampsOnPage = placedStamps.filter(s => s.page === currentPage);
  const selectedStamp = placedStamps.find(s => s.id === selectedStampId);

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          PDF Signature & Stamp Studio
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Create, save, and place multiple signatures or logo stamps across any pages of your PDF document.
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
          onDrop={(e) => {
            e.preventDefault();
            if (e.dataTransfer.files.length && (e.dataTransfer.files[0].type === 'application/pdf' || e.dataTransfer.files[0].name.toLowerCase().endsWith('.pdf'))) {
              loadPdf(e.dataTransfer.files[0]);
            }
          }}
          style={{
            border: '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '80px 40px',
            textAlign: 'center',
            background: '#121214',
            marginBottom: '24px',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('pdfUpload')?.click()}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.FileCheck size={32} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Select or Drop PDF File to Sign & Stamp
          </div>
          <div style={{ fontSize: '13px', color: '#8e8e93' }}>
            Multi-stamp placement, composite signature studio, and saved signatures gallery.
          </div>
          <input 
            id="pdfUpload" 
            type="file" 
            accept="application/pdf" 
            style={{ display: 'none' }} 
            onChange={(e) => { if (e.target.files?.[0]) loadPdf(e.target.files[0]); }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: '24px', alignItems: 'stretch' }}>
          
          {/* Left Sidebar: Signature Creation & Stamp Manager */}
          <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '18px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.PenTool size={18} color="#f43f5e" /> Signature Studio
              </div>
              <button 
                onClick={() => { setFile(null); setPdfDocBytes(null); setPlacedStamps([]); setSignatureDataUrl(null); }}
                style={{ background: 'transparent', border: 'none', color: '#8e8e93', fontSize: '12px', cursor: 'pointer' }}
              >
                Change PDF
              </button>
            </div>

            {/* Mode Switcher Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: '#121214', padding: '4px', borderRadius: '10px', gap: '2px' }}>
              {[
                { id: 'draw', label: 'Draw' },
                { id: 'type', label: 'Type' },
                { id: 'upload', label: 'Upload' },
                { id: 'composite', label: 'Stamp+Sign' },
                { id: 'saved', label: 'Saved' },
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => setSigMode(t.id as any)}
                  style={{ background: sigMode === t.id ? '#2c2c2e' : 'transparent', border: 'none', color: sigMode === t.id ? '#ffffff' : '#8e8e93', padding: '6px 2px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Color Palette Picker for Draw/Type/Composite */}
            {(sigMode === 'draw' || sigMode === 'type' || sigMode === 'composite') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', color: '#8e8e93', fontWeight: '600' }}>Ink Color:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[
                    { color: '#000000', label: 'Black' },
                    { color: '#002060', label: 'Navy' },
                    { color: '#800000', label: 'Red' }
                  ].map((c) => (
                    <button
                      key={c.color}
                      onClick={() => setStrokeColor(c.color)}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: c.color,
                        border: strokeColor === c.color ? '2px solid #ffffff' : '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer'
                      }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Mode 1: Draw Pad */}
            {sigMode === 'draw' && (
              <div>
                <div style={{ position: 'relative', background: '#ffffff', borderRadius: '10px', overflow: 'hidden', height: '130px' }}>
                  <canvas 
                    ref={drawCanvasRef}
                    width={330}
                    height={130}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
                  />
                  <button
                    onClick={clearDrawing}
                    style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#ffffff', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {/* Mode 2: Type Signature */}
            {sigMode === 'type' && (
              <div>
                <input 
                  type="text"
                  placeholder="Type your name..."
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    background: '#121214',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '13px',
                    outline: 'none',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ height: '70px', background: '#ffffff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6px' }}>
                  {typedName ? (
                    <div style={{ fontFamily: 'italic cursive', fontSize: '26px', color: strokeColor, fontStyle: 'italic' }}>
                      {typedName}
                    </div>
                  ) : (
                    <div style={{ fontSize: '11px', color: '#aaa' }}>Type name preview...</div>
                  )}
                </div>
              </div>
            )}

            {/* Mode 3: Upload Signature */}
            {sigMode === 'upload' && (
              <div>
                <input 
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleSignatureUpload}
                  style={{ display: 'none' }}
                  id="sigImgUpload"
                />
                <button
                  onClick={() => document.getElementById('sigImgUpload')?.click()}
                  style={{ width: '100%', padding: '16px', background: '#121214', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '10px', color: '#ffffff', cursor: 'pointer', fontSize: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}
                >
                  <Icons.Image size={20} color="#f43f5e" />
                  Select Image (PNG/JPG)
                </button>
              </div>
            )}

            {/* Mode 4: Composite Signature Studio (Background Logo/Seal + Freehand Draw/Sign) */}
            {sigMode === 'composite' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input 
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleCompositeBgUpload}
                  style={{ display: 'none' }}
                  id="compositeBgInput"
                />
                <button
                  onClick={() => document.getElementById('compositeBgInput')?.click()}
                  style={{ width: '100%', padding: '8px 12px', background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#6ee7b7', cursor: 'pointer', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Icons.Upload size={14} /> Upload Stamp/Logo Image
                </button>

                <div style={{ position: 'relative', background: '#ffffff', borderRadius: '10px', overflow: 'hidden', height: '130px' }}>
                  <canvas 
                    ref={drawCanvasRef}
                    width={330}
                    height={130}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    style={{ width: '100%', height: '100%', cursor: 'crosshair', touchAction: 'none' }}
                  />
                  <button
                    onClick={clearDrawing}
                    style={{ position: 'absolute', top: '6px', right: '6px', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#ffffff', borderRadius: '4px', padding: '3px 8px', fontSize: '11px', cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                </div>
                <div style={{ fontSize: '10px', color: '#8e8e93', textAlign: 'center' }}>
                  Draw or sign directly over the background image above.
                </div>
              </div>
            )}

            {/* Mode 5: Saved Signatures Gallery */}
            {sigMode === 'saved' && (
              <div style={{ maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {savedSigs.length === 0 ? (
                  <div style={{ fontSize: '12px', color: '#8e8e93', textAlign: 'center', padding: '16px' }}>
                    No saved signatures yet. Create one and click "Save to Gallery"!
                  </div>
                ) : (
                  savedSigs.map(s => (
                    <div 
                      key={s.id}
                      onClick={() => setSignatureDataUrl(s.dataUrl)}
                      style={{
                        background: signatureDataUrl === s.dataUrl ? 'rgba(244, 63, 94, 0.15)' : '#121214',
                        border: signatureDataUrl === s.dataUrl ? '1px solid #f43f5e' : '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <img src={sanitizeUrl(s.dataUrl)} alt={s.title} style={{ height: '28px', maxWidth: '70px', objectFit: 'contain', background: '#ffffff', borderRadius: '4px', padding: '2px' }} />
                        <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.title}</span>
                      </div>
                      <button onClick={(e) => deleteSavedSignature(s.id, e)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}>
                        <Icons.Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Save Current Signature to Gallery */}
            {signatureDataUrl && sigMode !== 'saved' && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <input 
                  type="text" 
                  value={signatureTitle} 
                  onChange={(e) => setSignatureTitle(e.target.value)} 
                  placeholder="Signature Name" 
                  style={{ flex: 1, background: '#121214', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '6px', padding: '6px 10px', fontSize: '11px' }}
                />
                <button
                  onClick={saveSignatureToGallery}
                  style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#6ee7b7', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Icons.BookmarkPlus size={12} /> Save to Gallery
                </button>
              </div>
            )}

            {/* Button: Add Current Signature to Active Page */}
            {signatureDataUrl && (
              <button
                onClick={addCurrentSignatureToPage}
                style={{ width: '100%', padding: '10px', background: '#f43f5e', border: 'none', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              >
                <Icons.PlusCircle size={16} /> Add Stamp to Page {currentPage}
              </button>
            )}

            {/* Placed Stamps Management List */}
            {placedStamps.length > 0 && (
              <div style={{ paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#ffffff', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Placed Stamps ({placedStamps.length})</span>
                </div>
                <div style={{ maxHeight: '140px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {placedStamps.map(st => {
                    const isSelected = st.id === selectedStampId;
                    return (
                      <div 
                        key={st.id}
                        onClick={() => { setSelectedStampId(st.id); setCurrentPage(st.page); }}
                        style={{
                          background: isSelected ? 'rgba(244, 63, 94, 0.15)' : '#121214',
                          border: isSelected ? '1px solid #f43f5e' : '1px solid rgba(255,255,255,0.05)',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                          <span style={{ background: '#2c2c2e', color: '#f43f5e', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px' }}>P.{st.page}</span>
                          <span style={{ fontSize: '12px', color: '#ffffff', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{st.title}</span>
                        </div>
                        <button onClick={(e) => removeStamp(st.id, e)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}>
                          <Icons.X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {selectedStamp && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#8e8e93', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Selected Stamp Size:</span>
                      <span style={{ color: '#f43f5e', fontWeight: '700' }}>{selectedStamp.scalePct}%</span>
                    </div>
                    <input 
                      type="range"
                      min="10"
                      max="60"
                      value={selectedStamp.scalePct}
                      onChange={(e) => updateSelectedStampScale(Number(e.target.value))}
                      style={{ width: '100%', accentColor: '#f43f5e', cursor: 'pointer' }}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Export Final Signed PDF Button */}
            <button
              onClick={handleExportSignedPdf}
              disabled={isProcessing || placedStamps.length === 0}
              style={{
                width: '100%',
                padding: '14px',
                background: placedStamps.length === 0 ? '#3a3a3c' : '#10b981',
                border: 'none',
                color: '#ffffff',
                borderRadius: '10px',
                cursor: isProcessing || placedStamps.length === 0 ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: 'auto'
              }}
            >
              {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.Download size={18} />}
              {isProcessing ? 'Embedding Stamps...' : `Save PDF (${placedStamps.length} Stamps)`}
            </button>
          </div>

          {/* Right Main Box: Interactive PDF Page Viewer */}
          <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                Document: <span style={{ color: '#8e8e93' }}>{file.name}</span>
              </div>

              {/* Page Navigation */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  style={{ background: '#2c2c2e', border: 'none', color: currentPage <= 1 ? '#555' : '#ffffff', borderRadius: '6px', padding: '6px 12px', cursor: currentPage <= 1 ? 'default' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Icons.ChevronLeft size={16} /> Prev
                </button>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
                  Page {currentPage} of {numPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                  disabled={currentPage >= numPages}
                  style={{ background: '#2c2c2e', border: 'none', color: currentPage >= numPages ? '#555' : '#ffffff', borderRadius: '6px', padding: '6px 12px', cursor: currentPage >= numPages ? 'default' : 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  Next <Icons.ChevronRight size={16} />
                </button>
              </div>
            </div>

            {/* PDF Page Canvas Wrapper - tightly wraps the rendered canvas */}
            <div
              ref={pageWrapperRef}
              onClick={handlePdfContainerClick}
              onMouseMove={handleMouseMoveOnPdf}
              onMouseUp={handleMouseUpOnPdf}
              onMouseLeave={handleMouseUpOnPdf}
              style={{
                position: 'relative',
                display: 'inline-block',
                lineHeight: 0,
                cursor: selectedStampId ? 'crosshair' : 'default',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                userSelect: 'none'
              }}
            >
              <canvas 
                ref={pageCanvasRef}
                style={{
                  display: 'block',
                  borderRadius: '8px'
                }}
              />

              {/* Render ALL Stamps on Current Page - positioned relative to the canvas */}
              {currentStampsOnPage.map(st => {
                const isSelected = st.id === selectedStampId;
                const isDragging = st.id === draggingStampId;

                return (
                  <div
                    key={st.id}
                    onMouseDown={(e) => handleStampMouseDown(st.id, e)}
                    style={{
                      position: 'absolute',
                      top: `${st.yPct}%`,
                      left: `${st.xPct}%`,
                      transform: 'translate(-50%, -50%)',
                      width: `${st.scalePct}%`,
                      border: isSelected ? '2px dashed #f43f5e' : '1px dashed rgba(255, 255, 255, 0.4)',
                      background: isSelected ? 'rgba(244, 63, 94, 0.1)' : 'rgba(0, 0, 0, 0.15)',
                      borderRadius: '4px',
                      padding: '3px',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      zIndex: isSelected ? 30 : 20,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
                      transition: isDragging ? 'none' : 'all 0.12s ease'
                    }}
                    title="Click or drag to position stamp"
                  >
                    <img 
                      src={sanitizeUrl(st.dataUrl)} 
                      alt={st.title} 
                      style={{ width: '100%', height: 'auto', display: 'block', pointerEvents: 'none' }}
                    />
                    
                    {isSelected && (
                      <button
                        onClick={(e) => removeStamp(st.id, e)}
                        style={{ position: 'absolute', top: '-10px', right: '-10px', background: '#ef4444', border: 'none', color: '#ffffff', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 40 }}
                        title="Remove stamp"
                      >
                        <Icons.X size={12} />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
