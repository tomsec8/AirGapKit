import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { downloadFileWithDialog } from '../../../utils/fileSaver';
import JSZip from 'jszip';
import { ImagePreviewModal } from '../../common/ImagePreviewModal';

interface ImageResult {
  id: string;
  fileName: string;
  blob: Blob;
}

import { sanitizeUrl } from '../../../utils/sanitize';

export function ImageConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ImageResult[]>([]);
  const [targetFormat, setTargetFormat] = useState<'image/png' | 'image/jpeg' | 'image/webp'>('image/webp');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [zoomItem, setZoomItem] = useState<{ url: string; title: string } | null>(null);

  const saveFileWithPicker = async (blob: Blob, suggestedName: string) => {
    await downloadFileWithDialog(blob, suggestedName);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (e.dataTransfer.files.length) {
      const newFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
      if (newFiles.length === 0) {
        setErrorMessage('Please upload valid image files.');
        return;
      }
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length) {
      const newFiles = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const convertImageBlob = (file: File, format: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgData = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to convert image.'));
            }, format, 0.9);
          } else {
            reject(new Error('Failed to get 2d context.'));
          }
        };
        img.onerror = () => reject(new Error(`Invalid image "${file.name}"`));
        img.src = imgData;
      };
      reader.onerror = () => reject(new Error(`Failed to read file "${file.name}"`));
      reader.readAsDataURL(file);
    });
  };

  const processSingleFile = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const blob = await convertImageBlob(file, targetFormat);
      const ext = targetFormat.split('/')[1];
      const outName = `${file.name.replace(/\.[^/.]+$/, '')}.${ext}`;
      const newRes: ImageResult = { id: Math.random().toString(36).substring(2, 9), fileName: outName, blob };
      setResults(prev => [...prev.filter(r => r.fileName !== outName), newRes]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Error converting image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAllFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const newResults: ImageResult[] = [];
      const ext = targetFormat.split('/')[1];
      for (const file of files) {
        try {
          const blob = await convertImageBlob(file, targetFormat);
          const outName = `${file.name.replace(/\.[^/.]+$/, '')}.${ext}`;
          newResults.push({ id: Math.random().toString(36).substring(2, 9), fileName: outName, blob });
        } catch (e: any) {
          console.error(e);
        }
      }
      setResults(newResults);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Error processing batch: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadAllResults = async () => {
    if (results.length === 0) return;
    if (results.length === 1) {
      await saveFileWithPicker(results[0].blob, results[0].fileName);
      return;
    }
    const zip = new JSZip();
    results.forEach(res => zip.file(res.fileName, res.blob));
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    await saveFileWithPicker(zipBlob, 'converted_images.zip');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Batch Image Format Converter
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Convert PNG, JPEG, WebP images between formats instantly 100% offline.
        </p>
      </div>

      {errorMessage && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#fca5a5', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Icons.AlertCircle size={18} color="#ef4444" />
          {errorMessage}
        </div>
      )}

      {/* Target Format Selector */}
      <div style={{ marginBottom: '24px', background: '#1c1c1e', padding: '16px', borderRadius: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>Target Format:</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          {(['image/webp', 'image/png', 'image/jpeg'] as const).map(fmt => (
            <button
              key={fmt}
              onClick={() => setTargetFormat(fmt)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '13px',
                fontWeight: targetFormat === fmt ? '600' : '500',
                background: targetFormat === fmt ? '#06b6d4' : '#2c2c2e',
                color: targetFormat === fmt ? '#000000' : '#8e8e93',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {fmt.split('/')[1].toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        style={{
          border: '2px dashed rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '50px 40px',
          textAlign: 'center',
          background: '#121214',
          marginBottom: '24px',
          cursor: 'pointer',
        }}
        onClick={() => document.getElementById('fileUpload')?.click()}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <Icons.Image size={32} color="#06b6d4" />
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
          Select or Drop Multiple Images (PNG, JPG, WebP)
        </div>
        <input 
          id="fileUpload" 
          type="file" 
          accept="image/*" 
          multiple
          style={{ display: 'none' }} 
          onChange={handleFileSelect}
        />
      </div>

      {files.length > 0 && (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
              Selected Files ({files.length})
            </span>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              {results.length > 1 && (
                <button 
                  onClick={handleDownloadAllResults}
                  style={{ background: '#06b6d4', border: 'none', color: '#000', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icons.Download size={14} />
                  Download All (ZIP)
                </button>
              )}
              <button 
                onClick={() => { setFiles([]); setResults([]); }} 
                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
              >
                Clear List
              </button>
            </div>
          </div>

          <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: files.length > 1 && files.some(f => !results.some(r => r.fileName === f.name.replace(/\.[^/.]+$/, '') + '.' + targetFormat.split('/')[1])) ? '20px' : '0' }}>
            {files.map((file, i) => {
              const ext = targetFormat.split('/')[1];
              const expectedName = `${file.name.replace(/\.[^/.]+$/, '')}.${ext}`;
              const convertedItem = results.find(r => r.fileName === expectedName);

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', background: '#2c2c2e', borderRadius: '8px', marginBottom: '8px' }}>
                  <img 
                    src={sanitizeUrl(URL.createObjectURL(file))} 
                    alt={file.name} 
                    onClick={() => setZoomItem({ url: sanitizeUrl(URL.createObjectURL(file)), title: file.name })}
                    title="Click to enlarge preview"
                    style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', background: '#121214', cursor: 'zoom-in' }} 
                  />
                  <div style={{ flex: 1, fontSize: '13px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8e8e93' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>

                  {convertedItem ? (
                    <button 
                      onClick={() => saveFileWithPicker(convertedItem.blob, convertedItem.fileName)}
                      style={{
                        background: '#10b981',
                        border: 'none',
                        color: '#000000',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icons.Download size={12} />
                      Download
                    </button>
                  ) : (
                    <button 
                      onClick={() => processSingleFile(file)}
                      disabled={isProcessing}
                      style={{
                        background: '#06b6d4',
                        border: 'none',
                        color: '#000000',
                        padding: '5px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Icons.Play size={12} />
                      Convert
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      setFiles(files.filter((_, idx) => idx !== i));
                      setResults(results.filter(r => r.fileName !== expectedName));
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: '4px' }}
                  >
                    <Icons.X size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {files.length > 1 && files.some(f => !results.some(r => r.fileName === f.name.replace(/\.[^/.]+$/, '') + '.' + targetFormat.split('/')[1])) && (
            <button
              onClick={processAllFiles}
              disabled={isProcessing}
              style={{ 
                width: '100%',
                padding: '12px 20px', 
                background: '#06b6d4', 
                border: 'none', 
                color: '#000000', 
                borderRadius: '10px', 
                cursor: isProcessing ? 'not-allowed' : 'pointer', 
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '14px'
              }}
            >
              {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.Play size={18} />}
              Convert All Files ({files.length})
            </button>
          )}
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
