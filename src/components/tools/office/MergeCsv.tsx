import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';
import JSZip from 'jszip';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

export function MergeCsv() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [csvLines, setCsvLines] = useState<string[]>([]);
  const [mode, setMode] = useState<'merge' | 'split'>(() => {
    try {
      const saved = localStorage.getItem('airgap_merge_csv_mode');
      if (saved === 'merge' || saved === 'split') return saved;
    } catch(e) {}
    return 'merge';
  });

  const changeMode = (newMode: 'merge' | 'split') => {
    setMode(newMode);
    try { localStorage.setItem('airgap_merge_csv_mode', newMode); } catch(e) {}
  };
  
  // Split options
  const [splitRows, setSplitRows] = useState(1000);

  // Read CSV lines when in split mode
  useEffect(() => {
    if (mode === 'split' && files.length === 1) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string || '';
        const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
        setCsvLines(lines);
      };
      reader.readAsText(file);
    } else {
      setCsvLines([]);
    }
  }, [files, mode]);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (e.dataTransfer.files.length) {
      const csvs = Array.from(e.dataTransfer.files).filter(f => f.name.endsWith('.csv'));
      if (mode === 'split' && files.length + csvs.length > 1) {
        setFiles([csvs[0]]);
      } else {
        setFiles(prev => [...prev, ...csvs]);
      }
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      let combinedCsv = '';
      let header = '';

      for (let i = 0; i < files.length; i++) {
        let text = await files[i].text();
        // Remove BOM if already present in individual files to prevent duplication
        if (text.startsWith('\uFEFF')) {
          text = text.slice(1);
        }

        const lines = text.split('\n').filter(line => line.trim() !== '');
        
        if (i === 0) {
          header = lines[0];
          combinedCsv += text + (text.endsWith('\n') ? '' : '\n');
        } else {
          const startIdx = lines[0] === header ? 1 : 0;
          combinedCsv += lines.slice(startIdx).join('\n') + '\n';
        }
      }

      // Prepend UTF-8 BOM so Microsoft Excel renders Hebrew / Unicode cleanly
      const bom = '\uFEFF';
      const blob = new Blob([bom + combinedCsv], { type: 'text/csv;charset=utf-8;' });
      await downloadFileWithDialog(blob, 'merged_data.csv');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error merging CSV files.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSplit = async () => {
    if (files.length !== 1) return;
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const text = await files[0].text();
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length <= 1) throw new Error('CSV is empty or too small to split.');

      const header = lines[0];
      const dataLines = lines.slice(1);
      
      const zip = new JSZip();
      let chunkIdx = 1;
      
      for (let i = 0; i < dataLines.length; i += splitRows) {
        const chunk = dataLines.slice(i, i + splitRows);
        const chunkContent = [header, ...chunk].join('\n');
        
        // Use BOM bytes for each split CSV part to make sure all parts support Hebrew / Unicode without gibberish
        const bomBytes = new Uint8Array([0xEF, 0xBB, 0xBF]);
        const csvBytes = new TextEncoder().encode(chunkContent);
        
        // Combine BOM bytes and CSV bytes into a single Uint8Array for JSZip
        const combined = new Uint8Array(bomBytes.length + csvBytes.length);
        combined.set(bomBytes);
        combined.set(csvBytes, bomBytes.length);

        zip.file(`split_part_${chunkIdx}.csv`, combined);
        chunkIdx++;
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      await downloadFileWithDialog(blob, `${files[0].name.replace('.csv', '')}_split.zip`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Error splitting CSV file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Merge & Split CSVs
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Combine multiple CSVs into a single file or split a massive CSV into smaller chunks.
        </p>
      </div>

      {errorMsg && (
        <div style={{ padding: '12px 16px', background: 'rgba(244, 63, 94, 0.1)', border: '1px solid #f43f5e', borderRadius: '8px', color: '#f43f5e', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
          <Icons.AlertCircle size={20} />
          <span style={{ fontWeight: '500' }}>{errorMsg}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', background: '#1c1c1e', padding: '6px', borderRadius: '12px', marginBottom: '24px', width: 'fit-content' }}>
        <button
          onClick={() => { setMode('merge'); setFiles([]); }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: mode === 'merge' ? '600' : '500',
            background: mode === 'merge' ? '#3a3a3c' : 'transparent',
            color: mode === 'merge' ? '#ffffff' : '#8e8e93',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Merge CSVs
        </button>
        <button
          onClick={() => { setMode('split'); setFiles([]); }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: mode === 'split' ? '600' : '500',
            background: mode === 'split' ? '#3a3a3c' : 'transparent',
            color: mode === 'split' ? '#ffffff' : '#8e8e93',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Split CSV
        </button>
      </div>

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
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          {mode === 'merge' ? <Icons.Layers size={32} color="#38bdf8" /> : <Icons.Scissors size={32} color="#38bdf8" />}
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
          Drop {mode === 'merge' ? 'multiple .csv files' : 'a .csv file'} here
        </div>
        <input 
          id="fileUpload" 
          type="file" 
          accept=".csv" 
          multiple={mode === 'merge'}
          style={{ display: 'none' }} 
          onChange={e => {
            if (e.target.files?.length) {
              const csvs = Array.from(e.target.files).filter(f => f.name.endsWith('.csv'));
              if (mode === 'split' && csvs.length) setFiles([csvs[0]]);
              else setFiles(prev => [...prev, ...csvs]);
            }
          }}
        />
      </div>

      {files.length > 0 && (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px' }}>
          <h3 style={{ fontSize: '16px', color: '#ffffff', marginBottom: '16px', fontWeight: '600' }}>
            {mode === 'merge' ? `Selected Files (${files.length})` : 'File to Split'}
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', maxHeight: '200px', overflowY: 'auto' }}>
            {files.map((file, index) => (
              <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#2c2c2e', padding: '12px 16px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                  <Icons.FileText size={20} color="#38bdf8" style={{ flexShrink: 0 }} />
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '500', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{file.name}</div>
                    <div style={{ fontSize: '12px', color: '#8e8e93' }}>{(file.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>
                <button onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', marginLeft: '8px' }}>
                  <Icons.X size={20} />
                </button>
              </div>
            ))}
          </div>

          {mode === 'split' && (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#8e8e93', marginBottom: '8px' }}>Rows per split file</label>
              <input 
                type="number" 
                value={splitRows} 
                onChange={e => setSplitRows(Math.max(1, Number(e.target.value)))}
                style={{ width: '100%', padding: '12px', background: '#121214', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#ffffff', marginBottom: '16px' }}
              />

              {csvLines.length > 1 && csvLines.slice(1).length > splitRows && (
                <div style={{ padding: '16px', background: '#121214', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Icons.Eye size={16} color="#38bdf8" />
                    <span>Split Boundary Preview</span>
                  </div>
                  <p style={{ fontSize: '12px', color: '#8e8e93', marginBottom: '12px' }}>
                    Showing rows immediately before and after the first split boundary (Row {splitRows}):
                  </p>
                  
                  <div style={{ fontFamily: 'monospace', fontSize: '12px', background: '#1c1c1e', padding: '12px', borderRadius: '8px', overflowX: 'auto', border: '1px solid rgba(255,255,255,0.05)' }}>
                    {/* Header reference */}
                    <div style={{ color: '#8e8e93', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', marginBottom: '8px', whiteSpace: 'nowrap' }}>
                      <span style={{ color: '#38bdf8', marginRight: '12px', display: 'inline-block', width: '60px', fontWeight: 'bold' }}>Header</span>
                      {csvLines[0]}
                    </div>

                    {/* Surrounding rows */}
                    {(() => {
                      const dataLines = csvLines.slice(1);
                      const totalRows = dataLines.length;
                      const splitIdx = splitRows; // 1-based index in data rows
                      const startIdx = Math.max(1, splitIdx - 2); // 1-based data index
                      const endIdx = Math.min(totalRows, splitIdx + 2); // 1-based data index
                      
                      const rendered = [];
                      for (let r = startIdx; r <= endIdx; r++) {
                        const isSplitPoint = r === splitIdx;
                        const lineContent = dataLines[r - 1];
                        
                        rendered.push(
                          <div 
                            key={r} 
                            style={{ 
                              padding: '4px 6px', 
                              borderRadius: '4px',
                              background: isSplitPoint ? 'rgba(244, 63, 94, 0.08)' : 'transparent',
                              color: isSplitPoint ? '#f43f5e' : '#e5e7eb',
                              border: isSplitPoint ? '1px dashed rgba(244, 63, 94, 0.3)' : 'none',
                              whiteSpace: 'nowrap',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                          >
                            <span style={{ 
                              color: isSplitPoint ? '#f43f5e' : '#8e8e93', 
                              marginRight: '12px', 
                              display: 'inline-block', 
                              width: '60px',
                              fontWeight: isSplitPoint ? '700' : 'normal',
                              flexShrink: 0
                            }}>
                              Row {r}
                            </span>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden' }}>{lineContent}</span>
                            {isSplitPoint && (
                              <span style={{ marginLeft: 'auto', background: '#f43f5e', color: '#ffffff', fontSize: '9px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', flexShrink: 0 }}>
                                End of Part 1
                              </span>
                            )}
                          </div>
                        );

                        if (isSplitPoint && r < totalRows) {
                          rendered.push(
                            <div key={`sep-${r}`} style={{ display: 'flex', alignItems: 'center', margin: '8px 0', gap: '8px' }}>
                              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
                              <span style={{ fontSize: '10px', color: '#8e8e93', fontWeight: '600', textTransform: 'uppercase' }}>Next File Starts Here</span>
                              <div style={{ flex: 1, height: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
                            </div>
                          );
                        }
                      }
                      return rendered;
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={mode === 'merge' ? handleMerge : handleSplit}
            disabled={isProcessing || (mode === 'merge' && files.length < 2) || (mode === 'split' && files.length !== 1)}
            style={{ 
              width: '100%',
              padding: '14px', 
              background: '#38bdf8', 
              border: 'none', 
              color: '#000000', 
              borderRadius: '8px', 
              cursor: isProcessing || (mode === 'merge' && files.length < 2) || (mode === 'split' && files.length !== 1) ? 'not-allowed' : 'pointer', 
              fontWeight: '700',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isProcessing || (mode === 'merge' && files.length < 2) || (mode === 'split' && files.length !== 1) ? 0.6 : 1
            }}
          >
            {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : mode === 'merge' ? <Icons.Layers size={18} /> : <Icons.Scissors size={18} />}
            {isProcessing ? 'Processing...' : mode === 'merge' ? 'Merge CSVs Now' : 'Split & Download ZIP'}
          </button>
        </div>
      )}
    </div>
  );
}
