import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import * as Icons from 'lucide-react';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

type ShapeType = 'rect' | 'ellipse';

interface BlurShape {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  w: number;
  h: number;
}

export function BlurAnonymize() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [blurShapes, setBlurShapes] = useState<BlurShape[]>([]);
  const [blurStrength, setBlurStrength] = useState(15);
  const [activeShapeType, setActiveShapeType] = useState<ShapeType>('rect');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Interaction State
  const [interactionMode, setInteractionMode] = useState<'idle' | 'drawing' | 'dragging'>('idle');
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  
  const [startX, setStartX] = useState(0);
  const [startY, setStartY] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const [lastMouseX, setLastMouseX] = useState(0);
  const [lastMouseY, setLastMouseY] = useState(0);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
  };

  const loadFile = (f: File) => {
    if (!f.type.startsWith('image/')) return;
    setFileName(f.name);
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setBlurShapes([]);
    };
    img.src = url;
  };

  useLayoutEffect(() => {
    drawCanvas();
  }, [image, blurShapes, blurStrength, interactionMode, currentX, currentY]);

  const drawCanvas = () => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;

    // Draw base image
    ctx.drawImage(image, 0, 0);

    // Draw saved blur shapes
    blurShapes.forEach(shape => {
      ctx.save();
      ctx.filter = `blur(${blurStrength}px)`;
      ctx.beginPath();
      if (shape.type === 'ellipse') {
        const cx = shape.x + shape.w / 2;
        const cy = shape.y + shape.h / 2;
        const rx = shape.w / 2;
        const ry = shape.h / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      } else {
        ctx.rect(shape.x, shape.y, shape.w, shape.h);
      }
      ctx.clip();
      ctx.drawImage(image, 0, 0);
      ctx.restore();
    });

    // Draw current drawing preview
    if (interactionMode === 'drawing') {
      ctx.save();
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2 / getScale();
      ctx.setLineDash([5 / getScale(), 5 / getScale()]);
      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const w = Math.abs(currentX - startX);
      const h = Math.abs(currentY - startY);
      
      ctx.beginPath();
      if (activeShapeType === 'ellipse') {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const rx = w / 2;
        const ry = h / 2;
        ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      } else {
        ctx.rect(x, y, w, h);
      }
      ctx.stroke();
      ctx.restore();
    }
  };

  const getScale = () => {
    if (!canvasRef.current || !image) return 1;
    const rect = canvasRef.current.getBoundingClientRect();
    return rect.width / image.width;
  };

  const isPointInShape = (px: number, py: number, shape: BlurShape) => {
    if (shape.type === 'ellipse') {
      const cx = shape.x + shape.w / 2;
      const cy = shape.y + shape.h / 2;
      const rx = shape.w / 2;
      const ry = shape.h / 2;
      if (rx === 0 || ry === 0) return false;
      const dx = px - cx;
      const dy = py - cy;
      return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
    } else {
      return px >= shape.x && px <= shape.x + shape.w && py >= shape.y && py <= shape.y + shape.h;
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = getScale();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    // Check if clicked on an existing shape (iterate backwards for top-most)
    let hitIndex = -1;
    for (let i = blurShapes.length - 1; i >= 0; i--) {
      if (isPointInShape(x, y, blurShapes[i])) {
        hitIndex = i;
        break;
      }
    }

    if (hitIndex !== -1) {
      setInteractionMode('dragging');
      setDragIndex(hitIndex);
      document.body.style.cursor = 'move';
    } else {
      setInteractionMode('drawing');
      setStartX(x);
      setStartY(y);
      setCurrentX(x);
      setCurrentY(y);
    }
    
    setLastMouseX(x);
    setLastMouseY(y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = getScale();
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;

    // Change cursor dynamically based on hover
    if (interactionMode === 'idle') {
      const hit = blurShapes.some(s => isPointInShape(x, y, s));
      canvasRef.current.style.cursor = hit ? 'move' : 'crosshair';
    }

    if (interactionMode === 'dragging' && dragIndex !== null) {
      const dx = x - lastMouseX;
      const dy = y - lastMouseY;
      setBlurShapes(prev => {
        const newShapes = [...prev];
        newShapes[dragIndex] = { ...newShapes[dragIndex], x: newShapes[dragIndex].x + dx, y: newShapes[dragIndex].y + dy };
        return newShapes;
      });
    } else if (interactionMode === 'drawing') {
      setCurrentX(x);
      setCurrentY(y);
    }

    setLastMouseX(x);
    setLastMouseY(y);
  };

  const handleMouseUp = () => {
    if (interactionMode === 'drawing') {
      const w = Math.abs(currentX - startX);
      const h = Math.abs(currentY - startY);
      const bx = Math.min(startX, currentX);
      const by = Math.min(startY, currentY);
      if (w > 10 && h > 10) {
        setBlurShapes(prev => [...prev, { id: Date.now().toString(), type: activeShapeType, x: bx, y: by, w, h }]);
      }
    }
    setInteractionMode('idle');
    setDragIndex(null);
    document.body.style.cursor = 'default';
  };

  const handleDownload = async () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);
    try {
      const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await downloadFileWithDialog(blob, `anonymized_${fileName.replace(/\.[^/.]+$/, '')}.jpg`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Blur & Anonymize
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Click and drag over faces, license plates, or sensitive data to censor them instantly.
        </p>
      </div>

      {!image ? (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '80px 40px', textAlign: 'center', background: '#121214', cursor: 'pointer' }}
          onClick={() => document.getElementById('fileUpload')?.click()}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.EyeOff size={32} color="#ec4899" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Drop image file here
          </div>
          <input 
            id="fileUpload" type="file" accept="image/*" style={{ display: 'none' }} 
            onChange={e => { if (e.target.files?.length) loadFile(e.target.files[0]) }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '24px' }}>
          
          <div style={{ background: '#121214', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '500px', overflow: 'hidden' }}>
            <div style={{ display: 'inline-block' }}>
              <canvas 
                ref={canvasRef} 
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', borderRadius: '4px' }} 
              />
            </div>
          </div>

          <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', padding: '12px', borderRadius: '8px', color: '#ec4899', fontSize: '13px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
              <Icons.MousePointerClick size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ lineHeight: '1.4' }}>Draw shapes to blur. Hover and drag existing blurs to move them.</span>
            </div>

            {/* Shape Select */}
            <div>
              <h3 style={{ fontSize: '13px', color: '#8e8e93', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Blur Shape</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button 
                  onClick={() => setActiveShapeType('rect')}
                  style={{ padding: '10px', background: activeShapeType === 'rect' ? 'rgba(236,72,153,0.1)' : '#2c2c2e', border: activeShapeType === 'rect' ? '1px solid #ec4899' : '1px solid transparent', borderRadius: '8px', color: activeShapeType === 'rect' ? '#ec4899' : '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <Icons.Square size={16} /> Rectangle
                </button>
                <button 
                  onClick={() => setActiveShapeType('ellipse')}
                  style={{ padding: '10px', background: activeShapeType === 'ellipse' ? 'rgba(236,72,153,0.1)' : '#2c2c2e', border: activeShapeType === 'ellipse' ? '1px solid #ec4899' : '1px solid transparent', borderRadius: '8px', color: activeShapeType === 'ellipse' ? '#ec4899' : '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <Icons.Circle size={16} /> Circle
                </button>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '600' }}>Blur Strength</label>
                <span style={{ fontSize: '13px', color: '#ec4899' }}>{blurStrength}px</span>
              </div>
              <input 
                type="range" min="5" max="50" step="1" value={blurStrength} 
                onChange={e => setBlurStrength(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ec4899' }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#2c2c2e', padding: '12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '13px', color: '#ffffff' }}>Active Blurs: {blurShapes.length}</span>
              <button 
                onClick={() => setBlurShapes([])} 
                disabled={blurShapes.length === 0}
                style={{ background: 'transparent', border: 'none', color: blurShapes.length > 0 ? '#ef4444' : '#555', cursor: blurShapes.length > 0 ? 'pointer' : 'default', fontSize: '13px', fontWeight: '600' }}
              >
                Clear All
              </button>
            </div>

            <div style={{ flexGrow: 1 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                onClick={handleDownload} 
                disabled={isProcessing}
                style={{ padding: '14px', background: '#ec4899', border: 'none', color: '#ffffff', borderRadius: '8px', cursor: isProcessing ? 'not-allowed' : 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: isProcessing ? 0.7 : 1 }}
              >
                {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.Download size={18} />}
                Download Image
              </button>
              <button onClick={() => { setImage(null); setBlurShapes([]); }} style={{ padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                Change File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
