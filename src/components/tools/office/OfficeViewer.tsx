import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import mammoth from 'mammoth';
import JSZip from 'jszip';

export function OfficeViewer() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [htmlContent, setHtmlContent] = useState('');
  const [excelData, setExcelData] = useState<any[][]>([]);
  const [fileType, setFileType] = useState<'word' | 'excel' | null>(null);
  const [direction, setDirection] = useState<'rtl' | 'ltr'>('rtl');

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (e.dataTransfer.files.length) {
      const f = e.dataTransfer.files[0];
      const ext = f.name.toLowerCase().split('.').pop();
      if (ext === 'docx' || ext === 'xlsx') {
        setFile(f);
        processFile(f);
      } else {
        setErrorMsg('Please drop a valid .docx or .xlsx file.');
      }
    }
  };

  const processFile = async (f: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setHtmlContent('');
    setExcelData([]);
    
    try {
      const arrayBuffer = await f.arrayBuffer();
      const ext = f.name.toLowerCase().split('.').pop();
      
      if (ext === 'docx') {
        setFileType('word');
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setHtmlContent(result.value);
      } else if (ext === 'xlsx') {
        setFileType('excel');
        const zip = await JSZip.loadAsync(arrayBuffer);
        
        const sharedStringsXml = await zip.file('xl/sharedStrings.xml')?.async('text');
        const strings: string[] = [];
        if (sharedStringsXml) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(sharedStringsXml, 'text/xml');
          const tNodes = xmlDoc.getElementsByTagName('t');
          for (let i = 0; i < tNodes.length; i++) {
            strings.push(tNodes[i].textContent || '');
          }
        }

        const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')?.async('text');
        if (!sheet1Xml) throw new Error('Could not find worksheet data (sheet1.xml)');
        
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(sheet1Xml, 'text/xml');
        const rows = xmlDoc.getElementsByTagName('row');
        
        const sheetData: any[][] = [];
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowData: any[] = [];
          const cells = row.getElementsByTagName('c');
          
          for (let j = 0; j < cells.length; j++) {
            const cell = cells[j];
            const type = cell.getAttribute('t');
            const vNode = cell.getElementsByTagName('v')[0];
            let value: any = vNode ? vNode.textContent : '';
            
            if (type === 's' && value !== '') {
              value = strings[parseInt(value, 10)] || '';
            } else if (type === 'n' && value !== '') {
              value = Number(value);
            }
            rowData.push(value);
          }
          sheetData.push(rowData);
        }
        setExcelData(sheetData);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error parsing document.');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const getFileIcon = () => {
    switch (fileType) {
      case 'word': return <Icons.FileText size={20} color="#38bdf8" />;
      case 'excel': return <Icons.Table size={20} color="#38bdf8" />;
      default: return <Icons.File size={20} color="#38bdf8" />;
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Office Viewer & Reader
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Instantly view Word, Excel, and PowerPoint documents in a clean, distraction-free environment offline.
        </p>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', borderRadius: '8px', color: '#f43f5e', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Icons.AlertCircle size={20} />
          <span style={{ fontWeight: '500' }}>{errorMsg}</span>
        </div>
      )}

      {!file ? (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          style={{
            border: '2px dashed rgba(255,255,255,0.1)',
            borderRadius: '16px',
            padding: '80px 40px',
            textAlign: 'center',
            background: '#121214',
            marginBottom: '24px',
            cursor: 'pointer',
          }}
          onClick={() => document.getElementById('fileUpload')?.click()}
        >
          <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Icons.Eye size={32} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Drop .docx or .xlsx file here
          </div>
          <input 
            id="fileUpload" 
            type="file" 
            accept=".docx,.xlsx" 
            style={{ display: 'none' }} 
            onChange={e => { if (e.target.files?.length) { setFile(e.target.files[0]); processFile(e.target.files[0]); } }}
          />
        </div>
      ) : (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#121214', padding: '12px 20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {getFileIcon()}
              <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>{file.name}</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {/* Direction Selector */}
              <div style={{ display: 'flex', gap: '4px', background: '#1c1c1e', padding: '4px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <button
                  onClick={() => setDirection('rtl')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: direction === 'rtl' ? '600' : '500',
                    background: direction === 'rtl' ? '#2c2c2e' : 'transparent',
                    color: direction === 'rtl' ? '#38bdf8' : '#8e8e93',
                    cursor: 'pointer'
                  }}
                  title="Right-to-Left (RTL)"
                >
                  RTL
                </button>
                <button
                  onClick={() => setDirection('ltr')}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '12px',
                    fontWeight: direction === 'ltr' ? '600' : '500',
                    background: direction === 'ltr' ? '#2c2c2e' : 'transparent',
                    color: direction === 'ltr' ? '#38bdf8' : '#8e8e93',
                    cursor: 'pointer'
                  }}
                  title="Left-to-Right (LTR)"
                >
                  LTR
                </button>
              </div>

              <button onClick={() => { setFile(null); setHtmlContent(''); setExcelData([]); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', padding: '8px', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                <Icons.X size={18} /> Close Viewer
              </button>
            </div>
          </div>

          <div style={{ 
            background: '#121214', 
            borderRadius: '12px', 
            padding: '32px', 
            minHeight: '600px', 
            overflow: 'auto',
            color: '#e5e7eb',
            fontFamily: fileType === 'word' ? 'Georgia, serif' : 'system-ui, sans-serif',
            border: '1px solid rgba(255,255,255,0.05)',
            direction: direction,
            textAlign: direction === 'rtl' ? 'right' : 'left'
          }}>
            {isProcessing ? (
              <div style={{ textAlign: 'center', padding: '100px 0', color: '#888' }}>
                <Icons.Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 16px auto' }} />
                Rendering Document...
              </div>
            ) : fileType === 'word' ? (
              <div style={{ maxWidth: '800px', margin: '0 auto', color: '#e5e7eb' }}>
                <style dangerouslySetInnerHTML={{__html: `
                  .word-preview-content table {
                    width: 100% !important;
                    border-collapse: collapse !important;
                    margin: 20px 0 !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                  }
                  .word-preview-content td, .word-preview-content th {
                    padding: 12px 16px !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    color: #e5e7eb !important;
                  }
                  .word-preview-content th {
                    background: rgba(255, 255, 255, 0.05) !important;
                    font-weight: 600 !important;
                  }
                  .word-preview-content h1, .word-preview-content h2, .word-preview-content h3 {
                    color: #ffffff !important;
                    margin-top: 28px !important;
                    margin-bottom: 14px !important;
                  }
                  .word-preview-content p {
                    margin-bottom: 18px !important;
                    line-height: 1.8 !important;
                  }
                `}} />
                <div 
                  className="word-preview-content"
                  dangerouslySetInnerHTML={{ __html: htmlContent || '<p>Blank Document</p>' }} 
                  style={{ lineHeight: '1.8', fontSize: '16px' }}
                />
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: direction === 'rtl' ? 'right' : 'left' }}>
                  <tbody>
                    {excelData.map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)', background: i === 0 ? 'rgba(255, 255, 255, 0.02)' : 'transparent' }}>
                        {row.map((cell, j) => (
                          <td 
                            key={j} 
                            style={{ 
                              padding: '12px 16px', 
                              borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                              color: i === 0 ? '#38bdf8' : '#e5e7eb',
                              fontWeight: i === 0 ? '600' : 'normal'
                            }}
                          >
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
