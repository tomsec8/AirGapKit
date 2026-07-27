import React, { useState, useRef, useLayoutEffect } from 'react';
import * as Icons from 'lucide-react';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

export function ImageEditor() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Transform state
  const [rotation, setRotation] = useState(0); // in degrees
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspectRatio, setLockAspectRatio] = useState(true);

  // Crop states (in percentages, matching CropPdf)
  const [cropTop, setCropTop] = useState(0);
  const [cropBottom, setCropBottom] = useState(0);
  const [cropLeft, setCropLeft] = useState(0);
  const [cropRight, setCropRight] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (e.dataTransfer.files.length) {
      loadFile(e.dataTransfer.files[0]);
    }
  };

  const loadFile = (file: File) => {
    setErrorMsg(null);
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file.');
      return;
    }
    setFileName(file.name);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImage(img);
      setWidth(img.width);
      setHeight(img.height);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      resetCrops();
    };
    img.src = url;
  };

  const resetCrops = () => {
    setCropTop(0);
    setCropBottom(0);
    setCropLeft(0);
    setCropRight(0);
  };

  // useLayoutEffect prevents visual flickering (screen jumping) on state changes by drawing synchronously before browser paint
  useLayoutEffect(() => {
    if (image && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Determine canvas size based on rotation
      const rad = (rotation * Math.PI) / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      
      const newWidth = width * cos + height * sin;
      const newHeight = width * sin + height * cos;

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      // Move to center to rotate and flip
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(rad);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      
      // Draw image centered
      ctx.drawImage(image, -width / 2, -height / 2, width, height);
      
      ctx.restore();
    }
  }, [image, rotation, flipH, flipV, width, height]);

  const handleDownload = async () => {
    if (!image || !canvasRef.current) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const baseCanvas = canvasRef.current;
      const baseW = baseCanvas.width;
      const baseH = baseCanvas.height;

      // Calculate crop margins relative to final transformed canvas bounds
      const x = (cropLeft / 100) * baseW;
      const y = (cropTop / 100) * baseH;
      const w = Math.max(1, baseW - ((cropLeft + cropRight) / 100) * baseW);
      const h = Math.max(1, baseH - ((cropTop + cropBottom) / 100) * baseH);

      const offscreen = document.createElement('canvas');
      const ctx = offscreen.getContext('2d');
      if (!ctx) throw new Error('Could not initialize drawing context.');

      offscreen.width = w;
      offscreen.height = h;

      // Draw the cropped region from the base canvas onto the offscreen canvas
      ctx.drawImage(baseCanvas, x, y, w, h, 0, 0, w, h);

      const dataUrl = offscreen.toDataURL('image/png', 1.0);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      
      await downloadFileWithDialog(blob, `edited_${fileName.replace(/\.[^/.]+$/, '')}.png`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to process and save cropped image.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Image Editor Suite
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Resize, rotate, flip, and crop your images flawlessly offline using native browser APIs.
        </p>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', borderRadius: '8px', color: '#f43f5e', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Icons.AlertCircle size={20} />
          <span style={{ fontWeight: '500' }}>{errorMsg}</span>
        </div>
      )}

      {!image ? (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '80px 40px', textAlign: 'center', background: '#121214', cursor: 'pointer' }}
          onClick={() => document.getElementById('fileUpload')?.click()}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.Image size={32} color="#ec4899" />
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
          
          {/* Canvas Preview Container with Masks overlays */}
          <div style={{ background: '#121214', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '450px' }}>
            <div style={{ position: 'relative', display: 'inline-block', borderRadius: '4px', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <canvas ref={canvasRef} style={{ display: 'block', maxWidth: '100%', maxHeight: '550px', objectFit: 'contain' }} />

              {/* Dark Mask Overlays for Cropped Areas */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${cropTop}%`, background: 'rgba(0, 0, 0, 0.65)', borderBottom: '1px dashed #ec4899', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${cropBottom}%`, background: 'rgba(0, 0, 0, 0.65)', borderTop: '1px dashed #ec4899', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: `${cropTop}%`, bottom: `${cropBottom}%`, left: 0, width: `${cropLeft}%`, background: 'rgba(0, 0, 0, 0.65)', borderRight: '1px dashed #ec4899', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: `${cropTop}%`, bottom: `${cropBottom}%`, right: 0, width: `${cropRight}%`, background: 'rgba(0, 0, 0, 0.65)', borderLeft: '1px dashed #ec4899', pointerEvents: 'none' }} />

              {/* Active Uncropped Box Label */}
              <div style={{
                position: 'absolute',
                top: `${cropTop}%`,
                left: `${cropLeft}%`,
                right: `${cropRight}%`,
                bottom: `${cropBottom}%`,
                border: '2px solid #ec4899',
                boxSizing: 'border-box',
                pointerEvents: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <span style={{ background: '#ec4899', color: '#ffffff', fontSize: '10px', fontWeight: '700', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                  Keep Zone
                </span>
              </div>
            </div>
          </div>

          {/* Right Control Bar */}
          <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Transforms */}
            <div>
              <h3 style={{ fontSize: '13px', color: '#8e8e93', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Transforms</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button onClick={() => setRotation(r => (r - 90 + 360) % 360)} style={{ padding: '10px', background: '#2c2c2e', border: 'none', borderRadius: '8px', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>
                  <Icons.RotateCcw size={16} /> -90°
                </button>
                <button onClick={() => setRotation(r => (r + 90) % 360)} style={{ padding: '10px', background: '#2c2c2e', border: 'none', borderRadius: '8px', color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>
                  <Icons.RotateCw size={16} /> +90°
                </button>
                <button onClick={() => setFlipH(f => !f)} style={{ padding: '10px', background: flipH ? 'rgba(236,72,153,0.1)' : '#2c2c2e', border: flipH ? '1px solid #ec4899' : '1px solid transparent', borderRadius: '8px', color: flipH ? '#ec4899' : '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>
                  <Icons.FlipHorizontal size={16} /> Flip H
                </button>
                <button onClick={() => setFlipV(f => !f)} style={{ padding: '10px', background: flipV ? 'rgba(236,72,153,0.1)' : '#2c2c2e', border: flipV ? '1px solid #ec4899' : '1px solid transparent', borderRadius: '8px', color: flipV ? '#ec4899' : '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '13px' }}>
                  <Icons.FlipVertical size={16} /> Flip V
                </button>
              </div>
            </div>

            {/* Resize */}
            <div>
              <h3 style={{ fontSize: '13px', color: '#8e8e93', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Resize</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '6px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8e8e93', marginBottom: '4px' }}>Width (px)</label>
                  <input type="number" value={Math.round(width)} onChange={e => {
                    const w = Number(e.target.value);
                    setWidth(w);
                    if (lockAspectRatio && image) setHeight(w * (image.height / image.width));
                  }} style={{ width: '100%', padding: '10px', background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#ffffff', fontSize: '14px' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#8e8e93', marginBottom: '4px' }}>Height (px)</label>
                  <input type="number" value={Math.round(height)} onChange={e => {
                    const h = Number(e.target.value);
                    setHeight(h);
                    if (lockAspectRatio && image) setWidth(h * (image.width / image.height));
                  }} style={{ width: '100%', padding: '10px', background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#ffffff', fontSize: '14px' }} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                <input 
                  type="checkbox" 
                  id="lockRatio" 
                  checked={lockAspectRatio} 
                  onChange={e => setLockAspectRatio(e.target.checked)} 
                  style={{ accentColor: '#ec4899', cursor: 'pointer', width: '14px', height: '14px' }}
                />
                <label htmlFor="lockRatio" style={{ fontSize: '12px', color: '#8e8e93', cursor: 'pointer', userSelect: 'none' }}>Lock Aspect Ratio</label>
              </div>
            </div>

            {/* Crop Margins (Visual Sliders) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Crop Margins (%)</h3>
                <button onClick={resetCrops} style={{ background: 'transparent', border: 'none', color: '#ec4899', fontSize: '12px', cursor: 'pointer', fontWeight: '600', padding: 0 }}>Reset Crop</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Top */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8e8e93', marginBottom: '4px' }}>
                    <span>Top Margin</span>
                    <span style={{ color: '#ec4899', fontWeight: '600' }}>{cropTop}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="45" value={cropTop} 
                    onChange={e => setCropTop(Number(e.target.value))} 
                    style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }} 
                  />
                </div>

                {/* Bottom */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8e8e93', marginBottom: '4px' }}>
                    <span>Bottom Margin</span>
                    <span style={{ color: '#ec4899', fontWeight: '600' }}>{cropBottom}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="45" value={cropBottom} 
                    onChange={e => setCropBottom(Number(e.target.value))} 
                    style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }} 
                  />
                </div>

                {/* Left */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8e8e93', marginBottom: '4px' }}>
                    <span>Left Margin</span>
                    <span style={{ color: '#ec4899', fontWeight: '600' }}>{cropLeft}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="45" value={cropLeft} 
                    onChange={e => setCropLeft(Number(e.target.value))} 
                    style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }} 
                  />
                </div>

                {/* Right */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#8e8e93', marginBottom: '4px' }}>
                    <span>Right Margin</span>
                    <span style={{ color: '#ec4899', fontWeight: '600' }}>{cropRight}%</span>
                  </div>
                  <input 
                    type="range" min="0" max="45" value={cropRight} 
                    onChange={e => setCropRight(Number(e.target.value))} 
                    style={{ width: '100%', accentColor: '#ec4899', cursor: 'pointer' }} 
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
              <button 
                onClick={handleDownload} 
                disabled={isProcessing}
                style={{ 
                  padding: '14px', 
                  background: '#ec4899', 
                  border: 'none', 
                  color: '#ffffff', 
                  borderRadius: '8px', 
                  cursor: isProcessing ? 'not-allowed' : 'pointer', 
                  fontWeight: '700', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: '8px',
                  opacity: isProcessing ? 0.7 : 1
                }}
              >
                {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.Download size={18} />}
                Download Edited PNG
              </button>
              <button 
                onClick={() => { setImage(null); resetCrops(); setErrorMsg(null); }} 
                style={{ padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
              >
                Start Over
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
