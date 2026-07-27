export interface ToolDef {
  id: string;
  name: string;
  description: string;
  cluster: 'convert' | 'security' | 'pdf' | 'office' | 'image' | 'textData';
  icon: string;
  path: string;
  popular?: boolean;
  bidirectional?: boolean;
}

export const CLUSTERS = [
  { id: 'convert', name: 'Convert', icon: 'RefreshCw', color: '#a855f7' },
  { id: 'security', name: 'Security', icon: 'ShieldCheck', color: '#06b6d4' },
  { id: 'pdf', name: 'PDF', icon: 'FileText', color: '#f43f5e' },
  { id: 'office', name: 'Office', icon: 'FileSpreadsheet', color: '#38bdf8' },
  { id: 'image', name: 'Image', icon: 'Image', color: '#818cf8' },
  { id: 'textData', name: 'Text & Data', icon: 'Code', color: '#f59e0b' }
];

export const TOOLS: ToolDef[] = [
  // --- CONVERT CLUSTER ---
  { id: 'pdf-image-bi', name: 'PDF ⇄ Image', description: 'Convert PDF pages to images or pack images to PDF', cluster: 'convert', icon: 'RefreshCw', path: '/convert/pdf-image' },
  { id: 'word-pdf-bi', name: 'Word ⇄ PDF', description: 'Convert Word documents to PDF or PDF to editable Word', cluster: 'convert', icon: 'RefreshCw', path: '/convert/word-pdf' },
  { id: 'excel-json-bi', name: 'Excel ⇄ CSV / JSON', description: 'Convert Excel spreadsheets to CSV or JSON data structures', cluster: 'convert', icon: 'Table', path: '/convert/excel-json' },
  { id: 'svg-image-bi', name: 'SVG ⇄ Image', description: 'Export SVG to PNG/JPG or vectorize images to SVG', cluster: 'convert', icon: 'RefreshCw', path: '/convert/svg-image' },
  { id: 'media-extractor', name: 'Media Extractor', description: 'Extract raw embedded images/media from PDF & Office files', cluster: 'convert', icon: 'Archive', path: '/convert/media-extractor' },
  { id: 'pdf-to-zip', name: 'PDF to ZIP', description: 'Export PDF pages as separate files in a ZIP', cluster: 'convert', icon: 'FolderZip', path: '/convert/pdf-to-zip' },
  { id: 'img-converter', name: 'Format Transcoder', description: 'Convert images between PNG, JPEG, WebP & AVIF', cluster: 'convert', icon: 'RefreshCw', path: '/convert/image-converter' },

  // --- SECURITY CLUSTER ---
  { id: 'metadata-stripper', name: 'Metadata Stripper', description: 'Clean EXIF, Office logs & PDF identifying metadata', cluster: 'security', icon: 'ShieldAlert', path: '/security/metadata-strip' },
  { id: 'file-hash', name: 'File Hash Generator', description: 'Calculate SHA-256 / SHA-512 / MD5 hashes', cluster: 'security', icon: 'Key', path: '/security/file-hash' },
  { id: 'file-compare', name: 'Binary File Compare', description: 'Compare 2 files bit-by-bit for exact checksum match', cluster: 'security', icon: 'GitCompare', path: '/security/file-compare' },
  { id: 'file-encrypt', name: 'AES-256 Encrypt', description: 'Encrypt or decrypt any file with AES-256-GCM', cluster: 'security', icon: 'Lock', path: '/security/file-encrypt' },
  { id: 'pass-gen', name: 'Password Generator', description: 'Generate strong cryptographically random keys', cluster: 'security', icon: 'Cpu', path: '/security/pass-gen' },
  { id: 'file-shredder', name: 'File Shredder', description: 'Zero-fill wipe file data securely in memory', cluster: 'security', icon: 'Trash2', path: '/security/file-shredder' },

  // --- PDF CLUSTER ---
  { id: 'merge-pdf', name: 'Merge PDF', description: 'Combine multiple PDF files into one document', cluster: 'pdf', icon: 'Layers', path: '/pdf/merge' },
  { id: 'pdf-page-mgr', name: 'PDF Page Manager', description: 'Split, delete, reorder & rotate PDF pages visually', cluster: 'pdf', icon: 'Grid', path: '/pdf/page-manager' },
  { id: 'compress-pdf', name: 'Compress PDF', description: 'Shrink PDF file size in 3 compression levels', cluster: 'pdf', icon: 'Minimize2', path: '/pdf/compress' },
  { id: 'sign-pdf', name: 'Sign PDF', description: 'Embed visual signatures onto document pages', cluster: 'pdf', icon: 'Edit3', path: '/pdf/sign' },
  { id: 'fill-form-pdf', name: 'Fill Form & Edit', description: 'Fill interactive PDF forms & add text annotations', cluster: 'pdf', icon: 'FileEdit', path: '/pdf/fill-form' },
  { id: 'watermark-num-pdf', name: 'Watermark & Numbers', description: 'Add text/logo watermarks and page numbers', cluster: 'pdf', icon: 'Stamp', path: '/pdf/watermark-numbers' },
  { id: 'pdf-sec-bi', name: 'PDF Lock ⇄ Unlock', description: 'Add AES-256 password or remove protection', cluster: 'pdf', icon: 'Lock', path: '/pdf/security-bi' },
  { id: 'pdf-compare', name: 'PDF Compare', description: 'Compare 2 PDF documents side-by-side visually', cluster: 'pdf', icon: 'GitCompare', path: '/pdf/compare' },
  { id: 'pdf-repair', name: 'PDF Repair', description: 'Fix corrupted cross-reference tables & indexes', cluster: 'pdf', icon: 'Wrench', path: '/pdf/repair' },
  { id: 'pdf-viewer', name: 'PDF Viewer & Reader', description: 'Built-in fast reader with zoom and search', cluster: 'pdf', icon: 'Eye', path: '/pdf/viewer' },
  { id: 'crop-pdf', name: 'Crop PDF', description: 'Crop margins and unwanted areas from pages', cluster: 'pdf', icon: 'Crop', path: '/pdf/crop' },
  { id: 'flatten-pdf', name: 'Flatten PDF', description: 'Flatten interactive form fields into permanent text', cluster: 'pdf', icon: 'FileCheck', path: '/pdf/flatten' },

  // --- OFFICE CLUSTER ---
  { id: 'merge-csv', name: 'Merge & Split CSVs', description: 'Combine CSV files into multi-tab Excel or single CSV', cluster: 'office', icon: 'Layers', path: '/office/merge-csv' },
  { id: 'word-to-text', name: 'Word to Text / HTML', description: 'Extract raw clean text & HTML from Word files', cluster: 'office', icon: 'FileText', path: '/office/word-text' },
  { id: 'office-viewer', name: 'Office Viewer & Reader', description: 'Built-in fast reader for Word & Excel documents', cluster: 'office', icon: 'Eye', path: '/office/viewer' },

  // --- IMAGE CLUSTER ---
  { id: 'image-editor-suite', name: 'Image Editor Suite', description: 'Crop, resize, rotate & flip images in one editor', cluster: 'image', icon: 'Crop', path: '/image/editor-suite' },
  { id: 'camscanner-suite', name: 'Document Scanner', description: 'CamScanner filter: enhance document photos to clean B&W scan', cluster: 'image', icon: 'Camera', path: '/image/camscanner' },
  { id: 'compress-image', name: 'Compress Image', description: 'Shrink JPG/PNG/WebP image files', cluster: 'image', icon: 'Image', path: '/image/compress' },
  { id: 'blur-anonymize', name: 'Blur & Anonymize', description: 'Blur faces, license plates & sensitive info', cluster: 'image', icon: 'EyeOff', path: '/image/blur-anonymize' },
  { id: 'watermark-image', name: 'Watermark Image', description: 'Overlay text or logo onto images', cluster: 'image', icon: 'Stamp', path: '/image/watermark' },
  { id: 'bg-remover', name: 'Background Remover', description: 'Remove image backgrounds offline', cluster: 'image', icon: 'Scissors', path: '/image/bg-remover' },

  // --- TEXT & DATA CLUSTER ---
  { id: 'text-cleaner-suite', name: 'Text Cleaner Suite', description: 'Remove extra spaces, duplicates, sort & replace', cluster: 'textData', icon: 'Sparkles', path: '/text/cleaner-suite' },
  { id: 'text-inspector-case', name: 'Text Inspector & Case', description: 'Word/char counter & UPPER/lower/Title case switch', cluster: 'textData', icon: 'Type', path: '/text/inspector-case' },
  { id: 'data-extractor', name: 'Data Extractor', description: 'Extract emails, URLs & phone numbers from raw text', cluster: 'textData', icon: 'Filter', path: '/text/data-extractor' },
  { id: 'text-diff', name: 'Text Diff', description: 'Compare differences between 2 text blocks side-by-side', cluster: 'textData', icon: 'GitCompare', path: '/text/diff' },
  { id: 'json-format', name: 'JSON Formatter', description: 'Format, validate and minify JSON structures', cluster: 'textData', icon: 'Braces', path: '/text/json' },
  { id: 'base64-tool', name: 'Base64 & URL Encoder', description: 'Encode & decode Base64, URLs and HTML entities', cluster: 'textData', icon: 'Binary', path: '/text/base64' },
  { id: 'markdown-editor', name: 'Markdown Editor & Export', description: 'Live Markdown editor with preview & PDF export', cluster: 'textData', icon: 'FileText', path: '/text/markdown' }
];
