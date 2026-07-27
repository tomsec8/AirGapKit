/**
 * Safe URL sanitizers to satisfy CodeQL / Security scanners
 * and ensure no javascript: or untrusted protocols can be assigned to DOM attributes.
 */

export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Explicitly check and block dangerous protocols
  if (/^(javascript|vbscript|file):/i.test(trimmed)) {
    return '';
  }

  // Validate allowed protocols
  if (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('/icon/') ||
    trimmed.startsWith('/')
  ) {
    try {
      const validUrl = new URL(trimmed, window.location.origin);
      if (validUrl.protocol === 'blob:' || validUrl.protocol === 'chrome-extension:' || validUrl.protocol === 'http:' || validUrl.protocol === 'https:') {
        return validUrl.href;
      }
    } catch {
      return encodeURI(trimmed);
    }
    return encodeURI(trimmed);
  }

  return '';
}
