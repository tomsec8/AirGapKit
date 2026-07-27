import React, { useState } from 'react';
import * as Icons from 'lucide-react';

export function Base64Tool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isRTL, setIsRTL] = useState(false);

  const handleBase64Encode = () => {
    try {
      setOutput(btoa(unescape(encodeURIComponent(input))));
      setError(null);
    } catch (e: any) {
      setError('Base64 Encode Error: ' + e.message);
    }
  };

  const handleBase64Decode = () => {
    try {
      setOutput(decodeURIComponent(escape(atob(input))));
      setError(null);
    } catch (e: any) {
      setError('Invalid Base64 string');
    }
  };

  const handleUrlEncode = () => {
    setOutput(encodeURIComponent(input));
    setError(null);
  };

  const handleUrlDecode = () => {
    try {
      setOutput(decodeURIComponent(input));
      setError(null);
    } catch (e: any) {
      setError('Invalid URL encoding');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Base64 & URL Encoder
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Securely encode and decode strings offline without sending data to third-party APIs.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button onClick={handleBase64Encode} disabled={!input} style={{ padding: '10px 16px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', cursor: input ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '600', opacity: input ? 1 : 0.6 }}>
          Encode Base64
        </button>
        <button onClick={handleBase64Decode} disabled={!input} style={{ padding: '10px 16px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', cursor: input ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '600', opacity: input ? 1 : 0.6 }}>
          Decode Base64
        </button>
        <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />
        <button onClick={handleUrlEncode} disabled={!input} style={{ padding: '10px 16px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', cursor: input ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '600', opacity: input ? 1 : 0.6 }}>
          URL Encode
        </button>
        <button onClick={handleUrlDecode} disabled={!input} style={{ padding: '10px 16px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', cursor: input ? 'pointer' : 'not-allowed', fontSize: '14px', fontWeight: '600', opacity: input ? 1 : 0.6 }}>
          URL Decode
        </button>
      </div>

      {error && (
        <div style={{ padding: '16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', marginBottom: '24px', color: '#ef4444', fontSize: '14px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <Icons.AlertCircle size={20} style={{ flexShrink: 0 }} />
          <div><strong>Error:</strong> {error}</div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#8e8e93', fontWeight: '600' }}>Input String</label>
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
            placeholder="Paste text here..."
            style={{
              width: '100%',
              height: '300px',
              padding: '16px',
              background: '#121214',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#e5e7eb',
              fontSize: '14px',
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Output */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#f59e0b', fontWeight: '600' }}>Output String</label>
            <button onClick={handleCopy} disabled={!output} style={{ background: 'transparent', border: 'none', color: output ? '#f59e0b' : '#555', cursor: output ? 'pointer' : 'default', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Icons.Copy size={14} /> Copy
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            placeholder="Result will appear here..."
            style={{
              width: '100%',
              height: '300px',
              padding: '16px',
              background: '#1c1c1e',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              borderRadius: '12px',
              color: '#f59e0b',
              fontSize: '14px',
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
        </div>
      </div>
    </div>
  );
}
