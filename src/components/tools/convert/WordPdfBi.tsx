import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import mammoth from 'mammoth';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { downloadFileWithDialog } from '../../../utils/fileSaver';
import JSZip from 'jszip';
import { useNavigate } from 'react-router-dom';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ConvertedResult {
  id: string;
  fileName: string;
  blob: Blob;
}

export function WordPdfBi() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'wordToPdf' | 'pdfToWord'>(() => {
    try {
      const saved = localStorage.getItem('airgap_word_pdf_mode');
      if (saved === 'wordToPdf' || saved === 'pdfToWord') return saved;
    } catch(e) {}
    return 'wordToPdf';
  });
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ConvertedResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const changeMode = (newMode: 'wordToPdf' | 'pdfToWord') => {
    setMode(newMode);
    setFiles([]);
    setResults([]);
    try { localStorage.setItem('airgap_word_pdf_mode', newMode); } catch(e) {}
  };

  const saveFileWithPicker = async (blob: Blob, suggestedName: string, fallbackMime?: string) => {
    let mime = fallbackMime || blob.type;
    if (suggestedName.toLowerCase().endsWith('.docx')) {
      mime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (suggestedName.toLowerCase().endsWith('.xlsx')) {
      mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (suggestedName.toLowerCase().endsWith('.pptx')) {
      mime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else if (suggestedName.toLowerCase().endsWith('.pdf')) {
      mime = 'application/pdf';
    }

    const typedBlob = blob.type === mime ? blob : new Blob([blob], { type: mime });

    await downloadFileWithDialog(typedBlob, suggestedName);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (results.length > 0) setResults([]);
    if (e.dataTransfer.files.length) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (results.length > 0) setResults([]);
    if (e.target.files && e.target.files.length) {
      const newFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };

  const processSingleWordToPdf = async (targetFile: File) => {
    if (!targetFile.name.toLowerCase().endsWith('.docx')) {
      setErrorMessage(`Skipping "${targetFile.name}": Only .docx format is supported.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const buffer = await targetFile.arrayBuffer();
      const header = new Uint8Array(buffer.slice(0, 4));

      if (header[0] === 0xD0 && header[1] === 0xCF && header[2] === 0x11 && header[3] === 0xE0) {
        setErrorMessage(`"${targetFile.name}": Older binary .doc format is not supported.`);
        setIsProcessing(false);
        return;
      }

      if (header[0] !== 0x50 || header[1] !== 0x4B) {
        setErrorMessage(`"${targetFile.name}": Corrupted or invalid .docx file.`);
        setIsProcessing(false);
        return;
      }

      const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
      const htmlContent = result.value || '<p>No content found in document.</p>';

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1000px';
      iframe.style.height = '1000px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Could not create print frame.');
      }

      const printHtml = `
        <!DOCTYPE html>
        <html dir="auto">
        <head>
          <title>${targetFile.name.replace(/\.[^/.]+$/, '')}</title>
          <style>
            @page {
              margin: 20mm;
              size: A4;
            }
            body {
              font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.5;
              color: #000;
              margin: 0;
              padding: 0;
            }
            p { margin-bottom: 1em; }
            h1, h2, h3, h4 { margin-top: 1.5em; margin-bottom: 0.5em; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
            th, td { border: 1px solid #000; padding: 4px 8px; }
          </style>
        </head>
        <body>
          ${htmlContent}
        </body>
        </html>
      `;

      iframe.srcdoc = printHtml;

      await new Promise(resolve => setTimeout(resolve, 500));

      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }

      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch(e) {}
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Error converting "${targetFile.name}": ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processSinglePdfToWord = async (targetFile: File) => {
    if (!targetFile.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage(`Skipping "${targetFile.name}": Only PDF format is supported.`);
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const buffer = await targetFile.arrayBuffer();
      const dataTypedArray = new Uint8Array(buffer.slice(0));
      const pdf = await pdfjsLib.getDocument({
        data: dataTypedArray,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
        verbosity: 0
      }).promise;

      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        fullText += pageText + '\n\n';
      }

      const doc = new Document({
        sections: [{
          properties: {},
          children: fullText.split('\n').map(line => 
            new Paragraph({
              children: [new TextRun(line)],
            })
          ),
        }],
      });

      const docxBlob = await Packer.toBlob(doc);
      const newResult: ConvertedResult = {
        id: Math.random().toString(36).substring(2, 9),
        fileName: `${targetFile.name.replace(/\.[^/.]+$/, '')}.docx`,
        blob: docxBlob
      };

      setResults(prev => [...prev.filter(r => r.fileName !== newResult.fileName), newResult]);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Failed to convert "${targetFile.name}": ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processWordToPdf = async () => {
    if (files.length === 0) return;
    
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const combinedHtmlSections: string[] = [];

      for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.docx')) {
          setErrorMessage(`Skipping "${file.name}": Only .docx format is supported.`);
          continue;
        }

        const buffer = await file.arrayBuffer();
        const header = new Uint8Array(buffer.slice(0, 4));

        if (header[0] === 0xD0 && header[1] === 0xCF && header[2] === 0x11 && header[3] === 0xE0) {
          setErrorMessage(`Skipping "${file.name}": This is an older binary .doc file.`);
          continue;
        }

        if (header[0] !== 0x50 || header[1] !== 0x4B) {
          setErrorMessage(`Skipping "${file.name}": Corrupted or invalid .docx file.`);
          continue;
        }

        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        const html = result.value || '<p>No content found in document.</p>';
        combinedHtmlSections.push(`
          <div class="document-section">
            <h2 class="doc-header">${file.name}</h2>
            ${html}
          </div>
        `);
      }

      if (combinedHtmlSections.length === 0) {
        setIsProcessing(false);
        return;
      }

      // Create an off-screen iframe for native browser printing
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-9999px';
      iframe.style.left = '-9999px';
      iframe.style.width = '1000px';
      iframe.style.height = '1000px';
      iframe.style.border = 'none';
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Could not create print frame.');
      }

      const printHtml = `
        <!DOCTYPE html>
        <html dir="auto">
        <head>
          <title>Converted Documents</title>
          <style>
            @page {
              margin: 20mm;
              size: A4;
            }
            body {
              font-family: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              font-size: 12pt;
              line-height: 1.5;
              color: #000;
              margin: 0;
              padding: 0;
            }
            .document-section {
              page-break-after: always;
              break-after: page;
            }
            .document-section:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .doc-header {
              border-bottom: 2px solid #333;
              padding-bottom: 6px;
              margin-bottom: 16px;
              font-size: 14pt;
            }
            p { margin-bottom: 1em; }
            h1, h2, h3, h4 { margin-top: 1.5em; margin-bottom: 0.5em; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 1em; }
            th, td { border: 1px solid #000; padding: 4px 8px; }
          </style>
        </head>
        <body>
          ${combinedHtmlSections.join('\n')}
        </body>
        </html>
      `;

      iframe.srcdoc = printHtml;

      await new Promise(resolve => setTimeout(resolve, 500));

      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      }

      setTimeout(() => {
        try { document.body.removeChild(iframe); } catch(e) {}
      }, 5000);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Error processing batch: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const processPdfToWord = async () => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setErrorMessage(null);
    setResults([]);

    try {
      const newResults: ConvertedResult[] = [];

      for (const file of files) {
        if (!file.name.toLowerCase().endsWith('.pdf')) {
          setErrorMessage(`Skipping "${file.name}": Only PDF format is supported.`);
          continue;
        }

        const buffer = await file.arrayBuffer();
        const dataTypedArray = new Uint8Array(buffer.slice(0));
        const pdf = await pdfjsLib.getDocument({
          data: dataTypedArray,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
          standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
          verbosity: 0
        }).promise;
        let fullText = '';

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map((item: any) => item.str).join(' ');
          fullText += pageText + '\n\n';
        }

        const doc = new Document({
          sections: [{
            properties: {},
            children: fullText.split('\n').map(line => 
              new Paragraph({
                children: [new TextRun(line)],
              })
            ),
          }],
        });

        const docxBlob = await Packer.toBlob(doc);
        newResults.push({
          id: Math.random().toString(36).substring(2, 9),
          fileName: `${file.name.replace(/\.[^/.]+$/, '')}.docx`,
          blob: docxBlob
        });
      }

      setResults(newResults);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Failed to convert PDF to Word: ${err?.message || 'Unknown error'}`);
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
    await saveFileWithPicker(zipBlob, 'converted_word_documents.zip');
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Word ⇄ PDF Text Converter
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Extract text from Word documents and generate a PDF, or extract text from PDFs to create an editable Word document.
          <br/><span style={{ fontSize: '12px', color: '#06b6d4' }}>Note: Complex formatting, images, and tables are stripped out for offline security.</span>
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
          onClick={() => changeMode('wordToPdf')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: mode === 'wordToPdf' ? '600' : '500',
            background: mode === 'wordToPdf' ? '#3a3a3c' : 'transparent',
            color: mode === 'wordToPdf' ? '#ffffff' : '#8e8e93',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Word to PDF
        </button>
        <button
          onClick={() => changeMode('pdfToWord')}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: mode === 'pdfToWord' ? '600' : '500',
            background: mode === 'pdfToWord' ? '#3a3a3c' : 'transparent',
            color: mode === 'pdfToWord' ? '#ffffff' : '#8e8e93',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          PDF to Word
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
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(6, 182, 212, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <Icons.FileText size={32} color="#06b6d4" />
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
          Select or Drop Multiple {mode === 'wordToPdf' ? 'Word (.docx)' : 'PDF'} Files
        </div>
        <div style={{ fontSize: '13px', color: '#8e8e93' }}>
          You can add as many files as you like. All processing is 100% offline.
        </div>
        <input 
          id="fileUpload" 
          type="file" 
          accept={mode === 'wordToPdf' ? '.docx' : 'application/pdf'} 
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

          <div style={{ maxHeight: '280px', overflowY: 'auto', marginBottom: files.length > 1 && mode === 'pdfToWord' && files.some(f => !results.some(r => r.fileName === f.name.replace(/\.[^/.]+$/, '') + '.docx')) ? '20px' : '0' }}>
            {files.map((file, i) => {
              const expectedName = file.name.replace(/\.[^/.]+$/, '') + (mode === 'pdfToWord' ? '.docx' : '.pdf');
              const convertedItem = results.find(r => r.fileName === expectedName);

              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: '#2c2c2e', borderRadius: '8px', marginBottom: '8px' }}>
                  <Icons.FileText size={16} color="#06b6d4" />
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
                      onClick={() => mode === 'wordToPdf' ? processSingleWordToPdf(file) : processSinglePdfToWord(file)}
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

          {files.length > 1 && mode === 'pdfToWord' && files.some(f => !results.some(r => r.fileName === f.name.replace(/\.[^/.]+$/, '') + '.docx')) && (
            <button
              onClick={processPdfToWord}
              disabled={isProcessing}
              style={{ 
                width: '100%',
                padding: '12px 20px', 
                background: 'transparent', 
                border: '1px solid #06b6d4', 
                color: '#06b6d4', 
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
              Convert All Files
            </button>
          )}
        </div>
      )}
    </div>
  );
}
