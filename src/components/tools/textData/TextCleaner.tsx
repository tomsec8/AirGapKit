import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

export function TextCleaner() {
  const [text, setText] = useState('');
  const [isRTL, setIsRTL] = useState(false);
  
  const handleRemoveExtraSpaces = () => {
    setText(prev => prev.replace(/[ \t]+/g, ' ').trim());
  };
  
  const handleRemoveEmptyLines = () => {
    setText(prev => prev.split('\n').filter(line => line.trim() !== '').join('\n'));
  };
  
  const handleRemoveDuplicates = () => {
    setText(prev => {
      const lines = prev.split('\n');
      return Array.from(new Set(lines)).join('\n');
    });
  };
  
  const handleSortAsc = () => {
    setText(prev => prev.split('\n').sort().join('\n'));
  };
  
  const handleSortDesc = () => {
    setText(prev => prev.split('\n').sort().reverse().join('\n'));
  };
  
  const handleReverseLines = () => {
    setText(prev => prev.split('\n').reverse().join('\n'));
  };
  
  const handleClear = () => {
    setText('');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  const handleDownload = async () => {
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    await downloadFileWithDialog(blob, 'cleaned_text.txt');
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Text Cleaner Suite
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Instantly format, clean, sort, and deduplicate massive text blocks offline.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#8e8e93', fontWeight: '600' }}>Input Text</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsRTL(!isRTL)} style={{ background: 'transparent', border: 'none', color: '#8e8e93', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Icons.Languages size={14} /> {isRTL ? 'LTR' : 'RTL'}</button>
              <button onClick={handleClear} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Icons.Trash2 size={14} /> Clear</button>
              <button onClick={handleCopy} style={{ background: 'transparent', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Icons.Copy size={14} /> Copy</button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir={isRTL ? 'rtl' : 'ltr'}
            placeholder="Paste your messy text here..."
            style={{
              width: '100%',
              height: '500px',
              padding: '16px',
              background: '#121214',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#e5e7eb',
              fontSize: '14px',
              fontFamily: 'monospace',
              resize: 'vertical',
              lineHeight: '1.5'
            }}
          />
        </div>

        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div>
            <h3 style={{ fontSize: '13px', color: '#8e8e93', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Clean</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={handleRemoveExtraSpaces} style={{ padding: '10px 12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.05)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.AlignLeft size={16} color="#f59e0b" /> Remove Extra Spaces
              </button>
              <button onClick={handleRemoveEmptyLines} style={{ padding: '10px 12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.05)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.ListMinus size={16} color="#f59e0b" /> Remove Empty Lines
              </button>
              <button onClick={handleRemoveDuplicates} style={{ padding: '10px 12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.05)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icons.Layers size={16} color="#f59e0b" /> Remove Duplicate Lines
              </button>
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: '13px', color: '#8e8e93', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Sort</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button onClick={handleSortAsc} style={{ padding: '10px 12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.05)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Icons.ArrowDownAZ size={16} color="#f59e0b" /> A-Z
              </button>
              <button onClick={handleSortDesc} style={{ padding: '10px 12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.05)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <Icons.ArrowUpZA size={16} color="#f59e0b" /> Z-A
              </button>
              <button onClick={handleReverseLines} style={{ padding: '10px 12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.05)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', gridColumn: 'span 2' }}>
                <Icons.FlipVertical size={16} color="#f59e0b" /> Reverse Line Order
              </button>
            </div>
          </div>

          <div style={{ flexGrow: 1 }} />

          <button onClick={handleDownload} disabled={!text} style={{ padding: '14px', background: '#f59e0b', border: 'none', color: '#000000', borderRadius: '8px', cursor: text ? 'pointer' : 'not-allowed', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: text ? 1 : 0.6 }}>
            <Icons.Download size={18} /> Download TXT
          </button>
        </div>
      </div>
    </div>
  );
}
