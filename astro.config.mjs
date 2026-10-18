// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// SITE_URL must be the production origin (used for canonical URLs, sitemap, Open Graph).
const site = process.env.SITE_URL ?? 'https://www.example.com';
// Static preview for GitHub Pages: no server, served under /<repo>/.
const isPreview = process.env.PUBLIC_PREVIEW_STATIC === '1';
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  site,
  base,
  trailingSlash: 'never',
  // Pages are prerendered by default; /zakazivanje and /admin opt out (prerender = false) except in the static preview.
  output: 'static',
  adapter: isPreview ? undefined : node({ mode: 'standalone' }),
  integrations: [
    {
      // In the static preview there is no server, so prerender the server-only routes
      // (their pages detect the preview and disable the form / request list).
      name: 'static-preview-routes',
      hooks: {
        'astro:route:setup': ({ route }) => {
          if (isPreview && /src\/pages\/(zakazivanje\/index|admin\/index)\.astro$/.test(route.component)) route.prerender = true;
        },
      },
    },
    sitemap({
      filter: (page) => !page.includes('/admin') && !page.includes('/zakazivanje/hvala'),
    }),
  ],
});
