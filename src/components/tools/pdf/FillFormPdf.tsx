import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as Icons from 'lucide-react';
import { PDFDocument, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import * as pdfjsLib from 'pdfjs-dist';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

// Configure PDF.js worker to locally bundled asset
pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('/assets/pdf.worker.min.mjs');

interface FormFieldData {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'unknown';
  value: string | boolean;
  options?: string[];
}

interface OverlayField {
  id: string;
  fieldName: string;
  // Percentages relative to canvas dimensions for responsive positioning
  leftPct: number;
  topPct: number;
  widthPct: number;
  heightPct: number;
}

export function FillFormPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDocBytes, setPdfDocBytes] = useState<ArrayBuffer | null>(null);
  const [fields, setFields] = useState<FormFieldData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pagination and Canvas
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageCanvasRef = useRef<HTMLCanvasElement>(null);
  const pageWrapperRef = useRef<HTMLDivElement>(null);
  const [overlayFields, setOverlayFields] = useState<OverlayField[]>([]);
  const [showSidebar, setShowSidebar] = useState(false);

  const loadForm = async (selectedFile: File) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      const buffer = await selectedFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      let extractedFields: FormFieldData[] = [];

      try {
        const form = pdfDoc.getForm();
        const pdfFields = form.getFields();

        extractedFields = pdfFields.map(field => {
          const name = field.getName();
          if (field instanceof PDFTextField) {
            return { name, type: 'text' as const, value: field.getText() || '' };
          }
          if (field instanceof PDFCheckBox) {
            return { name, type: 'checkbox' as const, value: field.isChecked() };
          }
          if (field instanceof PDFRadioGroup) {
            return { name, type: 'radio' as const, value: field.getSelected() || '', options: field.getOptions() };
          }
          if (field instanceof PDFDropdown) {
            return { name, type: 'dropdown' as const, value: field.getSelected()[0] || '', options: field.getOptions() };
          }
          return { name, type: 'unknown' as const, value: '' };
        }).filter(f => f.type !== 'unknown');
      } catch (formErr) {
        console.warn('PDF has no interactive AcroForm fields:', formErr);
      }

      // Load for viewer
      const dataTypedArray = new Uint8Array(buffer.slice(0));
      const viewerPdf = await pdfjsLib.getDocument({
        data: dataTypedArray,
        disableRange: true,
        disableStream: true,
        disableAutoFetch: true,
        stopAtErrors: false,
        verbosity: 0
      }).promise;

      setNumPages(viewerPdf.numPages);
      setCurrentPage(1);
      setFile(selectedFile);
      setFields(extractedFields);
      setPdfDocBytes(buffer);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || 'Failed to read PDF form fields.');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render current PDF page on canvas and extract annotations
  useEffect(() => {
    if (!pdfDocBytes || !pageCanvasRef.current || currentPage < 1) return;

    let isMounted = true;
    const renderPage = async () => {
      try {
        const dataTypedArray = new Uint8Array(pdfDocBytes.slice(0));
        const pdf = await pdfjsLib.getDocument({
          data: dataTypedArray,
          disableRange: true,
          disableStream: true,
          disableAutoFetch: true,
          stopAtErrors: false,
          verbosity: 0
        }).promise;

        const page = await pdf.getPage(currentPage);
        const baseViewport = page.getViewport({ scale: 1 });

        // Use a reasonable scale for rendering
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const canvas = pageCanvasRef.current;
        if (!canvas || !isMounted) return;

        // Set internal pixel buffer
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          await page.render({ canvasContext: ctx, viewport } as any).promise;
        }

        // Extract annotations and convert to percentage-based coordinates
        // PDF coordinate system: origin bottom-left, y goes UP
        // Canvas coordinate system: origin top-left, y goes DOWN
        const pageWidth = baseViewport.width;   // PDF units at scale=1
        const pageHeight = baseViewport.height;  // PDF units at scale=1

        const annotations = await page.getAnnotations();
        const mapped: OverlayField[] = [];

        annotations.forEach((anno: any) => {
          if (anno.subtype === 'Widget' && anno.fieldName && anno.rect) {
            const [pdfX1, pdfY1, pdfX2, pdfY2] = anno.rect;
            
            // Convert PDF coordinates to percentage of page
            // PDF Y is bottom-up, so we flip it
            const leftPct = (Math.min(pdfX1, pdfX2) / pageWidth) * 100;
            const rightPct = (Math.max(pdfX1, pdfX2) / pageWidth) * 100;
            const widthPct = rightPct - leftPct;

            // Flip Y: top of page = 0%, bottom = 100%
            const topPct = ((pageHeight - Math.max(pdfY1, pdfY2)) / pageHeight) * 100;
            const bottomPct = ((pageHeight - Math.min(pdfY1, pdfY2)) / pageHeight) * 100;
            const heightPct = bottomPct - topPct;

            if (widthPct > 0 && heightPct > 0) {
              mapped.push({
                id: anno.id || `anno_${Math.random().toString(36).slice(2)}`,
                fieldName: anno.fieldName,
                leftPct,
                topPct,
                widthPct,
                heightPct
              });
            }
          }
        });

        if (isMounted) {
          setOverlayFields(mapped);
          // If no visual overlays found on this page, show the sidebar as fallback
          setShowSidebar(mapped.length === 0);
        }
      } catch (e) {
        console.warn('Page render error:', e);
        if (isMounted) {
          setOverlayFields([]);
          setShowSidebar(true);
        }
      }
    };

    renderPage();
    return () => { isMounted = false; };
  }, [currentPage, pdfDocBytes]);

  const handleFieldChange = useCallback((name: string, value: string | boolean) => {
    setFields(prev => prev.map(f => f.name === name ? { ...f, value } : f));
  }, []);

  const handleSave = async () => {
    if (!pdfDocBytes) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const pdfDoc = await PDFDocument.load(pdfDocBytes, { ignoreEncryption: true });
      let customFontLoaded = false;

      try {
        pdfDoc.registerFontkit(fontkit);
        const fontUrl = chrome.runtime.getURL('/fonts/Rubik-Regular.ttf');
        const fontRes = await fetch(fontUrl);
        if (fontRes.ok) {
          const fontBytes = await fontRes.arrayBuffer();
          const customFont = await pdfDoc.embedFont(fontBytes);
          
          const form = pdfDoc.getForm();
          fields.forEach(f => {
            try {
              if (f.type === 'text') {
                const tf = form.getTextField(f.name);
                tf.setText(f.value as string);
                tf.updateAppearances(customFont);
              } else if (f.type === 'checkbox') {
                const cb = form.getCheckBox(f.name);
                f.value ? cb.check() : cb.uncheck();
              } else if (f.type === 'radio') {
                form.getRadioGroup(f.name).select(f.value as string);
              } else if (f.type === 'dropdown') {
                form.getDropdown(f.name).select(f.value as string);
              }
            } catch (e) {
              console.warn(`Could not set field ${f.name}:`, e);
            }
          });

          form.updateFieldAppearances(customFont);
          customFontLoaded = true;
        }
      } catch (fontErr) {
        console.warn('Could not embed custom Unicode font, falling back:', fontErr);
      }

      if (!customFontLoaded) {
        try {
          const form = pdfDoc.getForm();
          fields.forEach(f => {
            try {
              if (f.type === 'text') {
                form.getTextField(f.name).setText(f.value as string);
              } else if (f.type === 'checkbox') {
                const cb = form.getCheckBox(f.name);
                f.value ? cb.check() : cb.uncheck();
              } else if (f.type === 'radio') {
                form.getRadioGroup(f.name).select(f.value as string);
              } else if (f.type === 'dropdown') {
                form.getDropdown(f.name).select(f.value as string);
              }
            } catch (e) {
              console.warn(`Could not set field ${f.name}:`, e);
            }
          });
        } catch (fErr) {
          console.warn('Form setting error:', fErr);
        }
      }

      // Save PDF with appearances
      const pdfBytes = await pdfDoc.save({ updateFieldAppearances: !customFontLoaded ? false : undefined });
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });

      await downloadFileWithDialog(blob, `filled_${file?.name || 'document.pdf'}`);
    } catch (err: any) {
      console.error('Error saving filled PDF:', err);
      setErrorMessage(err?.message || 'Error saving the filled form.');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div style={{ maxWidth: file ? '1200px' : '800px', margin: '0 auto', padding: '20px', transition: 'max-width 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
            Fill Form & Edit
          </h1>
          <p style={{ color: '#8e8e93', fontSize: '15px' }}>
            Fill interactive PDF form fields directly on the document.
          </p>
        </div>
        {file && (
          <div style={{ display: 'flex', gap: '10px', flexShrink: 0 }}>
            {/* Toggle sidebar for fields without overlays */}
            <button
              onClick={() => setShowSidebar(!showSidebar)}
              style={{ background: showSidebar ? '#2c2c2e' : '#1c1c1e', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', padding: '10px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Toggle field sidebar"
            >
              <Icons.List size={16} /> Fields
            </button>
            <button
              onClick={() => { setFile(null); setFields([]); setPdfDocBytes(null); setOverlayFields([]); }}
              style={{ background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', padding: '10px 14px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Icons.FileX size={16} /> Close
            </button>
            <button
              onClick={handleSave}
              disabled={isProcessing}
              style={{ background: '#f43f5e', border: 'none', color: '#ffffff', borderRadius: '8px', cursor: isProcessing ? 'not-allowed' : 'pointer', fontWeight: '600', fontSize: '13px', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isProcessing ? <Icons.Loader2 size={16} className="animate-spin" /> : <Icons.Save size={16} />}
              Save PDF
            </button>
          </div>
        )}
      </div>

      {errorMessage && (
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '16px', borderRadius: '12px', color: '#ef4444', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icons.AlertTriangle size={24} />
          {errorMessage}
        </div>
      )}

      {/* Upload Zone */}
      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) loadForm(e.dataTransfer.files[0]); }}
          style={{ border: '2px dashed rgba(255,255,255,0.1)', borderRadius: '16px', padding: '80px 40px', textAlign: 'center', background: '#121214', cursor: 'pointer' }}
          onClick={() => document.getElementById('fillFormUpload')?.click()}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.FileEdit size={32} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Drop Interactive PDF here
          </div>
          <div style={{ color: '#8e8e93', fontSize: '14px' }}>
            Works offline. Fields are rendered directly on the document.
          </div>
          <input
            id="fillFormUpload"
            type="file"
            accept="application/pdf"
            style={{ display: 'none' }}
            onChange={(e) => { if (e.target.files && e.target.files[0]) loadForm(e.target.files[0]); }}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: showSidebar ? '1fr 340px' : '1fr', gap: '20px' }}>
          {/* Main PDF Viewer with Overlays */}
          <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column' }}>
            {/* Navigation Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', background: '#09090b', padding: '10px 16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.FileText size={16} color="#8e8e93" />
                {file.name}
                <span style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#f43f5e', padding: '2px 8px', borderRadius: '100px', fontSize: '11px', marginLeft: '8px' }}>
                  {overlayFields.length} fields on page
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  style={{ background: '#2c2c2e', border: 'none', color: currentPage <= 1 ? '#555' : '#fff', borderRadius: '6px', padding: '5px 10px', cursor: currentPage <= 1 ? 'default' : 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  <Icons.ChevronLeft size={14} /> Prev
                </button>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#ffffff', minWidth: '80px', textAlign: 'center' }}>
                  Page {currentPage} / {numPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(numPages, prev + 1))}
                  disabled={currentPage >= numPages}
                  style={{ background: '#2c2c2e', border: 'none', color: currentPage >= numPages ? '#555' : '#fff', borderRadius: '6px', padding: '5px 10px', cursor: currentPage >= numPages ? 'default' : 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}
                >
                  Next <Icons.ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Canvas + Overlays */}
            <div
              ref={pageWrapperRef}
              style={{
                position: 'relative',
                lineHeight: 0,
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 6px 24px rgba(0,0,0,0.4)',
                userSelect: 'none'
              }}
            >
              <canvas
                ref={pageCanvasRef}
                style={{
                  display: 'block',
                  width: '100%',
                  height: 'auto',
                  borderRadius: '8px'
                }}
              />

              {/* Visual Field Overlays – positioned in percentages so they scale with CSS width:100% */}
              {overlayFields.map(ov => {
                const fieldData = fields.find(f => f.name === ov.fieldName);
                if (!fieldData) return null;

                const isCheck = fieldData.type === 'checkbox';
                const isRadio = fieldData.type === 'radio';
                const isDrop = fieldData.type === 'dropdown';

                return (
                  <div
                    key={ov.id}
                    style={{
                      position: 'absolute',
                      left: `${ov.leftPct}%`,
                      top: `${ov.topPct}%`,
                      width: `${ov.widthPct}%`,
                      height: `${ov.heightPct}%`,
                      zIndex: 10
                    }}
                  >
                    {fieldData.type === 'text' && (
                      <input
                        type="text"
                        value={fieldData.value as string}
                        onChange={(e) => handleFieldChange(ov.fieldName, e.target.value)}
                        placeholder={ov.fieldName.replace(/[._]/g, ' ')}
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'rgba(173, 216, 255, 0.15)',
                          border: '1.5px solid rgba(59, 130, 246, 0.5)',
                          borderRadius: '2px',
                          color: '#1a1a2e',
                          fontSize: '12px',
                          padding: '0 4px',
                          boxSizing: 'border-box',
                          outline: 'none',
                          fontFamily: 'sans-serif'
                        }}
                        onFocus={(e) => { e.target.style.background = 'rgba(173, 216, 255, 0.35)'; e.target.style.borderColor = '#3b82f6'; }}
                        onBlur={(e) => { e.target.style.background = 'rgba(173, 216, 255, 0.15)'; e.target.style.borderColor = 'rgba(59, 130, 246, 0.5)'; }}
                      />
                    )}

                    {isCheck && (
                      <input
                        type="checkbox"
                        checked={fieldData.value as boolean}
                        onChange={(e) => handleFieldChange(ov.fieldName, e.target.checked)}
                        style={{
                          width: '100%',
                          height: '100%',
                          margin: 0,
                          cursor: 'pointer',
                          accentColor: '#3b82f6'
                        }}
                      />
                    )}

                    {isRadio && (
                      <input
                        type="checkbox"
                        checked={!!fieldData.value}
                        onChange={(e) => handleFieldChange(ov.fieldName, e.target.checked)}
                        style={{
                          width: '100%',
                          height: '100%',
                          margin: 0,
                          cursor: 'pointer',
                          accentColor: '#3b82f6'
                        }}
                      />
                    )}

                    {isDrop && (
                      <select
                        value={fieldData.value as string}
                        onChange={(e) => handleFieldChange(ov.fieldName, e.target.value)}
                        style={{
                          width: '100%',
                          height: '100%',
                          background: 'rgba(173, 216, 255, 0.15)',
                          border: '1.5px solid rgba(59, 130, 246, 0.5)',
                          borderRadius: '2px',
                          color: '#1a1a2e',
                          fontSize: '12px',
                          outline: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <option value=""></option>
                        {fieldData.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar: Fields list fallback */}
          {showSidebar && (
            <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', maxHeight: '80vh' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: '700' }}>All Form Fields</div>
                  <div style={{ fontSize: '12px', color: '#8e8e93' }}>{fields.length} total</div>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  style={{ background: 'transparent', border: 'none', color: '#8e8e93', cursor: 'pointer', padding: '4px' }}
                  title="Close sidebar"
                >
                  <Icons.X size={16} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto', flex: 1, paddingRight: '6px' }}>
                {fields.map((f, i) => (
                  <div key={i} style={{ background: '#121214', padding: '14px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#a1a1aa', marginBottom: '6px', letterSpacing: '0.3px' }}>
                      {f.name.replace(/[._]/g, ' ')}
                    </label>

                    {f.type === 'text' && (
                      <input
                        type="text"
                        value={f.value as string}
                        onChange={e => handleFieldChange(f.name, e.target.value)}
                        placeholder="Type here..."
                        style={{ width: '100%', padding: '10px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#ffffff', outline: 'none', fontSize: '13px' }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
                      />
                    )}

                    {f.type === 'checkbox' && (
                      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: '#2c2c2e', padding: '10px', borderRadius: '6px' }}>
                        <input
                          type="checkbox"
                          checked={f.value as boolean}
                          onChange={e => handleFieldChange(f.name, e.target.checked)}
                          style={{ width: '16px', height: '16px', accentColor: '#3b82f6', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '13px', color: '#ffffff' }}>{f.value ? 'Checked' : 'Unchecked'}</span>
                      </label>
                    )}

                    {(f.type === 'radio' || f.type === 'dropdown') && (
                      <select
                        value={f.value as string}
                        onChange={e => handleFieldChange(f.name, e.target.value)}
                        style={{ width: '100%', padding: '10px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#ffffff', outline: 'none', cursor: 'pointer', fontSize: '13px' }}
                      >
                        <option value="">-- Select --</option>
                        {f.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
