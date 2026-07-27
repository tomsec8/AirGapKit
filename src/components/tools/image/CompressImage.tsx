import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { ImagePreviewModal } from '../../common/ImagePreviewModal';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
  originalSize: number;
  compressedBlob: Blob | null;
  compressedSize: number;
  compressedUrl: string | null;
}

export function CompressImage() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [quality, setQuality] = useState(0.7); // 0.1 to 1.0
  const [format, setFormat] = useState<'image/jpeg' | 'image/webp'>('image/jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [zoomItem, setZoomItem] = useState<{ url: string; title: string } | null>(null);

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

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) loadFiles(Array.from(e.dataTransfer.files));
  };

  const loadFiles = (newFiles: File[]) => {
    const validImages = newFiles.filter(f => f.type.startsWith('image/'));
    if (validImages.length === 0) return;

    const newItems: ImageItem[] = validImages.map(f => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      previewUrl: URL.createObjectURL(f),
      originalSize: f.size,
      compressedBlob: null,
      compressedSize: 0,
      compressedUrl: null
    }));

    setItems(prev => {
      const updated = [...prev, ...newItems];
      if (!activeId && updated.length > 0) {
        setActiveId(updated[0].id);
      }
      return updated;
    });
  };

  const compressSingleImage = (item: ImageItem, q: number, fmt: 'image/jpeg' | 'image/webp'): Promise<{ blob: Blob; size: number; url: string }> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob);
              resolve({ blob, size: blob.size, url });
            } else {
              resolve({ blob: new Blob([]), size: 0, url: '' });
            }
          }, fmt, q);
        } else {
          resolve({ blob: new Blob([]), size: 0, url: '' });
        }
      };
      img.src = item.previewUrl;
    });
  };

  // Re-compress items when quality or format changes
  useEffect(() => {
    if (items.length === 0) return;
    let isCancelled = false;

    const updateAll = async () => {
      setIsProcessing(true);
      const updatedItems = await Promise.all(
        items.map(async (item) => {
          const res = await compressSingleImage(item, quality, format);
          return {
            ...item,
            compressedBlob: res.blob,
            compressedSize: res.size,
            compressedUrl: res.url
          };
        })
      );
      if (!isCancelled) {
        setItems(updatedItems);
        setIsProcessing(false);
      }
    };

    updateAll();
    return () => { isCancelled = true; };
  }, [quality, format, items.length]);

  const activeItem = items.find(i => i.id === activeId) || items[0] || null;

  const formatSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleDownloadSingle = async (item: ImageItem) => {
    if (!item.compressedBlob) return;
    const ext = format === 'image/webp' ? 'webp' : 'jpg';
    const suggestedName = `compressed_${item.file.name.replace(/\.[^/.]+$/, '')}.${ext}`;
    await saveFileWithPicker(item.compressedBlob, suggestedName);
  };

  const handleDownloadAllZip = async () => {
    if (items.length === 0) return;
    const zip = new JSZip();
    const ext = format === 'image/webp' ? 'webp' : 'jpg';
    items.forEach(item => {
      if (item.compressedBlob) {
        zip.file(`compressed_${item.file.name.replace(/\.[^/.]+$/, '')}.${ext}`, item.compressedBlob);
      }
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    await saveFileWithPicker(zipBlob, 'compressed_images_all.zip');
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Batch Image Compressor
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Shrink JPG, PNG, and WebP image file sizes offline with live preview and custom compression controls.
        </p>
      </div>

      {items.length === 0 ? (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '80px 40px', textAlign: 'center', background: '#121214', cursor: 'pointer' }}
          onClick={() => document.getElementById('fileUpload')?.click()}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(236, 72, 153, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.Minimize2 size={32} color="#ec4899" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Select or Drop Multiple Images
          </div>
          <div style={{ fontSize: '13px', color: '#8e8e93' }}>
            Supports PNG, JPG, and WebP images. 100% Offline.
          </div>
          <input 
            id="fileUpload" type="file" accept="image/*" multiple style={{ display: 'none' }} 
            onChange={e => { if (e.target.files?.length) loadFiles(Array.from(e.target.files)) }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          
          {/* Main Preview & Queue Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Active Selected Image Preview Box */}
            <div style={{ background: '#121214', borderRadius: '16px', padding: '24px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '380px', position: 'relative' }}>
              {activeItem && activeItem.compressedUrl ? (
                <>
                  <img 
                    src={activeItem.compressedUrl} 
                    alt={activeItem.file.name} 
                    onClick={() => setZoomItem({ url: activeItem.compressedUrl!, title: activeItem.file.name })}
                    title="Click to enlarge preview"
                    style={{ maxWidth: '100%', maxHeight: '420px', objectFit: 'contain', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', borderRadius: '6px', cursor: 'zoom-in' }} 
                  />
                  <div style={{ marginTop: '12px', fontSize: '13px', color: '#8e8e93', fontWeight: '500' }}>
                    Previewing: <span style={{ color: '#ffffff', fontWeight: '600' }}>{activeItem.file.name}</span>
                  </div>
                </>
              ) : (
                <div style={{ color: '#8e8e93', fontSize: '14px' }}>Processing preview...</div>
              )}
            </div>

            {/* Thumbnail Queue Bar */}
            <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff' }}>
                  Loaded Images ({items.length}) — Click thumbnail to preview
                </span>
                <button 
                  onClick={() => { setItems([]); setActiveId(null); }}
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12px', cursor: 'pointer' }}
                >
                  Clear All
                </button>
              </div>

              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '6px' }}>
                {items.map((item) => {
                  const isActive = item.id === activeItem?.id;
                  const savings = item.originalSize && item.compressedSize ? Math.round(((item.originalSize - item.compressedSize) / item.originalSize) * 100) : 0;

                  return (
                    <div 
                      key={item.id}
                      onClick={() => setActiveId(item.id)}
                      style={{
                        position: 'relative',
                        flexShrink: 0,
                        width: '72px',
                        height: '72px',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        border: isActive ? '2px solid #ec4899' : '2px solid rgba(255,255,255,0.1)',
                        boxShadow: isActive ? '0 0 10px rgba(236,72,153,0.4)' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <img src={item.previewUrl} alt={item.file.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      
                      {savings > 0 && (
                        <div style={{ position: 'absolute', bottom: '0', left: '0', right: '0', background: 'rgba(16, 185, 129, 0.9)', color: '#000', fontSize: '9px', fontWeight: '700', textAlign: 'center', padding: '1px 0' }}>
                          -{savings}%
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const filtered = items.filter(i => i.id !== item.id);
                          setItems(filtered);
                          if (activeId === item.id) {
                            setActiveId(filtered.length > 0 ? filtered[0].id : null);
                          }
                        }}
                        style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(0,0,0,0.7)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Icons.X size={10} />
                      </button>
                    </div>
                  );
                })}

                <button 
                  onClick={() => document.getElementById('fileUploadMore')?.click()}
                  style={{ flexShrink: 0, width: '72px', height: '72px', borderRadius: '10px', background: '#2c2c2e', border: '2px dashed rgba(255,255,255,0.2)', color: '#8e8e93', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '4px' }}
                >
                  <Icons.Plus size={18} />
                  <span style={{ fontSize: '10px' }}>Add</span>
                </button>
                <input 
                  id="fileUploadMore" type="file" accept="image/*" multiple style={{ display: 'none' }} 
                  onChange={e => { if (e.target.files?.length) loadFiles(Array.from(e.target.files)) }}
                />
              </div>
            </div>
          </div>

          {/* Control & Details Panel */}
          <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {activeItem && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#2c2c2e', padding: '14px', borderRadius: '12px' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#8e8e93', marginBottom: '2px' }}>Original</div>
                  <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>{formatSize(activeItem.originalSize)}</div>
                </div>
                <Icons.ArrowRight size={18} color="#555" />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#8e8e93', marginBottom: '2px' }}>Compressed</div>
                  <div style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>{formatSize(activeItem.compressedSize)}</div>
                </div>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label style={{ fontSize: '13px', color: '#8e8e93', fontWeight: '600' }}>Quality Level</label>
                <span style={{ fontSize: '13px', color: '#ec4899', fontWeight: '700' }}>{Math.round(quality * 100)}%</span>
              </div>
              <input 
                type="range" min="0.1" max="1.0" step="0.05" value={quality} 
                onChange={e => setQuality(Number(e.target.value))}
                style={{ width: '100%', accentColor: '#ec4899' }} 
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', color: '#8e8e93', marginBottom: '8px', fontWeight: '600' }}>Output Format</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button onClick={() => setFormat('image/jpeg')} style={{ padding: '10px', background: format === 'image/jpeg' ? 'rgba(236,72,153,0.2)' : '#2c2c2e', border: format === 'image/jpeg' ? '1px solid #ec4899' : '1px solid transparent', borderRadius: '8px', color: format === 'image/jpeg' ? '#ec4899' : '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  JPEG
                </button>
                <button onClick={() => setFormat('image/webp')} style={{ padding: '10px', background: format === 'image/webp' ? 'rgba(236,72,153,0.2)' : '#2c2c2e', border: format === 'image/webp' ? '1px solid #ec4899' : '1px solid transparent', borderRadius: '8px', color: format === 'image/webp' ? '#ec4899' : '#ffffff', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  WebP
                </button>
              </div>
            </div>

            <div style={{ flexGrow: 1 }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {activeItem && (
                <button 
                  onClick={() => handleDownloadSingle(activeItem)}
                  style={{ padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Icons.Download size={16} /> Download Active Image
                </button>
              )}

              <button 
                onClick={handleDownloadAllZip}
                disabled={isProcessing}
                style={{ padding: '14px', background: '#ec4899', border: 'none', color: '#ffffff', borderRadius: '8px', cursor: isProcessing ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.Archive size={18} />}
                Download All ({items.length}) ZIP
              </button>
            </div>
          </div>
        </div>
      )}

      <ImagePreviewModal
        isOpen={!!zoomItem}
        imageUrl={zoomItem?.url || null}
        title={zoomItem?.title}
        onClose={() => setZoomItem(null)}
      />
    </div>
  );
}
