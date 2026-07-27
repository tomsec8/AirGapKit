import React, { useState } from 'react';

export function DataExtractorView() {
  const [rawText, setRawText] = useState('');

  const extractEmails = () => {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return Array.from(new Set(rawText.match(emailRegex) || []));
  };

  const extractUrls = () => {
    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;
    return Array.from(new Set(rawText.match(urlRegex) || []));
  };

  const extractedEmails = extractEmails();
  const extractedUrls = extractUrls();

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', direction: 'ltr' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>Data Extractor</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
        Instantly extract hidden email addresses and website URLs from any raw messy text block.
      </p>

      <textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        placeholder="Paste raw text or email thread here..."
        rows={8}
        style={{
          width: '100%',
          padding: '16px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-main)',
          fontSize: '13px',
          outline: 'none',
          marginBottom: '20px'
        }}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Extracted Emails */}
        <div className="cyber-card" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '12px' }}>
            ✉️ Extracted Emails ({extractedEmails.length})
          </h4>
          <textarea
            readOnly
            value={extractedEmails.join('\n')}
            rows={6}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: 'none', color: 'var(--text-main)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
          />
        </div>

        {/* Extracted URLs */}
        <div className="cyber-card" style={{ padding: '16px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-cyan)', marginBottom: '12px' }}>
            🔗 Extracted URLs ({extractedUrls.length})
          </h4>
          <textarea
            readOnly
            value={extractedUrls.join('\n')}
            rows={6}
            style={{ width: '100%', padding: '10px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-input)', border: 'none', color: 'var(--text-main)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}
          />
        </div>
      </div>
    </div>
  );
}
