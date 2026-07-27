import piexif from 'piexifjs';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';

export async function readMetadata(file: File): Promise<Record<string, string>> {
  const meta: Record<string, string> = {};

  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true, throwOnInvalidObject: false } as any);
      if (pdfDoc.getTitle()) meta['Title'] = pdfDoc.getTitle()!;
      if (pdfDoc.getAuthor()) meta['Author'] = pdfDoc.getAuthor()!;
      if (pdfDoc.getSubject()) meta['Subject'] = pdfDoc.getSubject()!;
      if (pdfDoc.getKeywords() && pdfDoc.getKeywords()?.length) meta['Keywords'] = pdfDoc.getKeywords()!;
      if (pdfDoc.getCreator()) meta['Creator'] = pdfDoc.getCreator()!;
      if (pdfDoc.getProducer()) meta['Producer'] = pdfDoc.getProducer()!;
      if (pdfDoc.getCreationDate()) meta['Creation Date'] = pdfDoc.getCreationDate()!.toLocaleString();
      if (pdfDoc.getModificationDate()) meta['Mod Date'] = pdfDoc.getModificationDate()!.toLocaleString();
    } catch (e) {
      console.warn("Could not parse PDF metadata:", e);
    }
  } else if (file.name.match(/\.(docx|xlsx|pptx)$/i)) {
    try {
      const zip = await JSZip.loadAsync(file);
      if (zip.file('docProps/core.xml')) {
        const coreXml = await zip.file('docProps/core.xml')!.async('string');
        const parser = new DOMParser();
        const doc = parser.parseFromString(coreXml, 'text/xml');
        const title = doc.getElementsByTagName('dc:title')[0]?.textContent;
        const creator = doc.getElementsByTagName('dc:creator')[0]?.textContent;
        const modifiedBy = doc.getElementsByTagName('cp:lastModifiedBy')[0]?.textContent;
        const revision = doc.getElementsByTagName('cp:revision')[0]?.textContent;

        if (title) meta['Title'] = title;
        if (creator) meta['Author / Creator'] = creator;
        if (modifiedBy) meta['Last Modified By'] = modifiedBy;
        if (revision) meta['Revision'] = revision;
      }
      if (zip.file('docProps/app.xml')) {
        const appXml = await zip.file('docProps/app.xml')!.async('string');
        const parser = new DOMParser();
        const doc = parser.parseFromString(appXml, 'text/xml');
        const company = doc.getElementsByTagName('Company')[0]?.textContent;
        const manager = doc.getElementsByTagName('Manager')[0]?.textContent;

        if (company) meta['Company'] = company;
        if (manager) meta['Manager'] = manager;
      }
    } catch (e) {
      console.warn("Could not parse Office metadata:", e);
    }
  } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const exifObj = piexif.load(binary);
      if (exifObj['0TH']) {
        if (exifObj['0TH'][piexif.ImageIFD.Make]) meta['Camera Make'] = String(exifObj['0TH'][piexif.ImageIFD.Make]);
        if (exifObj['0TH'][piexif.ImageIFD.Model]) meta['Camera Model'] = String(exifObj['0TH'][piexif.ImageIFD.Model]);
        if (exifObj['0TH'][piexif.ImageIFD.Software]) meta['Software'] = String(exifObj['0TH'][piexif.ImageIFD.Software]);
        if (exifObj['0TH'][piexif.ImageIFD.DateTime]) meta['Date Taken'] = String(exifObj['0TH'][piexif.ImageIFD.DateTime]);
      }
      if (exifObj['GPS'] && Object.keys(exifObj['GPS']).length > 0) {
        meta['GPS Geolocation'] = 'Contains GPS Tags';
      }
    } catch (e) {
      console.warn("Could not parse EXIF metadata:", e);
    }
  }

  return meta;
}

