import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

export function DataExtractor() {
  const [text, setText] = useState('');
  const [isRTL, setIsRTL] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'emails' | 'phones' | 'ips' | 'urls'>('emails');

  const extractData = (type: 'emails' | 'phones' | 'ips' | 'urls') => {
    setActiveTab(type);
    if (!text) {
      setResults([]);
      return;
    }

    let regex: RegExp;
    switch (type) {
      case 'emails':
        regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
        break;
      case 'urls':
        regex = /https?:\/\/[^\s]+/g;
        break;
      case 'ips':
        regex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
        break;
      case 'phones':
        regex = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/g;
        break;
      default:
        return;
    }

    const matches = text.match(regex);
    if (matches) {
      // Deduplicate
      setResults(Array.from(new Set(matches)));
    } else {
      setResults([]);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(results.join('\n'));
  };

  const handleDownload = async () => {
    if (results.length === 0) return;
    const blob = new Blob([results.join('\n')], { type: 'text/plain;charset=utf-8' });
    await downloadFileWithDialog(blob, `extracted_${activeTab}.txt`);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Data Extractor
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Instantly extract structured data (Emails, URLs, IPs, Phones) from massive text dumps.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#8e8e93', fontWeight: '600' }}>Raw Text Dump</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setIsRTL(!isRTL)} style={{ background: 'transparent', border: 'none', color: '#8e8e93', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}><Icons.Languages size={14} /> {isRTL ? 'LTR' : 'RTL'}</button>
              <button onClick={() => { setText(''); setResults([]); }} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icons.Trash2 size={14} /> Clear
              </button>
            </div>
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir={isRTL ? 'rtl' : 'ltr'}
            placeholder="Paste your raw text, code, or logs here..."
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
            }}
          />
        </div>

        {/* Output */}
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', background: '#121214', padding: '6px', borderRadius: '12px' }}>
            <button 
              onClick={() => extractData('emails')}
              style={{ padding: '8px', background: activeTab === 'emails' ? '#2c2c2e' : 'transparent', border: 'none', color: activeTab === 'emails' ? '#f59e0b' : '#8e8e93', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <Icons.Mail size={18} /> Emails
            </button>
            <button 
              onClick={() => extractData('urls')}
              style={{ padding: '8px', background: activeTab === 'urls' ? '#2c2c2e' : 'transparent', border: 'none', color: activeTab === 'urls' ? '#f59e0b' : '#8e8e93', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <Icons.Link size={18} /> URLs
            </button>
            <button 
              onClick={() => extractData('ips')}
              style={{ padding: '8px', background: activeTab === 'ips' ? '#2c2c2e' : 'transparent', border: 'none', color: activeTab === 'ips' ? '#f59e0b' : '#8e8e93', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <Icons.Globe size={18} /> IPs
            </button>
            <button 
              onClick={() => extractData('phones')}
              style={{ padding: '8px', background: activeTab === 'phones' ? '#2c2c2e' : 'transparent', border: 'none', color: activeTab === 'phones' ? '#f59e0b' : '#8e8e93', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}
            >
              <Icons.Phone size={18} /> Phones
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>Found: {results.length} unique</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleCopy} disabled={results.length === 0} style={{ background: 'transparent', border: 'none', color: results.length > 0 ? '#f59e0b' : '#555', cursor: results.length > 0 ? 'pointer' : 'default', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icons.Copy size={14} /> Copy All
              </button>
              <button onClick={handleDownload} disabled={results.length === 0} style={{ background: 'transparent', border: 'none', color: results.length > 0 ? '#f59e0b' : '#555', cursor: results.length > 0 ? 'pointer' : 'default', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Icons.Download size={14} /> Download
              </button>
            </div>
          </div>

          <div style={{ 
            background: '#121214', 
            borderRadius: '12px', 
            flexGrow: 1, 
            padding: '16px', 
            border: '1px solid rgba(255,255,255,0.05)',
            overflowY: 'auto',
            maxHeight: '400px'
          }}>
            {results.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {results.map((item, idx) => (
                  <div key={idx} style={{ padding: '8px 12px', background: '#2c2c2e', borderRadius: '6px', color: '#e5e7eb', fontSize: '13px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {item}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', fontSize: '14px' }}>
                No {activeTab} found in text.
              </div>
            )}
          </div>
          
          <button 
            onClick={() => extractData(activeTab)} 
            style={{ padding: '14px', background: '#f59e0b', border: 'none', color: '#000000', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '15px' }}
          >
            Extract {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </button>
        </div>
      </div>
    </div>
  );
}
