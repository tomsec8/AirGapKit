import React, { useState, useEffect } from 'react';
import * as Icons from 'lucide-react';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  numA?: number;
  numB?: number;
}

export function TextDiff() {
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [diffs, setDiffs] = useState<DiffLine[]>([]);
  const [isComparing, setIsComparing] = useState(false);
  const [isRTL, setIsRTL] = useState(false);

  // Simple Line-by-line Diff Algorithm
  const compareText = () => {
    setIsComparing(true);
    
    // Use a small timeout to allow UI to show "Comparing..." for huge texts
    setTimeout(() => {
      const linesA = textA.split('\n');
      const linesB = textB.split('\n');
      
      const result: DiffLine[] = [];
      let a = 0, b = 0;
      
      // Extremely naive algorithm for speed (synchronous). 
      // For real Git-level diffs, Myers Diff algorithm is used, but it's heavy.
      // This is a basic 1-to-1 matcher with minimal lookahead.
      while (a < linesA.length || b < linesB.length) {
        if (a < linesA.length && b < linesB.length && linesA[a] === linesB[b]) {
          result.push({ type: 'unchanged', text: linesA[a], numA: a + 1, numB: b + 1 });
          a++; b++;
        } else {
          // Lookahead to resync
          let resynced = false;
          
          // Try to find linesB[b] in linesA (meaning lines were removed from B)
          for (let i = 1; i <= 5 && a + i < linesA.length; i++) {
            if (linesA[a + i] === linesB[b]) {
              for (let k = 0; k < i; k++) {
                result.push({ type: 'removed', text: linesA[a], numA: a + 1 });
                a++;
              }
              resynced = true;
              break;
            }
          }
          
          if (!resynced) {
            // Try to find linesA[a] in linesB (meaning lines were added to B)
            for (let i = 1; i <= 5 && b + i < linesB.length; i++) {
              if (linesA[a] === linesB[b + i]) {
                for (let k = 0; k < i; k++) {
                  result.push({ type: 'added', text: linesB[b], numB: b + 1 });
                  b++;
                }
                resynced = true;
                break;
              }
            }
          }

          if (!resynced) {
            if (a < linesA.length) {
              result.push({ type: 'removed', text: linesA[a], numA: a + 1 });
              a++;
            }
            if (b < linesB.length) {
              result.push({ type: 'added', text: linesB[b], numB: b + 1 });
              b++;
            }
          }
        }
      }
      
      setDiffs(result);
      setIsComparing(false);
    }, 10);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
            Text Diff
          </h1>
          <p style={{ color: '#8e8e93', fontSize: '15px' }}>
            Compare two text blocks side-by-side to find additions and deletions offline.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => setIsRTL(!isRTL)} style={{ padding: '12px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#8e8e93', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Languages size={18} /> {isRTL ? 'LTR' : 'RTL'}
          </button>
          <button 
            onClick={compareText}
            disabled={!textA && !textB}
            style={{ padding: '12px 24px', background: '#f59e0b', border: 'none', color: '#000000', borderRadius: '8px', cursor: (!textA && !textB) ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px', opacity: (!textA && !textB) ? 0.6 : 1 }}
          >
            {isComparing ? <Icons.Loader2 size={18} className="animate-spin" /> : <Icons.GitCompare size={18} />}
            Compare Now
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Original */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#ef4444', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.FileMinus size={16} /> Original Text (Deleted)
            </label>
            <button onClick={() => { setTextA(''); setDiffs([]); }} style={{ background: 'transparent', border: 'none', color: '#8e8e93', cursor: 'pointer', fontSize: '13px' }}>Clear</button>
          </div>
          <textarea
            value={textA}
            onChange={(e) => { setTextA(e.target.value); setDiffs([]); }}
            dir={isRTL ? 'rtl' : 'ltr'}
            placeholder="Paste original text here..."
            style={{
              width: '100%',
              height: '300px',
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

        {/* Modified */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ fontSize: '14px', color: '#10b981', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.FilePlus size={16} /> Modified Text (Added)
            </label>
            <button onClick={() => { setTextB(''); setDiffs([]); }} style={{ background: 'transparent', border: 'none', color: '#8e8e93', cursor: 'pointer', fontSize: '13px' }}>Clear</button>
          </div>
          <textarea
            value={textB}
            onChange={(e) => { setTextB(e.target.value); setDiffs([]); }}
            dir={isRTL ? 'rtl' : 'ltr'}
            placeholder="Paste modified text here..."
            style={{
              width: '100%',
              height: '300px',
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
      </div>

      {diffs.length > 0 && (
        <div style={{ background: '#1c1c1e', borderRadius: '16px', padding: '2px', border: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '16px', color: '#ffffff', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.GitMerge size={18} color="#f59e0b" /> Diff Results
            </h3>
            <div style={{ display: 'flex', gap: '16px', fontSize: '13px' }}>
              <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 10, height: 10, background: 'rgba(16, 185, 129, 0.2)', border: '1px solid #10b981', borderRadius: 2 }} /> Added</span>
              <span style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}><div style={{ width: 10, height: 10, background: 'rgba(239, 68, 68, 0.2)', border: '1px solid #ef4444', borderRadius: 2 }} /> Removed</span>
            </div>
          </div>
          
          <div style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.6', overflowX: 'auto', padding: '16px 0', maxHeight: '500px' }}>
            {diffs.map((line, idx) => {
              const isAdded = line.type === 'added';
              const isRemoved = line.type === 'removed';
              
              let bg = 'transparent';
              let color = '#e5e7eb';
              let prefix = '  ';
              
              if (isAdded) {
                bg = 'rgba(16, 185, 129, 0.15)';
                color = '#34d399';
                prefix = '+ ';
              } else if (isRemoved) {
                bg = 'rgba(239, 68, 68, 0.15)';
                color = '#f87171';
                prefix = '- ';
              }

              return (
                <div key={idx} style={{ display: 'flex', background: bg, color: color, padding: '2px 16px' }}>
                  <div style={{ width: '40px', color: '#555', textAlign: 'right', paddingRight: '12px', userSelect: 'none' }}>
                    {line.numA || ''}
                  </div>
                  <div style={{ width: '40px', color: '#555', textAlign: 'right', paddingRight: '16px', borderRight: '1px solid rgba(255,255,255,0.1)', userSelect: 'none', marginRight: '16px' }}>
                    {line.numB || ''}
                  </div>
                  <div style={{ userSelect: 'none', width: '20px', color: isAdded ? '#10b981' : isRemoved ? '#ef4444' : '#555' }}>
                    {prefix}
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                    {line.text || ' '}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
