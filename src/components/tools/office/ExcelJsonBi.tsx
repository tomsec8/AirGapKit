import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import JSZip from 'jszip';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

export function ExcelJsonBi() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [data, setData] = useState<any[][]>([]);
  const [mode, setMode] = useState<'json' | 'csv'>(() => {
    try {
      const saved = localStorage.getItem('airgap_excel_json_mode');
      if (saved === 'json' || saved === 'csv') return saved;
    } catch(e) {}
    return 'json';
  });

  const changeMode = (newMode: 'json' | 'csv') => {
    setMode(newMode);
    try { localStorage.setItem('airgap_excel_json_mode', newMode); } catch(e) {}
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (e.dataTransfer.files.length) {
      const f = e.dataTransfer.files[0];
      if (f.name.endsWith('.xlsx')) {
        setFile(f);
        processExcel(f);
      } else {
        setErrorMsg('Please select or drop a valid .xlsx file.');
      }
    }
  };

  const processExcel = async (f: File) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const buffer = await f.arrayBuffer();
      const zip = await JSZip.loadAsync(buffer);
      
      // 1. Get Shared Strings
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

      // 2. Get Sheet 1
      const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml')?.async('text');
      if (!sheet1Xml) throw new Error('Could not find sheet1.xml in Excel file.');
      
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
            // Shared string
            const idx = parseInt(value, 10);
            value = strings[idx] || '';
          } else if (type === 'n' && value !== '') {
            // Number
            value = Number(value);
          } else if (type === 'b' && value !== '') {
            // Boolean
            value = value === '1' ? true : false;
          }
          
          rowData.push(value);
        }
        sheetData.push(rowData);
      }
      
      setData(sheetData);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error parsing Excel file. Ensure it is a valid .xlsx file.');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async () => {
    if (data.length === 0) return;
    
    if (mode === 'json') {
      const headers = data[0];
      const jsonArr = data.slice(1).map(row => {
        const obj: any = {};
        headers.forEach((h, i) => {
          obj[h || `Column${i+1}`] = row[i] !== undefined ? row[i] : null;
        });
        return obj;
      });
      
      const blob = new Blob([JSON.stringify(jsonArr, null, 2)], { type: 'application/json' });
      await downloadFileWithDialog(blob, `${file?.name.replace('.xlsx', '') || 'export'}.json`);
    } else {
      // CSV Export with explicit binary UTF-8 BOM bytes (0xEF, 0xBB, 0xBF) to guarantee Excel renders Hebrew / Unicode without gibberish
      const csvStr = data.map(row => 
        row.map(cell => {
          let str = String(cell ?? '');
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            str = `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(',')
      ).join('\n');
      
      const bomBytes = new Uint8Array([0xEF, 0xBB, 0xBF]);
      const csvBytes = new TextEncoder().encode(csvStr);
      const blob = new Blob([bomBytes, csvBytes], { type: 'text/csv;charset=utf-8;' });
      await downloadFileWithDialog(blob, `${file?.name.replace('.xlsx', '') || 'export'}.csv`);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Excel to JSON / CSV
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Securely extract data from .xlsx spreadsheets into raw JSON or CSV completely offline.
        </p>
      </div>

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
            <Icons.Table size={32} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
            Drop .xlsx file here
          </div>
          <input 
            id="fileUpload" 
            type="file" 
            accept=".xlsx" 
            style={{ display: 'none' }} 
            onChange={e => { if (e.target.files?.length) { setFile(e.target.files[0]); processExcel(e.target.files[0]); } }}
          />
        </div>
      ) : (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Icons.FileSpreadsheet size={24} color="#38bdf8" />
              <div>
                <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>{file.name}</div>
                <div style={{ fontSize: '13px', color: '#8e8e93' }}>Extracted {data.length} rows</div>
              </div>
            </div>
            <button 
              onClick={() => { setFile(null); setData([]); }} 
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', padding: '8px 16px', fontSize: '13px' }}
            >
              Change File
            </button>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#8e8e93', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase' }}>
              Export Format
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => setMode('json')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: mode === 'json' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: mode === 'json' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Icons.Braces size={24} color={mode === 'json' ? '#38bdf8' : '#8e8e93'} />
                <span style={{ fontWeight: '600' }}>Export JSON</span>
              </button>
              
              <button
                onClick={() => setMode('csv')}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: mode === 'csv' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.1)',
                  background: mode === 'csv' ? 'rgba(56, 189, 248, 0.1)' : 'transparent',
                  color: '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Icons.FileText size={24} color={mode === 'csv' ? '#38bdf8' : '#8e8e93'} />
                <span style={{ fontWeight: '600' }}>Export CSV</span>
              </button>
            </div>
          </div>

          {data.length > 0 && (
            <div style={{ background: '#121214', padding: '16px', borderRadius: '12px', marginBottom: '24px', maxHeight: '200px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', color: '#e5e7eb', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    {data[0].map((h, i) => <th key={i} style={{ padding: '8px', color: '#8e8e93', fontWeight: '500' }}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(1, 10).map((row, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      {row.map((cell, j) => <td key={j} style={{ padding: '8px' }}>{String(cell)}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
              {data.length > 10 && <div style={{ textAlign: 'center', padding: '12px', color: '#8e8e93', fontSize: '12px' }}>Showing 10 of {data.length} rows...</div>}
            </div>
          )}

          <button
            onClick={handleExport}
            disabled={isProcessing || data.length === 0}
            style={{ 
              width: '100%',
              padding: '14px', 
              background: '#38bdf8', 
              border: 'none', 
              color: '#000000', 
              borderRadius: '8px', 
              cursor: isProcessing || data.length === 0 ? 'not-allowed' : 'pointer', 
              fontWeight: '700',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Icons.Download size={18} />
            Download {mode.toUpperCase()}
          </button>
        </div>
      )}
    </div>
  );
}
