/**
 * Safe URL sanitizers to satisfy CodeQL / Security scanners
 * and ensure no javascript: or untrusted protocols can be assigned to DOM attributes.
 */

export function sanitizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('data:application/pdf') ||
    trimmed.startsWith('data:text/') ||
    trimmed.startsWith('/icon/') ||
    trimmed.startsWith('/')
  ) {
    return trimmed;
  }
  return '';
}
