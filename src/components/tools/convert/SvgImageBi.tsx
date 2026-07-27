import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { downloadFileWithDialog } from '../../../utils/fileSaver';
import { sanitizeUrl } from '../../../utils/sanitize';
import JSZip from 'jszip';
import { useNavigate } from 'react-router-dom';
import { ImagePreviewModal } from '../../common/ImagePreviewModal';

interface SvgResult {
  id: string;
  fileName: string;
  blob: Blob;
}

export function SvgImageBi() {
  const navigate = useNavigate();
  const [zoomItem, setZoomItem] = useState<{ url: string; title: string } | null>(null);
  const [mode, setMode] = useState<'svgToImg' | 'imgToSvg'>(() => {
    try {
      const saved = localStorage.getItem('airgap_svg_img_mode');
      if (saved === 'svgToImg' || saved === 'imgToSvg') return saved;
    } catch(e) {}
    return 'svgToImg';
  });

  const changeMode = (newMode: 'svgToImg' | 'imgToSvg') => {
    setMode(newMode);
    setFiles([]);
    setResults([]);
    try { localStorage.setItem('airgap_svg_img_mode', newMode); } catch(e) {}
  };

  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<SvgResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveFileWithPicker = async (blob: Blob, suggestedName: string) => {
    let mime = blob.type;
    if (suggestedName.toLowerCase().endsWith('.png')) mime = 'image/png';
    else if (suggestedName.toLowerCase().endsWith('.svg')) mime = 'image/svg+xml';

    const typedBlob = blob.type === mime ? blob : new Blob([blob], { type: mime });

    await downloadFileWithDialog(typedBlob, suggestedName);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (e.dataTransfer.files.length) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const convertSvgToPngBlob = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const svgData = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 800;
          canvas.height = img.height || 600;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Failed to create PNG blob.'));
            }, 'image/png');
          } else {
            reject(new Error('Failed to get 2d context.'));
          }
        };
        img.onerror = () => reject(new Error(`Invalid SVG file "${file.name}"`));
        img.src = svgData;
      };
      reader.onerror = () => reject(new Error(`Failed to read file "${file.name}"`));
      reader.readAsDataURL(file);
    });
  };

  const convertImgToSvgBlob = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imgData = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <image x="0" y="0" width="${img.width}" height="${img.height}" xlink:href="${imgData}" />
</svg>`;
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          resolve(blob);
        };
        img.onerror = () => reject(new Error(`Invalid image file "${file.name}"`));
        img.src = imgData;
      };
      reader.onerror = () => reject(new Error(`Failed to read file "${file.name}"`));
      reader.readAsDataURL(file);
    });
  };

  const processSingleFile = async (targetFile: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      if (mode === 'svgToImg') {
        const blob = await convertSvgToPngBlob(targetFile);
        const outName = `${targetFile.name.replace(/\.[^/.]+$/, '')}.png`;
        const newRes: SvgResult = { id: Math.random().toString(36).substring(2, 9), fileName: outName, blob };
        setResults(prev => [...prev.filter(r => r.fileName !== outName), newRes]);
      } else {
        const blob = await convertImgToSvgBlob(targetFile);
        const outName = `${targetFile.name.replace(/\.[^/.]+$/, '')}.svg`;
        const newRes: SvgResult = { id: Math.random().toString(36).substring(2, 9), fileName: outName, blob };
        setResults(prev => [...prev.filter(r => r.fileName !== outName), newRes]);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Error processing file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processAllFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const newResults: SvgResult[] = [];
      for (const file of files) {
        try {
          if (mode === 'svgToImg') {
            const blob = await convertSvgToPngBlob(file);
            const outName = `${file.name.replace(/\.[^/.]+$/, '')}.png`;
            newResults.push({ id: Math.random().toString(36).substring(2, 9), fileName: outName, blob });
          } else {
            const blob = await convertImgToSvgBlob(file);
            const outName = `${file.name.replace(/\.[^/.]+$/, '')}.svg`;
            newResults.push({ id: Math.random().toString(36).substring(2, 9), fileName: outName, blob });
          }
        } catch (e: any) {
          console.error(e);
          setErrorMessage(`Skipped "${file.name}": ${e?.message || 'Invalid file'}`);
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
    results.forEach(res => {
      zip.file(res.fileName, res.blob);
    });
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    await saveFileWithPicker(zipBlob, mode === 'svgToImg' ? 'converted_png_images.zip' : 'converted_svg_files.zip');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          SVG ⇄ Image Converter
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Export SVGs into standard PNG images, or wrap your JPEG/PNGs into an SVG container format.
        </p>
      </div>

      {errorMessage && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#fca5a5', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Icons.AlertCircle size={18} color="#ef4444" />
          {errorMessage}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', background: '#1c1c1e', padding: '6px', borderRadius: '12px', marginBottom: '24px', width: 'fit-content' }}>
        <button
          onClick={() => changeMode('svgToImg')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: mode === 'svgToImg' ? '600' : '500',
            background: mode === 'svgToImg' ? '#3a3a3c' : 'transparent',
            color: mode === 'svgToImg' ? '#ffffff' : '#8e8e93',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          SVG to PNG
        </button>
        <button
          onClick={() => changeMode('imgToSvg')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: mode === 'imgToSvg' ? '600' : '500',
            background: mode === 'imgToSvg' ? '#3a3a3c' : 'transparent',
            color: mode === 'imgToSvg' ? '#ffffff' : '#8e8e93',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Image to SVG
        </button>
      </div>

      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        style={{
          border: '2px dashed rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '60px 40px',
          textAlign: 'center',
          background: '#121214',
          marginBottom: '24px',
          cursor: 'pointer',
        }}
        onClick={() => document.getElementById('fileUpload')?.click()}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(234, 179, 8, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <Icons.Image size={32} color="#eab308" />
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
          Select or Drop Multiple {mode === 'svgToImg' ? 'SVG' : 'Image (PNG/JPG)'} Files
        </div>
        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
          You can add as many files as you like. All processing is 100% offline.
        </div>
        <input 
          id="fileUpload" 
          type="file" 
          accept={mode === 'svgToImg' ? '.svg' : 'image/png, image/jpeg'} 
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
            <button 
              onClick={() => { setFiles([]); setResults([]); }} 
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
            >
              Clear List
            </button>
          </div>

          <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '20px' }}>
            {files.map((file, i) => {
              const expectedName = `${file.name.replace(/\.[^/.]+$/, '')}.${mode === 'svgToImg' ? 'png' : 'svg'}`;
              const convertedItem = results.find(r => r.fileName === expectedName);

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', background: '#2c2c2e', borderRadius: '8px', marginBottom: '8px' }}>
                  <img 
                    src={sanitizeUrl(URL.createObjectURL(file))} 
                    alt={file.name} 
                    onClick={() => setZoomItem({ url: sanitizeUrl(URL.createObjectURL(file)), title: file.name })}
                    title="Click to enlarge preview"
                    style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', background: '#121214', flexShrink: 0, cursor: 'zoom-in' }} 
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
                        background: '#eab308',
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

          {files.length > 1 && (
            <button
              onClick={processAllFiles}
              disabled={isProcessing}
              style={{ 
                width: '100%',
                padding: '12px 20px', 
                background: 'transparent', 
                border: '1px solid #eab308', 
                color: '#eab308', 
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

          {results.length > 1 && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #2c2c2e', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleDownloadAllResults}
                style={{ background: '#eab308', border: 'none', color: '#000', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Icons.Download size={14} />
                Download All Converted Files (ZIP)
              </button>
            </div>
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
