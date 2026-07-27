import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

export function PassGen() {
  const [password, setPassword] = useState('');
  const [length, setLength] = useState(24);
  const [useUppercase, setUseUppercase] = useState(true);
  const [useLowercase, setUseLowercase] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(true);
  const [copied, setCopied] = useState(false);

  const generatePassword = () => {
    let charset = '';
    if (useUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (useLowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (useNumbers) charset += '0123456789';
    if (useSymbols) charset += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    if (charset === '') {
      setPassword('');
      return;
    }

    const randomArray = new Uint32Array(length);
    window.crypto.getRandomValues(randomArray);

    let newPassword = '';
    for (let i = 0; i < length; i++) {
      newPassword += charset[randomArray[i] % charset.length];
    }
    
    setPassword(newPassword);
    setCopied(false);
  };

  useEffect(() => {
    generatePassword();
  }, [length, useUppercase, useLowercase, useNumbers, useSymbols]);

  const handleCopy = () => {
    if (!password) return;
    navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          <Icons.Cpu size={32} color="#38bdf8" />
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          Secure Password Generator
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Generate cryptographically strong passwords locally using WebCrypto API.
        </p>
      </div>

      <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px', position: 'relative' }}>
        <div style={{ 
          background: '#121214', 
          border: '1px solid rgba(255,255,255,0.1)', 
          borderRadius: '12px', 
          padding: '24px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          marginBottom: '24px'
        }}>
          <div style={{ 
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', 
            fontSize: '22px', 
            color: password ? '#ffffff' : '#8e8e93',
            wordBreak: 'break-all'
          }}>
            {password || 'Select at least one character set'}
          </div>
          <button 
            onClick={handleCopy}
            disabled={!password}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: copied ? '#10b981' : '#38bdf8', 
              cursor: password ? 'pointer' : 'not-allowed', 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center',
              opacity: password ? 1 : 0.5
            }}
          >
            {copied ? <Icons.Check size={24} /> : <Icons.Copy size={24} />}
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600' }}>Password Length</span>
            <span style={{ fontSize: '14px', color: '#38bdf8', fontWeight: '700' }}>{length}</span>
          </div>
          <input 
            type="range" 
            min="8" 
            max="128" 
            value={length} 
            onChange={(e) => setLength(Number(e.target.value))}
            style={{ width: '100%', cursor: 'pointer', accentColor: '#38bdf8' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#ffffff' }}>
            <input type="checkbox" checked={useUppercase} onChange={(e) => setUseUppercase(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#38bdf8' }} />
            Uppercase (A-Z)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#ffffff' }}>
            <input type="checkbox" checked={useLowercase} onChange={(e) => setUseLowercase(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#38bdf8' }} />
            Lowercase (a-z)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#ffffff' }}>
            <input type="checkbox" checked={useNumbers} onChange={(e) => setUseNumbers(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#38bdf8' }} />
            Numbers (0-9)
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#ffffff' }}>
            <input type="checkbox" checked={useSymbols} onChange={(e) => setUseSymbols(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#38bdf8' }} />
            Symbols (!@#$)
          </label>
        </div>

        <button
          onClick={generatePassword}
          style={{ 
            width: '100%',
            padding: '14px', 
            background: '#38bdf8', 
            border: 'none', 
            color: '#000000', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: '700',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <Icons.RefreshCw size={18} />
          Generate New Password
        </button>
      </div>
    </div>
  );
}
