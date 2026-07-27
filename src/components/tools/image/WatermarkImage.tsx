import React, { useState, useRef, useEffect } from 'react';
import * as Icons from 'lucide-react';

export function WatermarkImage() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [fileName, setFileName] = useState('');
  
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(48);
  const [opacity, setOpacity] = useState(0.5);
  const [color, setColor] = useState('#ffffff');
  const [posX, setPosX] = useState(50); // percentage 0-100
  const [posY, setPosY] = useState(50); // percentage 0-100
  const [rotation, setRotation] = useState(-45);

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
    };
    img.src = url;
  };

  useEffect(() => {
    drawCanvas();
  }, [image, text, fontSize, opacity, color, posX, posY, rotation]);

  const drawCanvas = () => {
    if (!image || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = image.width;
    canvas.height = image.height;

    // Draw base image
    ctx.drawImage(image, 0, 0);

    // Draw watermark text
    if (text) {
      ctx.save();
      
      const x = (canvas.width * posX) / 100;
      const y = (canvas.height * posY) / 100;
      
      ctx.translate(x, y);
      ctx.rotate((rotation * Math.PI) / 180);
      
      // Calculate hex color with opacity
      const hex = color.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${opacity})`;
      
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Add a subtle shadow for readability
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.95);
    const link = document.createElement('a');
    link.download = `watermarked_${fileName.split('.')[0]}.jpg`;
    link.href = dataUrl;
    link.click();
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Watermark Image
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Stamp your photos with text watermarks instantly offline.
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
            <Icons.Stamp size={32} color="#ec4899" />
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
            <canvas ref={canvasRef} style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', borderRadius: '4px' }} />
          </div>

          <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '600px', overflowY: 'auto' }}>
            
            <div>
              <label style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Watermark Text</label>
              <input 
                type="text" value={text} 
                onChange={e => setText(e.target.value)}
                style={{ width: '100%', padding: '10px', background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#ffffff' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Color</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="color" value={color} 
                  onChange={e => setColor(e.target.value)}
                  style={{ width: '40px', height: '40px', padding: '0', border: 'none', background: 'transparent', cursor: 'pointer' }}
                />
                <span style={{ color: '#ffffff', fontSize: '14px', fontFamily: 'monospace' }}>{color.toUpperCase()}</span>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '600' }}>Opacity</label>
                <span style={{ fontSize: '13px', color: '#ec4899' }}>{Math.round(opacity * 100)}%</span>
              </div>
              <input 
                type="range" min="0.1" max="1.0" step="0.05" value={opacity} 
                onChange={e => setOpacity(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ec4899' }} 
              />
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '600' }}>Font Size (px)</label>
                <span style={{ fontSize: '13px', color: '#ec4899' }}>{fontSize}</span>
              </div>
              <input 
                type="range" min="10" max="300" step="1" value={fontSize} 
                onChange={e => setFontSize(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ec4899' }} 
              />
            </div>
            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '600' }}>Rotation</label>
                <span style={{ fontSize: '13px', color: '#ec4899' }}>{rotation}°</span>
              </div>
              <input 
                type="range" min="-180" max="180" step="1" value={rotation} 
                onChange={e => setRotation(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ec4899' }} 
              />
            </div>

            <div>
              <label style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Position X & Y (%)</label>
              <div style={{ display: 'flex', gap: '12px' }}>
                <input 
                  type="range" min="0" max="100" value={posX} 
                  onChange={e => setPosX(Number(e.target.value))}
                  style={{ width: '50%', accentColor: '#ec4899' }} 
                />
                <input 
                  type="range" min="0" max="100" value={posY} 
                  onChange={e => setPosY(Number(e.target.value))}
                  style={{ width: '50%', accentColor: '#ec4899' }} 
                />
              </div>
            </div>

            <div style={{ flexGrow: 1 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              <button onClick={handleDownload} style={{ padding: '14px', background: '#ec4899', border: 'none', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Icons.Download size={18} /> Download Image
              </button>
              <button onClick={() => setImage(null)} style={{ padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
                Change File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
