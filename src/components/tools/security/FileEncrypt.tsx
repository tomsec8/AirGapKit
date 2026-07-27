import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { saveAs } from 'file-saver';

export function FileEncrypt() {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>(() => {
    try {
      const saved = localStorage.getItem('airgap_file_encrypt_mode');
      if (saved === 'encrypt' || saved === 'decrypt') return saved;
    } catch(e) {}
    return 'encrypt';
  });

  const changeMode = (newMode: 'encrypt' | 'decrypt') => {
    setMode(newMode);
    try { localStorage.setItem('airgap_file_encrypt_mode', newMode); } catch(e) {}
  };
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      setFile(e.target.files[0]);
    }
  };

  // Cryptographic Key Derivation (PBKDF2)
  const deriveKey = async (password: string, salt: Uint8Array, keyUsage: ['encrypt' | 'decrypt']) => {
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    return window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt as any,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      keyUsage
    );
  };

  const handleEncrypt = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      const key = await deriveKey(password, salt, ['encrypt']);

      const encryptedContent = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv as any },
        key,
        buffer
      );

      // Pack [Salt 16 bytes] + [IV 12 bytes] + [Encrypted Data]
      const encryptedData = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
      encryptedData.set(salt, 0);
      encryptedData.set(iv, salt.length);
      encryptedData.set(new Uint8Array(encryptedContent), salt.length + iv.length);

      const blob = new Blob([encryptedData], { type: 'application/octet-stream' });
      saveAs(blob, `${file.name}.encrypted`);
    } catch (err) {
      console.error(err);
      alert('Encryption failed. Make sure your browser supports WebCrypto.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecrypt = async () => {
    if (!file || !password) return;
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const data = new Uint8Array(buffer);
      
      if (data.length < 28) throw new Error('Invalid encrypted file format');

      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encryptedContent = data.slice(28);

      const key = await deriveKey(password, salt, ['decrypt']);

      const decryptedContent = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as any },
        key,
        encryptedContent
      );

      const blob = new Blob([decryptedContent]);
      let originalName = file.name;
      if (originalName.endsWith('.encrypted')) {
        originalName = originalName.slice(0, -10);
      }
      saveAs(blob, originalName);
    } catch (err) {
      console.error(err);
      alert('Decryption failed. Incorrect password or corrupted file.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          AES-256 Encrypt
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Securely encrypt or decrypt any file using military-grade AES-256-GCM encryption locally in your browser.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', background: '#1c1c1e', padding: '6px', borderRadius: '12px', marginBottom: '24px', width: 'fit-content' }}>
        <button
          onClick={() => { setMode('encrypt'); setFile(null); setPassword(''); }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: mode === 'encrypt' ? '600' : '500',
            background: mode === 'encrypt' ? '#3a3a3c' : 'transparent',
            color: mode === 'encrypt' ? '#ffffff' : '#8e8e93',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Encrypt
        </button>
        <button
          onClick={() => { setMode('decrypt'); setFile(null); setPassword(''); }}
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            fontSize: '14px',
            fontWeight: mode === 'decrypt' ? '600' : '500',
            background: mode === 'decrypt' ? '#3a3a3c' : 'transparent',
            color: mode === 'decrypt' ? '#ffffff' : '#8e8e93',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          Decrypt
        </button>
      </div>

      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        style={{
          border: '2px dashed rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '60px 40px',
          textAlign: 'center',
          background: '#121214',
          marginBottom: '24px',
          cursor: 'pointer',
        }}
        onClick={() => document.getElementById('fileUpload')?.click()}
      >
        <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
          {mode === 'encrypt' ? <Icons.Lock size={32} color="#38bdf8" /> : <Icons.Unlock size={32} color="#38bdf8" />}
        </div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: '#ffffff', marginBottom: '8px' }}>
          Drop {mode === 'encrypt' ? 'file to encrypt' : 'encrypted file'} here
        </div>
        <input 
          id="fileUpload" 
          type="file" 
          accept={mode === 'decrypt' ? '.encrypted' : '*'} 
          style={{ display: 'none' }} 
          onChange={handleFileSelect}
        />
      </div>

      {file && (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <Icons.File size={24} color="#38bdf8" />
            <div>
              <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: '600' }}>{file.name}</div>
              <div style={{ fontSize: '13px', color: '#8e8e93' }}>{(file.size / 1024).toFixed(2)} KB</div>
            </div>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: '#8e8e93', marginBottom: '8px' }}>
              {mode === 'encrypt' ? 'Set a strong password' : 'Enter decryption password'}
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '14px',
                background: '#121214',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '15px'
              }}
            />
          </div>

          <button
            onClick={mode === 'encrypt' ? handleEncrypt : handleDecrypt}
            disabled={isProcessing || !password}
            style={{ 
              width: '100%',
              padding: '14px', 
              background: '#38bdf8', 
              border: 'none', 
              color: '#000000', 
              borderRadius: '8px', 
              cursor: isProcessing || !password ? 'not-allowed' : 'pointer', 
              fontWeight: '700',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              opacity: isProcessing || !password ? 0.6 : 1
            }}
          >
            {isProcessing ? <Icons.Loader2 size={18} className="animate-spin" /> : mode === 'encrypt' ? <Icons.Lock size={18} /> : <Icons.Unlock size={18} />}
            {isProcessing ? 'Processing...' : mode === 'encrypt' ? 'Encrypt & Save' : 'Decrypt File'}
          </button>
        </div>
      )}
    </div>
  );
}
