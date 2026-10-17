// Lighthouse (mobile) + axe-core audit against a running server.
// Usage: BASE_URL=http://127.0.0.1:4321 CHROME_PATH=/path/to/chrome node scripts/audit.mjs
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import puppeteer from 'puppeteer-core';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:4321';
const PAGES = ['/', '/services', '/services/orthodontics/braces', '/about/team', '/about/blog/welcome', '/patient-info', '/contact', '/book'];
const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');

// 1. Every URL in the sitemap must answer 200 on the running server.
const sitemap = readFileSync('dist/client/sitemap-0.xml', 'utf8');
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
const broken = [];
for (const p of locs) {
  const res = await fetch(BASE + p, { redirect: 'manual' });
  if (res.status !== 200) broken.push(`${res.status} ${p}`);
}
console.log(broken.length ? `✗ broken sitemap URLs:\n  ${broken.join('\n  ')}` : `✓ ${locs.length} sitemap URLs return 200`);

// 2. Lighthouse + axe on representative pages.
const chrome = await chromeLauncher.launch({ chromePath: process.env.CHROME_PATH, chromeFlags: ['--headless=new', '--no-sandbox'] });
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });
let failed = broken.length > 0;

for (const path of PAGES) {
  const url = BASE + path;
  const { lhr } = await lighthouse(url, {
    port: chrome.port, output: 'json', logLevel: 'error',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  });
  const score = (k) => Math.round((lhr.categories[k].score ?? 0) * 100);
  const lcp = lhr.audits['largest-contentful-paint'].displayValue;
  const cls = lhr.audits['cumulative-layout-shift'].displayValue;
  const fails = Object.values(lhr.audits)
    .filter((a) => a.score !== null && a.score < 0.9 && a.scoreDisplayMode === 'binary')
    .map((a) => a.id);

  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 800 });
  await page.goto(url, { waitUntil: 'load' });
  await page.addScriptTag({ content: axeSource });
  const axe = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa', 'best-practice'] });
    return r.violations.map((v) => `${v.id} (${v.impact}, ${v.nodes.length}): ${v.nodes[0].target.join(' ')}`);
  });
  await page.close();

  console.log(`${path}\n  perf ${score('performance')} · a11y ${score('accessibility')} · best ${score('best-practices')} · seo ${score('seo')} · LCP ${lcp} · CLS ${cls}`);
  if (fails.length) console.log(`  lighthouse failing: ${fails.join(', ')}`);
  if (axe.length) console.log(`  axe: ${axe.join('\n       ')}`);
  if (score('accessibility') < 100 || score('seo') < 100 || score('performance') < 90 || axe.length) failed = true;
}

await browser.disconnect();
await chrome.kill();
process.exit(failed ? 1 : 0);
