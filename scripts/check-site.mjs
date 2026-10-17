// Post-build checks for the acceptance criteria in the build spec (section 6.7).
// Run after `astro build`: node scripts/check-site.mjs
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = existsSync('dist/client') ? 'dist/client' : 'dist';
const practice = JSON.parse(readFileSync('src/data/practice.json', 'utf8'));
const phone = practice.phone.e164;

// Strings from the analysed source site that must never appear in this build.
const FORBIDDEN = ['Airily', 'airily', 'Zoga', 'Demergis', 'Moorestown', 'Lenola', '242-2111', '242-1660', '263-3094', 'Breathe Better', 'Breathe. Smile', 'Thrive for Life', 'Smile Solutions That Go Beyond', 'Not Sure Where to Start', 'Specialized, High-Tech', 'Lasso', 'MARPE'];

const problems = [];

// Server build: /book and /admin must stay server-rendered, or the form and the admin login silently stop working.
if (root === 'dist/client') {
  for (const p of ['book/index.html', 'admin/index.html']) {
    if (existsSync(join(root, p))) problems.push(`${p} was prerendered in the server build; it must be server-rendered`);
  }
}

const files = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.html') && !relative(root, p).startsWith('admin')) files.push(p); // /admin is staff-only
  }
})(root);

const titles = new Map();
const fail = (file, msg) => problems.push(`${relative(root, file)}: ${msg}`);

for (const file of files) {
  const html = readFileSync(file, 'utf8');

  const h1s = html.match(/<h1[\s>]/g) ?? [];
  if (h1s.length !== 1) fail(file, `expected 1 <h1>, found ${h1s.length}`);

  const title = html.match(/<title>([^<]*)<\/title>/)?.[1];
  if (!title) fail(file, 'missing <title>');
  else titles.set(title, [...(titles.get(title) ?? []), file]);
  if (!/<meta name="description" content="[^"]{20,}"/.test(html)) fail(file, 'missing or short meta description');

  for (const img of html.match(/<img\b[^>]*>/g) ?? []) {
    if (!/\salt="/.test(img)) fail(file, `image without alt: ${img.slice(0, 80)}`);
  }

  for (const m of html.matchAll(/href="tel:([^"]+)"/g)) {
    if (m[1] !== phone) fail(file, `tel link ${m[1]} does not match practice phone ${phone}`);
  }

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    let data;
    try { data = JSON.parse(m[1]); } catch { fail(file, 'invalid JSON-LD'); continue; }
    if (data['@type'] === 'Dentist') {
      if (data.telephone !== phone) fail(file, `JSON-LD telephone ${data.telephone} != ${phone}`);
      if (data.address?.postalCode !== practice.address.postalCode) fail(file, 'JSON-LD postal code mismatch');
      const open = practice.hours.filter((h) => !h.closed).length;
      if (data.openingHoursSpecification?.length !== open) fail(file, 'JSON-LD hours count differs from practice.json');
    }
  }

  if (!html.includes(practice.phone.display)) fail(file, 'visible phone number missing');

  for (const s of FORBIDDEN) if (html.includes(s)) fail(file, `contains source-site string "${s}"`);
}

for (const [title, list] of titles) {
  if (list.length > 1) problems.push(`duplicate <title> "${title}" on ${list.map((f) => relative(root, f)).join(', ')}`);
}

if (problems.length) {
  console.error(`✗ ${problems.length} problem(s) in ${files.length} pages:\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log(`✓ ${files.length} pages passed: one h1, titles unique, alt present, NAP consistent with practice.json, no source-site strings.`);
