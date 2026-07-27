import { saveAs } from 'file-saver';
import JSZip from 'jszip';

/**
 * Downloads a Blob, enforcing "Save As" dialog if supported by the browser (Chrome extension API).
 * Falls back to `file-saver` if `chrome.downloads` is unavailable.
 */
export async function downloadFileWithDialog(blob: Blob, filename: string): Promise<void> {
  try {
    if (typeof chrome !== 'undefined' && chrome.downloads) {
      const url = URL.createObjectURL(blob);
      await new Promise<void>((resolve, reject) => {
        chrome.downloads.download(
          {
            url: url,
            filename: filename,
            saveAs: true, // Forces the Save As dialog
          },
          (downloadId: number | undefined) => {
            if (chrome.runtime.lastError) {
              console.warn("chrome.downloads error:", chrome.runtime.lastError.message);
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          }
        );
      });
      // Clean up object URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 10000);
      return;
    }
  } catch (err) {
    console.warn("Failed to use chrome.downloads API, falling back to saveAs:", err);
  }

  // Fallback for non-extension environments or if permissions are missing
  saveAs(blob, filename);
}

/**
 * Zips an array of { name, blob } objects and downloads the resulting ZIP file.
 */
export async function downloadZipWithDialog(files: { name: string; blob: Blob }[], zipFilename: string): Promise<void> {
  const zip = new JSZip();

  files.forEach(f => {
    zip.file(f.name, f.blob);
  });

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  await downloadFileWithDialog(zipBlob, zipFilename);
}
