import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { useNavigate } from 'react-router-dom';
import { ImagePreviewModal } from '../../common/ImagePreviewModal';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ProcessedResult {
  id: string;
  fileName: string;
  numPages: number;
  blobs: { pageNum: number; blob: Blob }[];
}

export function PdfImageBi() {
  const navigate = useNavigate();
  const [zoomItem, setZoomItem] = useState<{ url: string; title: string } | null>(null);
  const [mode, setMode] = useState<'pdfToImg' | 'imgToPdf'>(() => {
    try {
      const saved = localStorage.getItem('airgap_pdf_img_mode');
      if (saved === 'pdfToImg' || saved === 'imgToPdf') return saved;
    } catch(e) {}
    return 'pdfToImg';
  });

  const changeMode = (newMode: 'pdfToImg' | 'imgToPdf') => {
    setMode(newMode);
    setFiles([]);
    setResults([]);
    try { localStorage.setItem('airgap_pdf_img_mode', newMode); } catch(e) {}
  };

  const [mergeImages, setMergeImages] = useState(true);
  const [extractSeparate, setExtractSeparate] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ProcessedResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressText, setProgressText] = useState('');

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    filterAndAddFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      filterAndAddFiles(Array.from(e.target.files));
    }
  };

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filterAndAddFiles = (newFiles: File[]) => {
    setErrorMessage(null);
    
    // If we already have results from a previous batch, auto-clear the queue for the next batch
    let currentFiles = results.length > 0 ? [] : files;

    if (mode === 'pdfToImg') {
      const pdfs = newFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
      const invalidCount = newFiles.length - pdfs.length;
      if (invalidCount > 0) {
        setErrorMessage(`${invalidCount} ${invalidCount === 1 ? 'file was' : 'files were'} ignored because only PDF files are allowed in this mode.`);
      }
      setFiles([...currentFiles, ...pdfs]);
    } else {
      const images = newFiles.filter(f => f.type.startsWith('image/'));
      const invalidCount = newFiles.length - images.length;
      if (invalidCount > 0) {
        setErrorMessage(`${invalidCount} ${invalidCount === 1 ? 'file was' : 'files were'} ignored because only image files are allowed in this mode.`);
      }
      setFiles([...currentFiles, ...images]);
    }
    setResults([]);
  };

  const saveFileWithPicker = async (blob: Blob, suggestedName: string) => {
    let mime = blob.type;
    if (suggestedName.toLowerCase().endsWith('.docx')) {
      mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (suggestedName.toLowerCase().endsWith('.pdf')) {
      mime = 'application/pdf';
    } else if (suggestedName.toLowerCase().endsWith('.png')) {
      mime = 'image/png';
    } else if (suggestedName.toLowerCase().endsWith('.jpg') || suggestedName.toLowerCase().endsWith('.jpeg')) {
      mime = 'image/jpeg';
    }

    const typedBlob = blob.type === mime ? blob : new Blob([blob], { type: mime });

    try {
      if (typeof chrome !== 'undefined' && chrome.downloads) {
        const url = URL.createObjectURL(typedBlob);
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
    saveAs(typedBlob, suggestedName);
  };

  // Convert multiple PDFs to Images securely
  const processPdfToImageBatch = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    const newResults: ProcessedResult[] = [];

    try {
      for (let fIdx = 0; fIdx < files.length; fIdx++) {
        const file = files[fIdx];
        setProgressText(`Converting ${file.name} (${fIdx + 1}/${files.length})...`);
        
        let pdf: pdfjsLib.PDFDocumentProxy | null = null;
        try {
          const arrayBuffer = await file.arrayBuffer();
          const header = new Uint8Array(arrayBuffer.slice(0, 4));
          
          // Check for %PDF magic header (%PDF is 0x25, 0x50, 0x44, 0x46)
          if (header[0] !== 0x25 || header[1] !== 0x50 || header[2] !== 0x44 || header[3] !== 0x46) {
            throw new Error(`"${file.name}" is a spoofed or invalid file. It does not have a valid %PDF header.`);
          }

          // Use slice(0) to create a clean, un-transferred Uint8Array
          const dataTypedArray = new Uint8Array(arrayBuffer.slice(0));
          
          pdf = await pdfjsLib.getDocument({ 
            data: dataTypedArray,
            disableRange: true,
            disableStream: true,
            disableAutoFetch: true,
            stopAtErrors: false,
            verbosity: 0
          }).promise;

          if (extractSeparate) {
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 2.0 });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                await page.render({ canvasContext: ctx, viewport } as any).promise;
                await new Promise<void>((resolve) => {
                  canvas.toBlob((b) => {
                    if (b) {
                      newResults.push({
                        id: Math.random().toString(36).substr(2, 9),
                        fileName: `${file.name.replace(/\.[^/.]+$/, '')}_page_${i}`,
                        numPages: 1,
                        blobs: [{ pageNum: i, blob: b }]
                      });
                    }
                    resolve();
                  }, 'image/jpeg', 0.9);
                });
              }
            }
          } else {
            const pageBlobs: { pageNum: number; blob: Blob }[] = [];
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const viewport = page.getViewport({ scale: 2.0 });
              const canvas = document.createElement('canvas');
              canvas.width = viewport.width;
              canvas.height = viewport.height;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                await page.render({ canvasContext: ctx, viewport } as any).promise;
                await new Promise<void>((resolve) => {
                  canvas.toBlob((b) => {
                    if (b) pageBlobs.push({ pageNum: i, blob: b });
                    resolve();
                  }, 'image/jpeg', 0.9);
                });
              }
            }
            newResults.push({
              id: Math.random().toString(36).substr(2, 9),
              fileName: file.name.replace(/\.[^/.]+$/, ''),
              numPages: pdf.numPages,
              blobs: pageBlobs
            });
          }
        } catch (fileErr: any) {
          console.error(`Error processing file ${file.name}:`, fileErr);
          setErrorMessage(`Failed to process "${file.name}": ${fileErr?.message || JSON.stringify(fileErr) || 'Unknown error'}`);
        } finally {
          if (pdf) {
            try { await pdf.cleanup(); (pdf as any).destroy?.(); } catch (e) { /* ignore cleanup error */ }
          }
        }
      }

      setResults(newResults);
    } catch (err) {
      console.error(err);
      setErrorMessage('Unexpected error during batch conversion');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  // Convert Images to PDFs (Merge or Separate)
  const processImageToPdfBatch = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    setProgressText('Creating PDFs from images...');
    const newResults: ProcessedResult[] = [];

    try {
      if (mergeImages) {
        const pdfDoc = await PDFDocument.create();
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setProgressText(`Adding ${file.name} (${i + 1}/${files.length})...`);
          const arrayBuffer = await file.arrayBuffer();
          let image;

          if (file.type === 'image/png') {
            image = await pdfDoc.embedPng(arrayBuffer);
          } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            image = await pdfDoc.embedJpg(arrayBuffer);
          } else {
            continue;
          }

          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
        }
        
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });

        newResults.push({
          id: 'img-to-pdf-1',
          fileName: 'combined_images',
          numPages: files.length,
          blobs: [{ pageNum: 1, blob }]
        });
      } else {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setProgressText(`Converting ${file.name} (${i + 1}/${files.length})...`);
          const pdfDoc = await PDFDocument.create();
          const arrayBuffer = await file.arrayBuffer();
          let image;

          if (file.type === 'image/png') {
            image = await pdfDoc.embedPng(arrayBuffer);
          } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
            image = await pdfDoc.embedJpg(arrayBuffer);
          } else {
            continue;
          }

          const page = pdfDoc.addPage([image.width, image.height]);
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
          const pdfBytes = await pdfDoc.save();
          const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });

          newResults.push({
            id: Math.random().toString(36).substr(2, 9),
            fileName: file.name.replace(/\.[^/.]+$/, ''),
            numPages: 1,
            blobs: [{ pageNum: 1, blob }]
          });
        }
      }

      setResults(newResults);
    } catch (err) {
      console.error(err);
      alert('Error creating PDF');
    } finally {
      setIsProcessing(false);
      setProgressText('');
    }
  };

  // Download Single Item
  const handleDownloadItem = async (item: ProcessedResult) => {
    if (mode === 'imgToPdf') {
      const blob = item.blobs[0]?.blob;
      if (blob) {
        await saveFileWithPicker(blob, `${item.fileName}.pdf`);
      }
      return;
    }

    // PDF to Img mode
    if (item.numPages === 1 && item.blobs.length === 1) {
      await saveFileWithPicker(item.blobs[0].blob, `${item.fileName}.jpg`);
    } else {
      const zip = new JSZip();
      item.blobs.forEach((b) => {
        zip.file(`page_${b.pageNum}.jpg`, b.blob);
      });
      const content = await zip.generateAsync({ type: 'blob' });
      await saveFileWithPicker(content, `${item.fileName}_images.zip`);
    }
  };

  // Download All as Master ZIP
  const handleDownloadAll = async () => {
    if (results.length === 0) return;

    if (results.length === 1) {
      handleDownloadItem(results[0]);
      return;
    }

    const masterZip = new JSZip();
    for (const item of results) {
      if (mode === 'imgToPdf') {
        masterZip.file(`${item.fileName}.pdf`, item.blobs[0].blob);
      } else {
        if (item.numPages === 1) {
          masterZip.file(`${item.fileName}.jpg`, item.blobs[0].blob);
        } else {
          const folder = masterZip.folder(item.fileName);
          item.blobs.forEach(b => {
            folder?.file(`page_${b.pageNum}.jpg`, b.blob);
          });
        }
      }
    }

    const masterContent = await masterZip.generateAsync({ type: 'blob' });
    await saveFileWithPicker(masterContent, 'all_converted_files.zip');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Batch PDF ⇄ Image Converter
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Batch convert multiple PDF documents or combine images offline. Download items individually or all at once.
        </p>
      </div>

      {/* Mode Selector */}
      <div style={{ display: 'flex', gap: '8px', background: '#1c1c1e', padding: '6px', borderRadius: '12px', marginBottom: '24px', width: 'fit-content' }}>
        <button
          onClick={() => changeMode('pdfToImg')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: mode === 'pdfToImg' ? '600' : '500',
            background: mode === 'pdfToImg' ? '#3a3a3c' : 'transparent',
            color: mode === 'pdfToImg' ? '#ffffff' : '#8e8e93',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          PDF to Images
        </button>
        <button
          onClick={() => changeMode('imgToPdf')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: mode === 'imgToPdf' ? '600' : '500',
            background: mode === 'imgToPdf' ? '#3a3a3c' : 'transparent',
            color: mode === 'imgToPdf' ? '#ffffff' : '#8e8e93',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Images to PDF
        </button>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '12px', marginBottom: '24px', color: '#f87171', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Icons.AlertTriangle size={20} style={{ flexShrink: 0 }} />
          <div style={{ flex: 1 }}>{errorMessage}</div>
          <button onClick={() => setErrorMessage(null)} style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer' }}>
            <Icons.X size={16} />
          </button>
        </div>
      )}

      {/* Drop Zone */}
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
          transition: 'all 0.2s ease'
        }}
        onClick={() => document.getElementById('fileUpload')?.click()}
      >
        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <Icons.Upload size={28} color="#a855f7" />
        </div>
        <div style={{ fontSize: '17px', fontWeight: '600', color: '#ffffff', marginBottom: '6px' }}>
          Select or Drop Multiple {mode === 'pdfToImg' ? 'PDF Files' : 'Images'}
        </div>
        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
          You can add as many files as you like. All processing is 100% offline.
        </div>
        <input 
          id="fileUpload" 
          type="file" 
          accept={mode === 'pdfToImg' ? 'application/pdf' : 'image/png, image/jpeg'} 
          multiple 
          style={{ display: 'none' }} 
          onChange={handleFileSelect}
        />
      </div>

      {/* Image to PDF Merge Option */}
      {mode === 'imgToPdf' && (
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#e5e5ea', fontSize: '14px' }}>
            <input 
              type="checkbox" 
              checked={mergeImages} 
              onChange={(e) => setMergeImages(e.target.checked)} 
              style={{ width: '16px', height: '16px', accentColor: '#a855f7', cursor: 'pointer' }}
            />
            Merge all images into a single PDF file
          </label>
        </div>
      )}

      {/* PDF to Image Extract Option */}
      {mode === 'pdfToImg' && (
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', color: '#e5e5ea', fontSize: '14px' }}>
            <input 
              type="checkbox" 
              checked={extractSeparate} 
              onChange={(e) => setExtractSeparate(e.target.checked)} 
              style={{ width: '16px', height: '16px', accentColor: '#a855f7', cursor: 'pointer' }}
            />
            Extract each page as an individual image (allows choosing what to download)
          </label>
        </div>
      )}

      {/* File List & Start Action */}
      {files.length > 0 && results.length === 0 && (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
              Selected Files ({files.length})
            </span>
            <button 
              onClick={() => setFiles([])} 
              style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px' }}
            >
              Clear List
            </button>
          </div>

          <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px' }}>
            {files.map((file, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 14px', background: '#2c2c2e', borderRadius: '8px', marginBottom: '8px' }}>
                {mode === 'imgToPdf' ? (
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={file.name} 
                    onClick={() => setZoomItem({ url: URL.createObjectURL(file), title: file.name })}
                    title="Click to enlarge preview"
                    style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '6px', background: '#121214', flexShrink: 0, cursor: 'zoom-in' }} 
                  />
                ) : (
                  <Icons.FileText size={16} color="#a855f7" />
                )}
                
                {mode === 'imgToPdf' && mergeImages && (
                  <div style={{ background: '#3a3a3c', color: '#ffffff', fontSize: '11px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold', flexShrink: 0 }}>
                    Page {i + 1}
                  </div>
                )}
                
                <div style={{ flex: 1, fontSize: '13px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {file.name}
                </div>
                <div style={{ fontSize: '11px', color: '#8e8e93' }}>
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </div>
                
                {mode === 'imgToPdf' && mergeImages && (
                  <div style={{ display: 'flex', gap: '4px', borderRight: '1px solid #3a3a3c', paddingRight: '10px', marginRight: '2px' }}>
                    <button 
                      onClick={() => {
                        if (i === 0) return;
                        const newFiles = [...files];
                        [newFiles[i - 1], newFiles[i]] = [newFiles[i], newFiles[i - 1]];
                        setFiles(newFiles);
                      }}
                      disabled={i === 0}
                      style={{ background: 'transparent', border: 'none', cursor: i === 0 ? 'default' : 'pointer', color: i === 0 ? '#48484a' : '#8e8e93', padding: '2px', display: 'flex' }}
                    >
                      <Icons.ChevronUp size={16} />
                    </button>
                    <button 
                      onClick={() => {
                        if (i === files.length - 1) return;
                        const newFiles = [...files];
                        [newFiles[i + 1], newFiles[i]] = [newFiles[i], newFiles[i + 1]];
                        setFiles(newFiles);
                      }}
                      disabled={i === files.length - 1}
                      style={{ background: 'transparent', border: 'none', cursor: i === files.length - 1 ? 'default' : 'pointer', color: i === files.length - 1 ? '#48484a' : '#8e8e93', padding: '2px', display: 'flex' }}
                    >
                      <Icons.ChevronDown size={16} />
                    </button>
                  </div>
                )}

                <button 
                  onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8e8e93' }}
                >
                  <Icons.X size={14} />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={mode === 'pdfToImg' ? processPdfToImageBatch : processImageToPdfBatch}
            disabled={isProcessing}
            style={{ 
              width: '100%',
              padding: '14px', 
              background: '#a855f7', 
              border: 'none', 
              color: '#ffffff', 
              borderRadius: '10px', 
              cursor: isProcessing ? 'not-allowed' : 'pointer', 
              fontSize: '15px', 
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isProcessing ? 0.7 : 1
            }}
          >
            {isProcessing ? (
              <>
                <Icons.Loader2 size={18} className="animate-spin" />
                {progressText || 'Processing Batch...'}
              </>
            ) : (
              <>
                <Icons.Play size={18} />
                Convert All {files.length} Files
              </>
            )}
          </button>
        </div>
      )}

    {results.length > 0 && (
      <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px', border: '1px solid rgba(168, 85, 247, 0.3)', marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
              Conversion Ready ({results.length})
            </h3>
            <p style={{ fontSize: '13px', color: '#8e8e93' }}>
              Download individual items below or download all together.
            </p>
          </div>
          <button
            onClick={handleDownloadAll}
            style={{ padding: '10px 18px', background: '#10b981', border: 'none', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Icons.Download size={16} /> Download All (ZIP)
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
          {results.map((res) => (
            <div key={res.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: '#2c2c2e', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icons.CheckCircle2 size={20} color="#10b981" />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff' }}>
                    {res.fileName}
                  </div>
                  <div style={{ fontSize: '12px', color: '#8e8e93' }}>
                    {mode === 'pdfToImg' ? `${res.numPages} ${res.numPages === 1 ? 'Page (JPG)' : 'Pages (ZIP)'}` : `PDF Document`}
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleDownloadItem(res)}
                style={{ padding: '8px 14px', background: '#3a3a3c', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Icons.Download size={14} color="#a855f7" /> Download
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => { setFiles([]); setResults([]); }}
          style={{ width: '100%', padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#8e8e93', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}
        >
          Start New Batch
        </button>
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
