export function isValidExternalBookUrl(rawUrl: string): boolean {
  const trimmed = rawUrl.trim();
  if (!trimmed || trimmed.length < 8 || trimmed.length > 500) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }
    if (!parsed.hostname || !parsed.hostname.includes('.')) {
      return false;
    }
    // Tolak domain contoh/palsu
    const forbiddenHosts = ['example.com', 'example.org', 'localhost', '127.0.0.1'];
    if (forbiddenHosts.includes(parsed.hostname.toLowerCase())) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function sanitizeDocumentId(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return cleaned || `item-${Date.now()}`;
}

export function formatBytes(sizeStr?: string): string {
  if (!sizeStr) return 'Dokumen Google';
  const bytes = Number(sizeStr);
  if (!Number.isFinite(bytes) || bytes <= 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
