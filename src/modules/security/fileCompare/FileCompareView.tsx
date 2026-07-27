import React, { useState } from 'react';
import * as Icons from 'lucide-react';

export function FileCompareView() {
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [matchResult, setMatchResult] = useState<boolean | null>(null);

  const handleCompare = async () => {
    if (!file1 || !file2) return;
    setIsComparing(true);
    try {
      if (file1.size !== file2.size) {
        setMatchResult(false);
        return;
      }

      const buf1 = await file1.arrayBuffer();
      const buf2 = await file2.arrayBuffer();

      const hash1Buf = await crypto.subtle.digest('SHA-256', buf1);
      const hash2Buf = await crypto.subtle.digest('SHA-256', buf2);

      const arr1 = new Uint8Array(hash1Buf);
      const arr2 = new Uint8Array(hash2Buf);

      let match = true;
      for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) {
          match = false;
          break;
        }
      }

      setMatchResult(match);
    } catch (err) {
      console.error(err);
      alert('Error comparing files');
    } finally {
      setIsComparing(false);
    }
  };

  const createDropHandler = (setter: (f: File) => void) => (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      setter(e.dataTransfer.files[0]);
      setMatchResult(null);
    }
  };

  const createSelectHandler = (setter: (f: File) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length) {
      setter(e.target.files[0]);
      setMatchResult(null);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
          File Compare
        </h1>
        <p style={{ color: '#8e8e93', fontSize: '15px' }}>
          Compare two files bit-by-bit to check if their binary contents and cryptographic hashes exactly match.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* File 1 */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            First File
          </h4>
          {!file1 ? (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={createDropHandler(setFile1)}
              style={{
                border: '2px dashed rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
                background: '#121214',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onClick={() => document.getElementById('fileUpload1')?.click()}
            >
              <Icons.UploadCloud size={28} color="#06b6d4" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>Drop File 1</div>
              <input id="fileUpload1" type="file" style={{ display: 'none' }} onChange={createSelectHandler(setFile1)} />
            </div>
          ) : (
            <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Icons.File size={24} color="#06b6d4" />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{file1.name}</div>
                  <div style={{ fontSize: '12px', color: '#8e8e93' }}>{(file1.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button onClick={() => { setFile1(null); setMatchResult(null); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', padding: '8px 16px', fontSize: '12px', width: '100%' }}>
                Change File 1
              </button>
            </div>
          )}
        </div>

        {/* File 2 */}
        <div>
          <h4 style={{ fontSize: '13px', fontWeight: '600', marginBottom: '12px', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Second File
          </h4>
          {!file2 ? (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={createDropHandler(setFile2)}
              style={{
                border: '2px dashed rgba(255,255,255,0.1)',
                borderRadius: '16px',
                padding: '40px 20px',
                textAlign: 'center',
                background: '#121214',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                height: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
              }}
              onClick={() => document.getElementById('fileUpload2')?.click()}
            >
              <Icons.UploadCloud size={28} color="#a855f7" style={{ marginBottom: '12px' }} />
              <div style={{ fontSize: '14px', fontWeight: '600', color: '#ffffff', marginBottom: '4px' }}>Drop File 2</div>
              <input id="fileUpload2" type="file" style={{ display: 'none' }} onChange={createSelectHandler(setFile2)} />
            </div>
          ) : (
            <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '20px', height: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <Icons.File size={24} color="#a855f7" />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: '14px', color: '#ffffff', fontWeight: '600', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{file2.name}</div>
                  <div style={{ fontSize: '12px', color: '#8e8e93' }}>{(file2.size / 1024).toFixed(1)} KB</div>
                </div>
              </div>
              <button onClick={() => { setFile2(null); setMatchResult(null); }} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#ffffff', borderRadius: '8px', cursor: 'pointer', padding: '8px 16px', fontSize: '12px', width: '100%' }}>
                Change File 2
              </button>
            </div>
          )}
        </div>
      </div>

      {file1 && file2 && matchResult === null && (
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={handleCompare}
            disabled={isComparing}
            style={{ 
              padding: '14px 32px', 
              background: '#06b6d4', 
              border: 'none', 
              color: '#000000', 
              borderRadius: '8px', 
              cursor: isComparing ? 'not-allowed' : 'pointer', 
              fontWeight: '600',
              fontSize: '15px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isComparing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.GitCompare size={18} />}
            {isComparing ? 'Comparing Files...' : 'Compare 1:1'}
          </button>
        </div>
      )}

      {matchResult !== null && (
        <div style={{
          marginTop: '12px',
          padding: '24px',
          borderRadius: '16px',
          background: matchResult ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${matchResult ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: matchResult ? '#10b981' : '#ef4444',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px'
        }}>
          {matchResult ? <Icons.CheckCircle size={48} /> : <Icons.XCircle size={48} />}
          <div style={{ fontSize: '18px', fontWeight: '600' }}>
            {matchResult ? 'Exact Match Confirmed' : 'Files Do Not Match'}
          </div>
          <p style={{ fontSize: '14px', color: '#8e8e93', margin: 0 }}>
            {matchResult ? 'Both files have the exact same size and SHA-256 binary checksum.' : 'The files have different sizes or binary checksums.'}
          </p>
        </div>
      )}
    </div>
  );
}
