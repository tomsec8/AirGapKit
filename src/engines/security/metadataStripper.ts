import piexif from 'piexifjs';
import { PDFDocument } from 'pdf-lib';

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

  // Fallback: Redraw on canvas to strip EXIF
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
  const pdfDoc = await PDFDocument.load(arrayBuffer);
  
  pdfDoc.setTitle('');
  pdfDoc.setAuthor('');
  pdfDoc.setSubject('');
  pdfDoc.setKeywords([]);
  pdfDoc.setProducer('');
  pdfDoc.setCreator('');

  return await pdfDoc.save();
}
