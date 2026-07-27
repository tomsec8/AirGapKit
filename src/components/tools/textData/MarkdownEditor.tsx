import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { downloadFileWithDialog } from '../../../utils/fileSaver';

export function MarkdownEditor() {
  const [markdown, setMarkdown] = useState('# Hello Markdown\n\nWrite your *markdown* here.\n\n- It is **fast**\n- It works offline\n- No libraries needed\n\n> "Simplicity is the ultimate sophistication."');
  const [isRTL, setIsRTL] = useState(false);

  // Extremely basic Regex-based Markdown Parser
  const parseMarkdown = (md: string) => {
    let html = md;
    
    // Escape HTML tags to prevent XSS (even though it's offline)
    html = html.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    // Blockquotes
    html = html.replace(/^>\s?(.*)$/gm, '<blockquote>$1</blockquote>');
    
    // Headings
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Inline Code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Unordered Lists
    html = html.replace(/^\s*-\s(.*)$/gm, '<ul><li>$1</li></ul>');
    html = html.replace(/<\/ul>\n<ul>/g, '\n'); // Merge adjacent lists
    
    // Paragraphs (Double line breaks)
    html = html.replace(/\n\n/g, '</p><p>');
    
    // Wrap in paragraph if not starting with a block element
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    
    // Line breaks
    html = html.replace(/\n/g, '<br />');
    
    // Fix blockquotes and headings inside paragraphs
    html = html.replace(/<p><(h[1-6]|ul|blockquote)>/g, '<$1>');
    html = html.replace(/<\/(h[1-6]|ul|blockquote)><br \/>/g, '</$1>');
    html = html.replace(/<\/(h[1-6]|ul|blockquote)><\/p>/g, '</$1>');

    return html;
  };

  const htmlContent = parseMarkdown(markdown);

  const handleDownloadHtml = async () => {
    const fullHtml = `
<!DOCTYPE html>
<html dir="${isRTL ? 'rtl' : 'ltr'}">
<head>
<meta charset="utf-8">
<title>Exported Markdown</title>
<style>
  body { font-family: system-ui, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #333; }
  blockquote { border-left: 4px solid #ccc; margin: 0; padding-left: 16px; color: #666; }
  code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
  a { color: #f59e0b; text-decoration: none; }
</style>
</head>
<body>
${htmlContent}
</body>
</html>`;
    const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    await downloadFileWithDialog(blob, 'document.html');
  };

  const handleDownloadMd = async () => {
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    await downloadFileWithDialog(blob, 'document.md');
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#ffffff', marginBottom: '8px' }}>
            Markdown Editor
          </h1>
          <p style={{ color: '#8e8e93', fontSize: '15px' }}>
            Write Markdown with live preview and export to HTML perfectly offline.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={handleDownloadMd} style={{ padding: '10px 16px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Download size={16} /> Save .md
          </button>
          <button onClick={handleDownloadHtml} style={{ padding: '10px 16px', background: '#f59e0b', border: 'none', color: '#000', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Icons.Code size={16} /> Export HTML
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px', background: '#2c2c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
        
        {/* Editor */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ background: '#1c1c1e', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#8e8e93', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Icons.FileEdit size={16} color="#f59e0b" /> Markdown Source
            </div>
            <button onClick={() => setIsRTL(!isRTL)} style={{ background: 'transparent', border: 'none', color: '#8e8e93', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textTransform: 'none', fontWeight: 'normal' }}><Icons.Languages size={14} /> {isRTL ? 'LTR' : 'RTL'}</button>
          </div>
          <textarea
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            dir={isRTL ? 'rtl' : 'ltr'}
            style={{
              width: '100%',
              height: '600px',
              padding: '24px',
              background: '#121214',
              border: 'none',
              color: '#e5e7eb',
              fontSize: '15px',
              fontFamily: 'monospace',
              resize: 'none',
              outline: 'none',
              lineHeight: '1.6'
            }}
          />
        </div>

        {/* Preview */}
        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ background: '#1c1c1e', padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px', color: '#8e8e93', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase' }}>
            <Icons.Eye size={16} color="#10b981" /> Live Preview
          </div>
          <div
            dir={isRTL ? 'rtl' : 'ltr'}
            style={{
              width: '100%',
              height: '600px',
              padding: '24px',
              background: '#ffffff',
              color: '#333333',
              overflowY: 'auto',
              fontSize: '16px',
              lineHeight: '1.6',
            }}
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      </div>
      
      {/* Add a global style tag for the preview div to style elements correctly */}
      <style>{`
        div[dangerouslySetInnerHTML] h1, div[dangerouslySetInnerHTML] h2, div[dangerouslySetInnerHTML] h3 { margin-top: 0; color: #111; }
        div[dangerouslySetInnerHTML] blockquote { border-left: 4px solid #f59e0b; margin: 0 0 16px 0; padding-left: 16px; color: #666; font-style: italic; }
        div[dangerouslySetInnerHTML] code { background: #f4f4f5; padding: 2px 6px; border-radius: 4px; font-family: monospace; color: #ef4444; }
        div[dangerouslySetInnerHTML] a { color: #3b82f6; text-decoration: none; }
        div[dangerouslySetInnerHTML] a:hover { text-decoration: underline; }
        div[dangerouslySetInnerHTML] ul { margin-top: 0; padding-left: 24px; }
      `}</style>
    </div>
  );
}
