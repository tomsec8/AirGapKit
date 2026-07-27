import React, { useState } from 'react';
import * as Icons from 'lucide-react';

export function TextInspector() {
  const [text, setText] = useState('');
  const [isRTL, setIsRTL] = useState(false);

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;
  const charNoSpacesCount = text.replace(/\s+/g, '').length;
  const lineCount = text ? text.split('\n').length : 0;

  const handleUpper = () => setText(prev => prev.toUpperCase());
  const handleLower = () => setText(prev => prev.toLowerCase());
  const handleTitle = () => {
    setText(prev => prev.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
  };
  const handleCamel = () => {
    setText(prev => {
      return prev.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
        return index === 0 ? word.toLowerCase() : word.toUpperCase();
      }).replace(/\s+/g, '');
    });
  };
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Text Inspector & Case
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Count words, characters, and instantly switch text casing.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#1c1c1e', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#8e8e93', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Words</div>
          <div style={{ fontSize: '24px', color: '#f59e0b', fontWeight: '700' }}>{wordCount}</div>
        </div>
        <div style={{ background: '#1c1c1e', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#8e8e93', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Characters</div>
          <div style={{ fontSize: '24px', color: '#f59e0b', fontWeight: '700' }}>{charCount}</div>
        </div>
        <div style={{ background: '#1c1c1e', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#8e8e93', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Chars (No Spaces)</div>
          <div style={{ fontSize: '24px', color: '#f59e0b', fontWeight: '700' }}>{charNoSpacesCount}</div>
        </div>
        <div style={{ background: '#1c1c1e', padding: '20px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ fontSize: '12px', color: '#8e8e93', marginBottom: '4px', textTransform: 'uppercase', fontWeight: '600' }}>Lines</div>
          <div style={{ fontSize: '24px', color: '#f59e0b', fontWeight: '700' }}>{lineCount}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 250px', gap: '24px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#8e8e93', fontWeight: '600' }}>Input Text</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsRTL(!isRTL)} style={{ background: 'transparent', border: 'none', color: '#8e8e93', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Icons.Languages size={14} /> {isRTL ? 'LTR' : 'RTL'}</button>
              <button onClick={() => setText('')} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Icons.Trash2 size={14} /> Clear</button>
              <button onClick={handleCopy} style={{ background: 'transparent', border: 'none', color: '#f59e0b', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Icons.Copy size={14} /> Copy</button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir={isRTL ? 'rtl' : 'ltr'}
            placeholder="Type or paste your text here..."
            style={{
              width: '100%',
              height: '400px',
              padding: '16px',
              background: '#121214',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              color: '#e5e7eb',
              fontSize: '15px',
              resize: 'vertical',
              lineHeight: '1.6'
            }}
          />
        </div>

        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h3 style={{ fontSize: '13px', color: '#8e8e93', marginBottom: '12px', fontWeight: '600', textTransform: 'uppercase' }}>Convert Case</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button onClick={handleUpper} style={{ padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.05)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                UPPERCASE
              </button>
              <button onClick={handleLower} style={{ padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.05)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                lowercase
              </button>
              <button onClick={handleTitle} style={{ padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.05)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                Title Case
              </button>
              <button onClick={handleCamel} style={{ padding: '12px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.05)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                camelCase
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
