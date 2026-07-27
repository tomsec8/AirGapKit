import React, { useState } from 'react';
import * as Icons from 'lucide-react';

export function FileShredder() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPass, setCurrentPass] = useState(0);
  const [shreddedCount, setShreddedCount] = useState(0);
  
  // Pending file for confirmation modal
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingHandle, setPendingHandle] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const getReadableErrorMessage = (err: any): string => {
    if (!err) return 'Unknown error occurred';
    if (typeof err === 'string') return err;
    if (err.name === 'AbortError') return 'File selection was cancelled.';
    if (err.name === 'NotAllowedError') return 'Permission denied to modify local file.';
    if (err.message) return String(err.message);
    if (err.name) return String(err.name);
    try {
      return JSON.stringify(err);
    } catch(e) {
      return 'File shredding failed';
    }
  };

  const handleSelectFile = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!('showOpenFilePicker' in window)) {
      setErrorMessage('Your browser does not support the File System Access API required for direct disk shredding. Please use Chrome or Edge.');
      return;
    }

    try {
      // @ts-ignore
      const [fileHandle] = await window.showOpenFilePicker({
        multiple: false,
        types: [{ description: 'All Files', accept: { '*/*': [] } }],
      });

      const file = await fileHandle.getFile();
      setPendingHandle(fileHandle);
      setPendingFile(file);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error(err);
        setErrorMessage(getReadableErrorMessage(err));
      }
    }
  };

  const fillCryptoRandom = (buffer: Uint8Array) => {
    const MAX_CRYPTO_BYTES = 65536; // Web Crypto API limit per call
    for (let offset = 0; offset < buffer.length; offset += MAX_CRYPTO_BYTES) {
      const sub = buffer.subarray(offset, Math.min(buffer.length, offset + MAX_CRYPTO_BYTES));
      window.crypto.getRandomValues(sub);
    }
  };

  const confirmAndShred = async () => {
    if (!pendingHandle || !pendingFile) return;

    const fileHandle = pendingHandle;
    const file = pendingFile;

    // Close modal
    setPendingHandle(null);
    setPendingFile(null);

    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Open writable stream directly to local storage file
      const writable = await fileHandle.createWritable();
      
      const fileSize = file.size;
      const chunkSize = 1024 * 1024; // 1MB chunks
      
      // 3-Pass DoD Secure Overwrite Sequence
      for (let pass = 1; pass <= 3; pass++) {
        setCurrentPass(pass);
        let offset = 0;
        while (offset < fileSize) {
          const size = Math.min(chunkSize, fileSize - offset);
          const junk = new Uint8Array(size);

          if (pass === 1) {
            // Pass 1: Cryptographically secure random noise
            fillCryptoRandom(junk);
          } else if (pass === 2) {
            // Pass 2: Inverted noise pattern
            fillCryptoRandom(junk);
            for (let b = 0; b < junk.length; b++) junk[b] = ~junk[b];
          } else {
            // Pass 3: Hard Zeros (0x00)
            junk.fill(0);
          }

          await writable.write({ type: 'write', position: offset, data: junk });
          offset += size;
        }
      }

      // Truncate file size to 0 bytes
      await writable.truncate(0);
      
      // Close file handle and commit changes to storage disk
      await writable.close();

      setShreddedCount(prev => prev + 1);
      setSuccessMessage(`Successfully shredded "${file.name}" from disk (3 passes completed).`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(`Failed to shred file: ${getReadableErrorMessage(err)}. Ensure the file is not currently open in another application.`);
    } finally {
      setIsProcessing(false);
      setCurrentPass(0);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          File Shredder
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Permanently destroy files directly on your hard drive. Overwrites file contents with cryptographically random data (3 passes) before truncating, rendering data recovery impossible.
        </p>
      </div>

      {/* Error Alert Banner */}
      {errorMessage && (
        <div style={{ padding: '14px 18px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '12px', color: '#fca5a5', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Icons.AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
          <div>{errorMessage}</div>
        </div>
      )}

      {/* Success Alert Banner */}
      {successMessage && (
        <div style={{ padding: '14px 18px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', color: '#6ee7b7', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <Icons.CheckCircle size={20} color="#10b981" style={{ flexShrink: 0 }} />
          <div>{successMessage}</div>
        </div>
      )}

      <div style={{ 
        background: '#1c1c1e', 
        borderRadius: '16px', 
        padding: '40px 24px', 
        textAlign: 'center',
        border: '1px solid rgba(239, 68, 68, 0.2)'
      }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto' }}>
          <Icons.Trash2 size={40} color="#ef4444" />
        </div>

        <h2 style={{ fontSize: '20px', color: '#ffffff', marginBottom: '12px', fontWeight: '600' }}>
          Select a File to Destroy
        </h2>
        
        <div style={{ 
          background: 'rgba(239, 68, 68, 0.1)', 
          color: '#ef4444', 
          padding: '14px 18px', 
          borderRadius: '10px', 
          fontSize: '13px', 
          maxWidth: '520px',
          margin: '0 auto 32px auto',
          lineHeight: '1.5',
          textAlign: 'left',
          display: 'flex',
          gap: '12px',
          border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <Icons.AlertTriangle size={24} style={{ flexShrink: 0 }} />
          <div>
            <strong>WARNING:</strong> Files destroyed with this tool bypass the Recycle Bin and are wiped directly on your disk storage. This action cannot be undone.
          </div>
        </div>

        <button
          onClick={handleSelectFile}
          disabled={isProcessing}
          style={{ 
            padding: '16px 32px', 
            background: '#ef4444', 
            border: 'none', 
            color: '#ffffff', 
            borderRadius: '12px', 
            cursor: isProcessing ? 'not-allowed' : 'pointer', 
            fontWeight: '700',
            fontSize: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
          }}
        >
          {isProcessing ? <Icons.Loader2 size={20} className="animate-spin" /> : <Icons.Skull size={20} />}
          {isProcessing ? `Shredding Pass ${currentPass}/3...` : 'Select File to Shred'}
        </button>

        {shreddedCount > 0 && !isProcessing && (
          <div style={{ marginTop: '28px', color: '#8e8e93', fontSize: '14px', fontWeight: '500' }}>
            Total files permanently destroyed in this session: <span style={{ color: '#ffffff', fontWeight: '700' }}>{shreddedCount}</span>
          </div>
        )}
      </div>

      {/* Custom Extension Confirmation Modal Dialog */}
      {pendingFile && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            background: '#1c1c1e',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '480px',
            width: '100%',
            boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
            textAlign: 'center'
          }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
              <Icons.Skull size={32} color="#ef4444" />
            </div>

            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#ffffff', marginBottom: '12px' }}>
              Permanently Destroy File?
            </h3>

            <p style={{ color: '#e4e4e7', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px', wordBreak: 'break-word' }}>
              Are you sure you want to PERMANENTLY DESTROY <span style={{ color: '#ef4444', fontWeight: '700' }}>"{pendingFile.name}"</span>? This will overwrite the file on disk and cannot be undone.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => { setPendingFile(null); setPendingHandle(null); }}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: '#2c2c2e',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#ffffff',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Cancel
              </button>

              <button
                onClick={confirmAndShred}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  background: '#ef4444',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '14px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)'
                }}
              >
                Yes, Destroy File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
