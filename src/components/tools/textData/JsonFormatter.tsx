import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

export function JsonFormatter() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRTL, setIsRTL] = useState(false);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed, null, 2));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
      setOutput('');
    }
  };

  const handleMinify = () => {
    try {
      const parsed = JSON.parse(input);
      setOutput(JSON.stringify(parsed));
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Invalid JSON syntax');
      setOutput('');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
  };

  const handleDownload = async () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'application/json;charset=utf-8' });
    await downloadFileWithDialog(blob, 'formatted.json');
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          JSON Formatter
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Beautify, minify, and strictly validate your JSON payloads perfectly offline.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button onClick={handleFormat} disabled={!input} style={{ padding: '10px 16px', background: '#f59e0b', border: 'none', color: '#000', borderRadius: '8px', cursor: input ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px', opacity: input ? 1 : 0.6 }}>
          <Icons.AlignLeft size={16} /> Beautify JSON
        </button>
        <button onClick={handleMinify} disabled={!input} style={{ padding: '10px 16px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', cursor: input ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px', opacity: input ? 1 : 0.6 }}>
          <Icons.Minimize2 size={16} color="#f59e0b" /> Minify JSON
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '24px', color: '#ef4444', fontSize: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Icons.AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div><strong>Validation Error:</strong> {error}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#8e8e93', fontWeight: '600' }}>Raw JSON Input</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsRTL(!isRTL)} style={{ background: 'transparent', border: 'none', color: '#8e8e93', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Icons.Languages size={14} /> {isRTL ? 'LTR' : 'RTL'}</button>
              <button onClick={() => { setInput(''); setOutput(''); setError(null); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icons.Trash2 size={14} /> Clear
              </button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(null); }}
            dir={isRTL ? 'rtl' : 'ltr'}
            placeholder='{"paste": "your JSON here"}'
            style={{
              width: '100%',
              height: '500px',
              padding: '16px',
              background: '#121214',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#e5e7eb',
              fontSize: '13px',
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#10b981', fontWeight: '600' }}>Formatted Output</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleCopy} disabled={!output} style={{ background: 'transparent', border: 'none', color: output ? '#f59e0b' : '#555', cursor: output ? 'pointer' : 'default', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icons.Copy size={14} /> Copy
              </button>
              <button onClick={handleDownload} disabled={!output} style={{ background: 'transparent', border: 'none', color: output ? '#f59e0b' : '#555', cursor: output ? 'pointer' : 'default', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icons.Download size={14} /> Download .json
              </button>
            </div>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Result will appear here..."
            style={{
              width: '100%',
              height: '500px',
              padding: '16px',
              background: '#1c1c1e',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              color: '#10b981',
              fontSize: '13px',
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
        </div>
      </div>
    </div>
  );
}
