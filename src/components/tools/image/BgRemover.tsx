import React, { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';

export function BgRemover() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState('');
  
  const [tolerance, setTolerance] = useState(30); // 0-100
  const [targetColor, setTargetColor] = useState<{ r: number, g: number, b: number } | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]); // Undo history
  const [currentImageData, setCurrentImageData] = useState<ImageData | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      setTargetColor(null);
      setHistory([]);
      
      // Initialize image data
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setCurrentImageData(ctx.getImageData(0, 0, img.width, img.height));
      }
    };
    img.src = url;
  };

  useEffect(() => {
    if (currentImageData && canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvasRef.current.width = currentImageData.width;
        canvasRef.current.height = currentImageData.height;
        ctx.putImageData(currentImageData, 0, 0);
      }
    }
  }, [currentImageData]);

  const getScale = () => {
    if (!canvasRef.current || !currentImageData) return 1;
    const rect = canvasRef.current.getBoundingClientRect();
    return rect.width / currentImageData.width;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !currentImageData) return;
    
    // Save state for Undo
    setHistory(prev => [...prev, new ImageData(
      new Uint8ClampedArray(currentImageData.data),
      currentImageData.width,
      currentImageData.height
    )]);

    const rect = canvasRef.current.getBoundingClientRect();
    const scale = getScale();
    const x = Math.floor((e.clientX - rect.left) / scale);
    const y = Math.floor((e.clientY - rect.top) / scale);

    // Get color at clicked pixel
    const idx = (y * currentImageData.width + x) * 4;
    const data = currentImageData.data;
    const clickedColor = { r: data[idx], g: data[idx+1], b: data[idx+2] };
    setTargetColor(clickedColor);

    // Erase colors within tolerance
    const newImgData = new ImageData(
      new Uint8ClampedArray(currentImageData.data),
      currentImageData.width,
      currentImageData.height
    );
    const newData = newImgData.data;

    // Convert tolerance % to absolute distance squared (max dist squared is 3 * 255^2 = 195075)
    const maxDistSq = 195075;
    const toleranceSq = maxDistSq * Math.pow(tolerance / 100, 2);

    for (let i = 0; i < newData.length; i += 4) {
      // Ignore already transparent pixels
      if (newData[i+3] === 0) continue;

      const r = newData[i];
      const g = newData[i+1];
      const b = newData[i+2];

      const distSq = Math.pow(r - clickedColor.r, 2) + Math.pow(g - clickedColor.g, 2) + Math.pow(b - clickedColor.b, 2);

      if (distSq <= toleranceSq) {
        newData[i+3] = 0; // Make transparent
      }
    }

    setCurrentImageData(newImgData);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setCurrentImageData(prev);
      setHistory(h => h.slice(0, h.length - 1));
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `nobg_${fileName.split('.')[0]}.png`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Background Eraser
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Magic Wand tool: Click on the background color you want to erase instantly offline.
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
            <Icons.Scissors size={32} color="#ec4899" />
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          
          <div style={{ background: '#121214', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '500px', overflow: 'hidden' }}>
            <div style={{ 
              cursor: 'crosshair', 
              display: 'inline-block',
              background: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\'%3E%3Crect width=\'10\' height=\'10\' fill=\'%23ccc\'/%3E%3Crect x=\'10\' width=\'10\' height=\'10\' fill=\'%23fff\'/%3E%3Crect y=\'10\' width=\'10\' height=\'10\' fill=\'%23fff\'/%3E%3Crect x=\'10\' y=\'10\' width=\'10\' height=\'10\' fill=\'%23ccc\'/%3E%3C/svg%3E")', 
              borderRadius: '4px',
              boxShadow: '0 8px 30px rgba(0,0,0,0.5)'
            }}>
              <canvas 
                ref={canvasRef} 
                onClick={handleCanvasClick}
                style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', display: 'block' }} 
              />
            </div>
          </div>

          <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', padding: '12px', borderRadius: '8px', color: '#ec4899', fontSize: '13px', display: 'flex', gap: '8px' }}>
              <Icons.Wand2 size={20} style={{ flexShrink: 0 }} />
              <span><strong>Magic Eraser:</strong> Click on the background in the image to make that color transparent.</span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '600' }}>Tolerance</label>
                <span style={{ fontSize: '13px', color: '#ec4899' }}>{tolerance}%</span>
              </div>
              <input 
                type="range" min="1" max="100" step="1" value={tolerance} 
                onChange={e => setTolerance(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ec4899' }} 
              />
              <p style={{ fontSize: '11px', color: '#555', marginTop: '4px' }}>Increase tolerance to erase more shades of the clicked color.</p>
            </div>

            {targetColor && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#2c2c2e', padding: '12px', borderRadius: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: `rgb(${targetColor.r}, ${targetColor.g}, ${targetColor.b})`, border: '1px solid #555' }} />
                <span style={{ fontSize: '12px', color: '#fff', fontFamily: 'monospace' }}>Last erased color</span>
              </div>
            )}

            <button 
              onClick={handleUndo} 
              disabled={history.length === 0}
              style={{ padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', color: history.length > 0 ? '#ffffff' : '#555', borderRadius: '8px', cursor: history.length > 0 ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}
            >
              <Icons.Undo2 size={16} /> Undo Erasure
            </button>

            <div style={{ flexGrow: 1 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button onClick={handleDownload} style={{ padding: '14px', background: '#ec4899', border: 'none', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Icons.Download size={18} /> Download Transparent PNG
              </button>
              <button onClick={() => setImage(null)} style={{ padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                Change Image
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
