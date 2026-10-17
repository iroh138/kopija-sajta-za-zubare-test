import type { APIRoute } from 'astro';
import { abs, url, IS_STATIC_PREVIEW } from '../lib/url';

export const GET: APIRoute = ({ site }) => {
  const sitemap = abs('/sitemap-index.xml', site ?? 'https://www.example.com');
  // The static preview is placeholder content: keep it out of search engines entirely.
  const rules = IS_STATIC_PREVIEW ? 'Disallow: /' : `Disallow: ${url('/admin')}\nDisallow: ${url('/book/thanks')}`;
  return new Response(`User-agent: *\n${rules}\n\nSitemap: ${sitemap}\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
