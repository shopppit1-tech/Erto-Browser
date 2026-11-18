const STORAGE_KEY = 'erto_api_base_v1';

export function getApiBaseUrl(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)?.trim();
    if (saved) return saved.replace(/\/+$/, '');
  } catch {
    // ignore
  }
  const envUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();
  if (envUrl) return envUrl.replace(/\/+$/, '');
  return '';
}

export function setApiBaseUrl(url: string): void {
  try {
    const cleaned = url.trim().replace(/\/+$/, '');
    if (cleaned) {
      localStorage.setItem(STORAGE_KEY, cleaned);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // ignore
  }
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  if (!base) return path;
  return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}
