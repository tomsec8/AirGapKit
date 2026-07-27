import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { saveAs } from 'file-saver';
import { PDFDocument } from 'pdf-lib';

interface PdfFileItem {
  id: string;
  file: File;
  pageCount: number;
}

export function MergePdf() {
  const [items, setItems] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

  const loadPdfFiles = async (newFiles: File[]) => {
    const validPdfs = newFiles.filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
    if (validPdfs.length === 0) return;

    setErrorMessage(null);

    const loadedItems: PdfFileItem[] = await Promise.all(
      validPdfs.map(async (file) => {
        let count = 0;
        try {
          const buffer = await file.arrayBuffer();
          const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true, throwOnInvalidObject: false } as any);
          count = pdfDoc.getPageCount();
        } catch (e) {
          console.warn(`Could not read page count for ${file.name}:`, e);
        }
        return {
          id: Math.random().toString(36).substring(2, 9),
          file,
          pageCount: count
        };
      })
    );

    setItems(prev => [...prev, ...loadedItems]);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      loadPdfFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      loadPdfFiles(Array.from(e.target.files));
    }
  };

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    setItems(prev => {
      const arr = [...prev];
      const temp = arr[index];
      arr[index] = arr[index - 1];
      arr[index - 1] = temp;
      return arr;
    });
  };

  const moveDown = (index: number) => {
    if (index === items.length - 1) return;
    setItems(prev => {
      const arr = [...prev];
      const temp = arr[index];
      arr[index] = arr[index + 1];
      arr[index + 1] = temp;
      return arr;
    });
  };

  const handleMerge = async () => {
    if (items.length < 2) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const mergedPdf = await PDFDocument.create();
      
      for (const item of items) {
        const arrayBuffer = await item.file.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true, throwOnInvalidObject: false } as any);
        const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      await saveFileWithPicker(blob, 'Merged_Document.pdf');
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Error merging PDFs: ${err?.message || 'Invalid or corrupted PDF file'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const totalPages = items.reduce((acc, curr) => acc + curr.pageCount, 0);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Merge PDF Documents
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Combine multiple PDF files into a single document offline with page inspection and Save As location selector.
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
          padding: '40px',
          textAlign: 'center',
          background: '#121214',
          marginBottom: '24px',
          cursor: 'pointer',
        }}
        onClick={() => document.getElementById('fileUpload')?.click()}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <Icons.Layers size={32} color="#f43f5e" />
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
          Select or Drop PDF Files Here
        </div>
        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
          Combine 2 or more PDFs into a single file 100% offline.
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

      {items.length > 0 && (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>
              Selected Files ({items.length})
            </h3>

            {totalPages > 0 && (
              <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '4px 12px', borderRadius: '20px', color: '#f43f5e', fontSize: '13px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icons.FileText size={14} /> Total: {totalPages} Pages
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px', maxHeight: '340px', overflowY: 'auto' }}>
            {items.map((item, index) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#2c2c2e', padding: '12px 16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                  <Icons.FileText size={22} color="#f43f5e" style={{ flexShrink: 0 }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {item.file.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8e8e93', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span>{(item.file.size / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span style={{ color: '#f43f5e', fontWeight: '600' }}>
                        {item.pageCount > 0 ? `${item.pageCount} ${item.pageCount === 1 ? 'Page' : 'Pages'}` : 'Counting pages...'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                  <button onClick={() => moveUp(index)} disabled={index === 0} style={{ background: 'transparent', border: 'none', color: index === 0 ? '#48484a' : '#8e8e93', cursor: index === 0 ? 'default' : 'pointer', padding: '4px' }}><Icons.ChevronUp size={18} /></button>
                  <button onClick={() => moveDown(index)} disabled={index === items.length - 1} style={{ background: 'transparent', border: 'none', color: index === items.length - 1 ? '#48484a' : '#8e8e93', cursor: index === items.length - 1 ? 'default' : 'pointer', padding: '4px' }}><Icons.ChevronDown size={18} /></button>
                  <button onClick={() => removeItem(item.id)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '6px', padding: '4px' }}><Icons.X size={18} /></button>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleMerge}
            disabled={isProcessing || items.length < 2}
            style={{ 
              width: '100%',
              padding: '14px', 
              background: '#f43f5e', 
              border: 'none', 
              color: '#ffffff', 
              borderRadius: '10px', 
              cursor: isProcessing || items.length < 2 ? 'not-allowed' : 'pointer', 
              fontWeight: '700',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.Layers size={18} />}
            {isProcessing ? 'Merging PDF Documents...' : `Merge ${items.length} PDFs (${totalPages} Total Pages)`}
          </button>
        </div>
      )}
    </div>
  );
}