export async function stripImageMetadata(file: File): Promise<Blob> {
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const cleanedBinary = piexif.remove(binary);
    const cleanedBytes = new Uint8Array(cleanedBinary.length);
    for (let i = 0; i < cleanedBinary.length; i++) {
      cleanedBytes[i] = cleanedBinary.charCodeAt(i);
    }
    return new Blob([cleanedBytes], { type: file.type });
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      canvas.toBlob((blob) => resolve(blob || file), file.type);
    };
    img.src = url;
  });
}

export async function stripPdfMetadata(file: File): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  try {
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true, throwOnInvalidObject: false } as any);
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('');
    pdfDoc.setCreator('');
    return await pdfDoc.save();
  } catch (err) {
    console.warn("pdf-lib parsing failed on PDF, using binary fallback metadata stripper:", err);
    return binaryPdfMetadataStrip(arrayBuffer);
  }
}

function binaryPdfMetadataStrip(arrayBuffer: ArrayBuffer): Uint8Array {
  const bytes = new Uint8Array(arrayBuffer);
  let str = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, i + chunkSize);
    str += String.fromCharCode.apply(null, sub as any);
  }

  // 1. Clear XMP Metadata streams
  str = str.replace(/<x:xmpmeta[\s\S]*?<\/x:xmpmeta>/gi, (match) => ' '.repeat(match.length));
  str = str.replace(/<\?xpacket[\s\S]*?\?>/gi, (match) => ' '.repeat(match.length));

  // 2. Clear standard Info dictionary keys
  const keys = ['Title', 'Author', 'Subject', 'Keywords', 'Creator', 'Producer', 'CreationDate', 'ModDate'];
  keys.forEach(key => {
    const reLiteral = new RegExp(`/${key}\\s*\\((?:\\\\[\\s\\S]|[^)])*\\)`, 'g');
    str = str.replace(reLiteral, (match) => `/${key} ()`.padEnd(match.length, ' '));

    const reHex = new RegExp(`/${key}\\s*<[0-9a-fA-F]*>`, 'g');
    str = str.replace(reHex, (match) => `/${key} <>`.padEnd(match.length, ' '));
  });

  const resultBytes = new Uint8Array(str.length);
  for (let i = 0; i < str.length; i++) {
    resultBytes[i] = str.charCodeAt(i) & 0xff;
  }
  return resultBytes;
}

export async function stripOfficeMetadata(file: File): Promise<Blob> {
  const zip = await JSZip.loadAsync(file);
  
  const coreXmlPath = 'docProps/core.xml';
  if (zip.file(coreXmlPath)) {
    let coreXml = await zip.file(coreXmlPath)!.async('string');
    // Clear standard properties
    const tagsToClear = ['dc:title', 'dc:subject', 'dc:creator', 'cp:keywords', 'dc:description', 'cp:lastModifiedBy', 'cp:revision'];
    tagsToClear.forEach(tag => {
      const regex = new RegExp(`(<${tag}[^>]*>)(.*?)(<\/${tag}>)`, 'g');
      coreXml = coreXml.replace(regex, '$1$3');
    });
    zip.file(coreXmlPath, coreXml);
  }

  const appXmlPath = 'docProps/app.xml';
  if (zip.file(appXmlPath)) {
    let appXml = await zip.file(appXmlPath)!.async('string');
    const tagsToClear = ['Company', 'Manager'];
    tagsToClear.forEach(tag => {
      const regex = new RegExp(`(<${tag}[^>]*>)(.*?)(<\/${tag}>)`, 'g');
      appXml = appXml.replace(regex, '$1$3');
    });
    zip.file(appXmlPath, appXml);
  }

  let mimeType = 'application/octet-stream';
  if (file.name.toLowerCase().endsWith('.docx')) mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  else if (file.name.toLowerCase().endsWith('.xlsx')) mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  else if (file.name.toLowerCase().endsWith('.pptx')) mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

  return await zip.generateAsync({ type: 'blob', mimeType });
}
