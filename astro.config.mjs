// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// SITE_URL must be the production origin (used for canonical URLs, sitemap, Open Graph).
const site = process.env.SITE_URL ?? 'https://www.example.com';

export default defineConfig({
  site,
  trailingSlash: 'never',
  // Pages are prerendered by default; /book and /admin opt out (prerender = false).
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/admin') && !page.includes('/book/thanks'),
    }),
  ],
});
