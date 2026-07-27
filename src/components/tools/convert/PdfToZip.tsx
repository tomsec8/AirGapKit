import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import JSZip from 'jszip';
import { downloadFileWithDialog } from '../../../utils/fileSaver';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ZipResult {
  id: string;
  sourceFileName: string;
  zipName: string;
  blob: Blob;
}

export function PdfToZip() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ZipResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const saveFileWithPicker = async (blob: Blob, suggestedName: string) => {
    await downloadFileWithDialog(blob, suggestedName);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (e.dataTransfer.files.length) {
      const pdfs = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
      if (pdfs.length === 0) {
        setErrorMessage('Please upload valid PDF files.');
        return;
      }
      setFiles(prev => [...prev, ...pdfs]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files.length) {
      const pdfs = Array.from(e.target.files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
      setFiles(prev => [...prev, ...pdfs]);
    }
  };

  const convertPdfToZipBlob = async (file: File): Promise<Blob> => {
    const arrayBuffer = await file.arrayBuffer();
    const dataTypedArray = new Uint8Array(arrayBuffer.slice(0));
    const pdf = await pdfjsLib.getDocument({
      data: dataTypedArray,
      disableRange: true,
      disableStream: true,
      disableAutoFetch: true,
      verbosity: 0
    }).promise;
    
    const zip = new JSZip();
    for (let i = 1; i <= pdf.numPages; i++) {
      setProgress(Math.round((i / pdf.numPages) * 100));
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        await page.render({ canvasContext: ctx, viewport } as any).promise;
        const imgData = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        zip.file(`page_${i}.jpg`, imgData, { base64: true });
      }
    }
    
    return await zip.generateAsync({ type: 'blob' });
  };

  const processSingleFile = async (targetFile: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const zipBlob = await convertPdfToZipBlob(targetFile);
      const zipName = `${targetFile.name.replace(/\.[^/.]+$/, '')}_pages.zip`;
      const resItem: ZipResult = {
        id: Math.random().toString(36).substring(2, 9),
        sourceFileName: targetFile.name,
        zipName,
        blob: zipBlob
      };
      setResults(prev => [...prev.filter(r => r.sourceFileName !== targetFile.name), resItem]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Failed to convert "${targetFile.name}": ${err?.message || 'Error'}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const processAllFiles = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const newResults: ZipResult[] = [];
      for (const file of files) {
        try {
          const zipBlob = await convertPdfToZipBlob(file);
          const zipName = `${file.name.replace(/\.[^/.]+$/, '')}_pages.zip`;
          newResults.push({
            id: Math.random().toString(36).substring(2, 9),
            sourceFileName: file.name,
            zipName,
            blob: zipBlob
          });
        } catch (e: any) {
          console.error(e);
        }
      }
      setResults(newResults);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Failed batch conversion: ${err?.message || 'Error'}`);
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleDownloadAllMasterZip = async () => {
    if (results.length === 0) return;
    if (results.length === 1) {
      await saveFileWithPicker(results[0].blob, results[0].zipName);
      return;
    }
    const masterZip = new JSZip();
    results.forEach(res => {
      masterZip.file(res.zipName, res.blob);
    });
    const masterBlob = await masterZip.generateAsync({ type: 'blob' });
    await saveFileWithPicker(masterBlob, 'all_pdf_page_zips.zip');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Batch PDF to ZIP Converter
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Export pages of PDF documents as JPEG image archives packed into ZIP files 100% offline.
        </p>
      </div>

      {errorMessage && (
        <div style={{ padding: '12px 16px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#fca5a5', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Icons.AlertCircle size={18} color="#ef4444" />
          {errorMessage}
        </div>
      )}

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
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <Icons.Archive size={32} color="#a855f7" />
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
          Select or Drop Multiple PDF Files
        </div>
        <input 
          id="fileUpload" 
          type="file" 
          accept="application/pdf" 
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
                  onClick={handleDownloadAllMasterZip}
                  style={{ background: '#a855f7', border: 'none', color: '#ffffff', padding: '6px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Icons.Download size={14} />
                  Download All ZIPs
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

          <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: files.length > 1 && files.some(f => !results.some(r => r.sourceFileName === f.name)) ? '20px' : '0' }}>
            {files.map((file, i) => {
              const convertedItem = results.find(r => r.sourceFileName === file.name);

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#2c2c2e', borderRadius: '8px', marginBottom: '8px' }}>
                  <Icons.FileText size={16} color="#a855f7" />
                  <div style={{ flex: 1, fontSize: '13px', color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {file.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8e8e93' }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </div>

                  {convertedItem ? (
                    <button 
                      onClick={() => saveFileWithPicker(convertedItem.blob, convertedItem.zipName)}
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
                      Download ZIP
                    </button>
                  ) : (
                    <button 
                      onClick={() => processSingleFile(file)}
                      disabled={isProcessing}
                      style={{
                        background: '#a855f7',
                        border: 'none',
                        color: '#ffffff',
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
                      Convert to ZIP
                    </button>
                  )}

                  <button 
                    onClick={() => {
                      setFiles(files.filter((_, idx) => idx !== i));
                      setResults(results.filter(r => r.sourceFileName !== file.name));
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: '4px' }}
                  >
                    <Icons.X size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          {files.length > 1 && files.some(f => !results.some(r => r.sourceFileName === f.name)) && (
            <button
              onClick={processAllFiles}
              disabled={isProcessing}
              style={{ 
                width: '100%',
                padding: '12px 20px', 
                background: '#a855f7', 
                border: 'none', 
                color: '#ffffff', 
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
              {isProcessing ? `Zipping ${progress}%` : `Convert All PDFs to ZIPs (${files.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
