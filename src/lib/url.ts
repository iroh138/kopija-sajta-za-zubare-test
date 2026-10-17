/**
 * Prefix an internal path with the configured base path.
 * Base is "/" in production and "/<repo>" on a GitHub Pages project preview.
 */
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export function url(path: string): string {
  if (!path.startsWith('/') || path.startsWith('//')) return path; // external, tel:, mailto:, #hash
  if (BASE && (path === BASE || path.startsWith(`${BASE}/`))) return path; // already prefixed
  return `${BASE}${path}` || '/';
}

/** True for the static GitHub Pages preview, where server routes (booking, admin) cannot run. */
export const IS_STATIC_PREVIEW = import.meta.env.PUBLIC_PREVIEW_STATIC === '1';

/** Absolute URL for an internal path (canonical, JSON-LD, Open Graph). */
export function abs(path: string, site: URL | string): string {
  return new URL(url(path), site).href;
}
