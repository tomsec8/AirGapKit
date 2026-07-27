import React, { useState } from 'react';

export function TextCleanerSuiteView() {
  const [text, setText] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  const removeExtraSpaces = () => {
    // Replaces multiple spaces, newlines, and trims
    const cleaned = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n').trim();
    setText(cleaned);
  };

  const removeDuplicates = () => {
    const lines = text.split('\n');
    const unique = Array.from(new Set(lines));
    setText(unique.join('\n'));
  };

  const sortLinesAZ = () => {
    const lines = text.split('\n');
    lines.sort((a, b) => a.localeCompare(b));
    setText(lines.join('\n'));
  };

  const handleFindReplace = () => {
    if (!findText) return;
    const re = new RegExp(findText, 'g');
    setText(text.replace(re, replaceText));
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', direction: 'ltr' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>Text Cleaner Suite</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
        Clean up broken text, remove duplicates, sort lines and find & replace 100% offline.
      </p>

      {/* Action Control Toolbar */}
      <div className="cyber-card" style={{ padding: '16px', marginBottom: '16px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
        <button onClick={removeExtraSpaces} style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'var(--primary)', color: '#07091a', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>
          ✨ Remove Extra Spaces
        </button>

        <button onClick={removeDuplicates} style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.15)', color: 'var(--primary)', border: '1px solid var(--border-color)', fontWeight: 'bold', cursor: 'pointer' }}>
          🗑️ Remove Duplicates
        </button>

        <button onClick={sortLinesAZ} style={{ padding: '8px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid var(--border-color)', fontWeight: 'bold', cursor: 'pointer' }}>
          🔤 Sort A-Z
        </button>
      </div>

      {/* Find & Replace Bar */}
      <div className="cyber-card" style={{ padding: '12px 16px', marginBottom: '16px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Find text..."
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '12px', flex: 1, outline: 'none' }}
        />
        <input
          type="text"
          placeholder="Replace with..."
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          style={{ padding: '7px 12px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '12px', flex: 1, outline: 'none' }}
        />
        <button onClick={handleFindReplace} style={{ padding: '7px 16px', borderRadius: 'var(--radius-sm)', background: 'var(--accent-cyan)', color: '#07091a', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px' }}>
          Replace All
        </button>
      </div>

      {/* Textarea Area */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your text here..."
        rows={12}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-main)',
          fontSize: '13px',
          fontFamily: 'var(--font-mono)',
          outline: 'none',
          resize: 'vertical'
        }}
      />
    </div>
  );
}
