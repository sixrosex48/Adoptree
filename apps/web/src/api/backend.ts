/// <reference types="vite/client" />

const backendBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

export function backendApiUrl(path: string): string {
  const apiPath = path.startsWith('/') ? path : `/${path}`;
  return `${backendBaseUrl}${apiPath}`;
}
